import { NextResponse } from "next/server";
import { mockReportData, ReportData } from "../../mock_data";

// Vercel Hobby 计划最大允许 60s，防止分析任务被 10s 默认超时杀死
export const maxDuration = 60;
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient as createSupabaseServerClient } from "../../../utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const customOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

type TaskEntry = { status: string; data?: ReportData | null; error?: string; requiresLogin?: boolean };

const globalStore = global as unknown as { taskStore: Map<string, TaskEntry> };
if (!globalStore.taskStore) {
  globalStore.taskStore = new Map();
}
const taskStore = globalStore.taskStore;

const reportSchema = z.object({
  companyName: z.string(),
  summary: z.string().describe("详细的网页内容快照，包含所有价格数值、核心功能、标语文案等"),
  companyProfile: z.object({
    founded: z.string(),
    type: z.string(),
    stage: z.string(),
    location: z.string(),
    employees: z.string(),
    targetMarket: z.string(),
  }),
  differences: z.array(z.object({
    id: z.string(),
    type: z.enum(["added", "removed", "modified"]),
    category: z.enum(["pricing", "marketing", "feature", "operation"]),
    oldContent: z.string(),
    newContent: z.string(),
    reasoning: z.string(),
  })),
  advices: z.array(z.object({
    id: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    title: z.string(),
    description: z.string(),
  })),
});

// 抓取页面内容：本地直接 fetch，外部走 Jina（强制无缓存）
async function fetchPageContent(taskId: string, url: string): Promise<string> {
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    console.log(`[${taskId}] 直接 fetch 本地页面: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Local fetch failed: ${res.status}`);
    const html = await res.text();
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<img[^>]+alt=["']([^"']+)["'][^>]*/gi, ' [图片: $1] ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000);
  } else {
    console.log(`[${taskId}] Jina 抓取外部页面: ${url}`);
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "text/markdown",
        "X-Return-Format": "markdown",
        "X-No-Cache": "true",
        "X-Timeout": "30",
      }
    });
    if (!res.ok) throw new Error(`Jina fetch failed: ${res.status}`);
    return (await res.text()).substring(0, 15000);
  }
}

/**
 * 两阶段 diff 策略：
 *   - 首次采集：只抓取原文存入 DB，做基础信息提取，differences = []
 *   - 非首次：拿上次 raw_content + 本次 raw_content 同时给 LLM，做精确逐字 diff
 */
async function processAnalysisTask(
  taskId: string,
  url: string,
  previousRawContent: string | null,
  userId?: string
) {
  try {
    // Mock 降级（无 API Key）
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
      console.log(`[${taskId}] 无 OPENAI_API_KEY，使用 Mock 数据`);
      await new Promise(r => setTimeout(r, 2000));
      const mockResult = { ...mockReportData, url };
      await saveToDatabase(taskId, mockResult, "mock", userId);
      taskStore.set(taskId, { status: "completed", data: mockResult, requiresLogin: !userId });
      return;
    }

    const modelName = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

    // ── Step 1: 抓取当前页面原始内容 ──
    const currentContent = await fetchPageContent(taskId, url);
    console.log(`[${taskId}] 抓取完成: ${currentContent.length} 字符`);

    // ── Step 2: 首次采集 → 存原文，提取基本信息，不做 diff ──
    if (!previousRawContent) {
      console.log(`[${taskId}] 首次采集，建立基准快照，不做 diff`);
      const { object } = await generateObject({
        model: customOpenAI(modelName),
        schema: reportSchema,
        prompt: `你是商业分析专家。这是对该网站的【首次采集】，请完成以下任务：
1. 提取 companyName、companyProfile、summary（详细记录所有价格、功能、标语）。
2. differences 必须返回空数组 []，因为没有历史基准可对比。
3. advices 返回一条提示说明已建立基准。
所有内容用简体中文。

目标 URL: ${url}
=== 当前页面内容 ===
${currentContent}
=== 结束 ===`,
      });

      const result: ReportData = {
        ...object,
        url,
        differences: [],
        advices: [{
          id: "baseline",
          priority: "low",
          title: "✅ 基准快照已建立",
          description: "下次触发分析时，系统将把新内容与本次原文逐字对比，自动检出所有变更。"
        }],
      };
      await saveToDatabase(taskId, result, currentContent, userId);
      taskStore.set(taskId, { status: "completed", data: result, requiresLogin: !userId });
      console.log(`[${taskId}] ✅ 首次采集完成，原文已存储 (${currentContent.length} 字符)`);
      return;
    }

    // ── Step 3: 非首次 → 上次原文 + 本次原文 → LLM 精确 diff ──
    console.log(`[${taskId}] 有历史原文 (${previousRawContent.length} 字符)，开始精确 diff 分析...`);
    const { object } = await generateObject({
      model: customOpenAI(modelName),
      schema: reportSchema,
      prompt: `你是商业竞品分析专家。我给你同一网站两次采集的原始内容，请逐字逐句精确对比。

=== 上一次采集内容（基准）===
${previousRawContent.substring(0, 7000)}
=== 上一次结束 ===

=== 本次采集内容（最新）===
${currentContent.substring(0, 7000)}
=== 本次结束 ===

【任务要求】
1. differences：找出两次内容之间所有真实变动（价格数值、功能增删、文案修改、新增模块等）。若完全一致则返回 []，绝对不允许捏造！
2. summary：基于本次内容，详细描述当前页面的价格、功能、核心标语。
3. companyProfile：从本次内容提取公司基本信息。
4. advices：针对检测到的变动，给出战略应对建议。
所有内容用简体中文。目标 URL: ${url}`,
    });

    const finalData: ReportData = { ...object, url };
    await saveToDatabase(taskId, finalData, currentContent, userId);
    taskStore.set(taskId, { status: "completed", data: finalData, requiresLogin: !userId });
    console.log(`[${taskId}] ✅ Diff 完成，发现 ${finalData.differences?.length ?? 0} 处变更`);

  } catch (error) {
    console.error(`[${taskId}] 处理失败:`, error);
    taskStore.set(taskId, { status: "error", error: error instanceof Error ? error.message : String(error) });
  }
}

async function saveToDatabase(taskId: string, finalData: ReportData, rawContent: string, userId?: string) {
  if (!userId) {
    console.warn(`[${taskId}] 未登录用户，跳过数据库保存`);
    return;
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const safeRawContent = rawContent || "[FALLBACK_NO_CONTENT]";
    console.log(`[${taskId}] 保存到 Supabase... rawContent 长度=${rawContent?.length ?? 'NULL'}`);
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    // Step A: INSERT 主字段（不含 raw_content，绕过 PostgREST 新增列 INSERT 权限问题）
    const { data: newRow, error: dbError } = await supabase.from('reports').insert({
      user_id: userId,
      url: finalData.url,
      company_name: finalData.companyName,
      summary: finalData.summary,
      company_profile: finalData.companyProfile,
      social_sentiment: {},
      historical_timeline: [],
      differences: finalData.differences,
      advices: finalData.advices,
    }).select('id').single();

    if (dbError && dbError.message.includes("row-level security")) {
      console.warn(`[${taskId}] RLS 拒绝插入，跳过`);
    } else if (dbError) {
      console.error(`[${taskId}] 数据库保存失败:`, dbError);
      throw new Error(`数据库保存失败: ${dbError.message}`);
    } else {
      console.log(`[${taskId}] ✅ INSERT 成功，row id=${newRow?.id}`);

      // Step B: UPDATE raw_content（UPDATE 权限已验证可用）
      if (newRow?.id) {
        const { error: updateError } = await supabase
          .from('reports')
          .update({ raw_content: safeRawContent })
          .eq('id', newRow.id);

        if (updateError) {
          console.error(`[${taskId}] raw_content UPDATE 失败:`, updateError.message);
        } else {
          console.log(`[${taskId}] ✅ raw_content 已写入 (${safeRawContent.length} 字符)`);
        }
      }

      await supabase
        .from('monitor_targets')
        .update({ last_run_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('url', finalData.url);
    }
  }
}

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: "仅支持 http/https 协议的 URL" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "URL 格式不合法，请确保包含 https://" }, { status: 400 });
  }
  if (url.length > 500) {
    return NextResponse.json({ error: "URL 过长，请勿超过 500 个字符" }, { status: 400 });
  }

  try {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let userId: string | undefined = undefined;
    let previousRawContent: string | null = null;

    try {
      const supabaseServer = await createSupabaseServerClient();
      const { data: { session } } = await supabaseServer.auth.getSession();
      userId = session?.user?.id;

      // 同步拉取上次该 URL 的原始抓取内容（作为 diff 基准）
      let query = supabaseServer
        .from('reports')
        .select('raw_content')
        .eq('url', url)
        .order('created_at', { ascending: false })
        .limit(1);

      if (userId) query = query.eq('user_id', userId) as typeof query;

      const { data } = await query;
      previousRawContent = data?.[0]?.raw_content ?? null;
      console.log(`[${taskId}] 上次原文: ${previousRawContent ? previousRawContent.length + ' 字符' : '无（首次采集）'}`);
    } catch {
      console.warn("未获取到登录信息");
    }

    // BUG-03: 标记未登录，供前端 toast 提示
    if (!userId) {
      taskStore.set(taskId, { status: "pending", data: null, requiresLogin: true });
    } else {
      taskStore.set(taskId, { status: "pending", data: null });
    }

    processAnalysisTask(taskId, url, previousRawContent, userId).catch(console.error);

    return NextResponse.json({ taskId, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  const task = taskStore.get(taskId);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}
