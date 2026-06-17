import { NextResponse } from "next/server";
import { mockReportData, ReportData } from "../../mock_data";

// Vercel Hobby 计划最大允许 60s，防止分析任务被 10s 默认超时杀死
export const maxDuration = 60;
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createClient as createSupabaseServerClient } from "../../../utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 初始化 OpenAI 客户端
const customOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

type TaskEntry = { status: string; data?: ReportData | null; error?: string; requiresLogin?: boolean };

// 全局任务存储，伪异步核心 (在开发和无状态边缘环境中会丢失，只适用于 POC)
const globalStore = global as unknown as { taskStore: Map<string, TaskEntry> };
if (!globalStore.taskStore) {
  globalStore.taskStore = new Map();
}
const taskStore = globalStore.taskStore;

const reportSchema = z.object({
  companyName: z.string(),
  summary: z.string().describe("【重要】极其详细的网页内容快照记录。必须包含页面上出现的所有具体价格数值、核心功能列表、标语文案等具体细节。这将作为未来进行差异比对的唯一基准数据，越详细越好。"),
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

async function processAnalysisTask(taskId: string, url: string, pastReports: Record<string, unknown>[], userId?: string) {
  try {
    console.log(`[Task ${taskId}] 当前 API KEY 长度:`, process.env.OPENAI_API_KEY?.length);
    console.log(`[Task ${taskId}] 传入的 userId:`, userId);
    console.log(`[Task ${taskId}] 同步获取到的历史记录条数:`, pastReports.length);
    
    // 如果没有配 Key (长度为 0 或 undefined)，直接走 Mock 逻辑
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
      console.log(`[Task ${taskId}] ⚠️ 未检测到 OPENAI_API_KEY，降级为使用 Mock 数据。`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      const mockResult = { ...mockReportData, url };
      await saveToDatabase(taskId, mockResult, "mock_raw_content", userId);
      taskStore.set(taskId, { status: "completed", data: mockResult, requiresLogin: !userId });
      return;
    }

    let truncatedContent = "";
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      console.log(`[Task ${taskId}] 1. 目标是本地测试页面，直接抓取: ${url}`);
      const localRes = await fetch(url);
      if (!localRes.ok) throw new Error(`Local fetch failed with status: ${localRes.status}`);
      const htmlContent = await localRes.text();
      
      // 简单剥离下 HTML 标签，但专门保留图片的 alt 信息以便 AI 能够“看到”图片的存在
      let textContent = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                   .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // 提取图片 alt
      textContent = textContent.replace(/<img[^>]+alt=["']([^"']+)["'][^>]*>/gi, ' [图片: $1] ');
      textContent = textContent.replace(/<img[^>]+>/gi, ' [图片] ');
      
      // 剥离其他标签
      truncatedContent = textContent.replace(/<[^>]+>/g, ' ')
                                    .replace(/\s+/g, ' ')
                                    .trim()
                                    .substring(0, 12000);
    } else {
      console.log(`[Task ${taskId}] 1. 开始使用 Jina Reader 抓取: ${url}`);
      const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          "Accept": "text/markdown",
          "X-Return-Format": "markdown",
        }
      });

      if (!jinaRes.ok) {
        throw new Error(`Jina fetch failed with status: ${jinaRes.status}`);
      }

      const markdownContent = await jinaRes.text();
      truncatedContent = markdownContent.substring(0, 12000); // 截断防爆 Token
    }

    console.log(`[Task ${taskId}] 2. 抓取成功 (截取 ${truncatedContent.length} 字符)。开始调用大模型分析...`);

    const modelName = process.env.OPENAI_MODEL && process.env.OPENAI_MODEL.trim() !== "" 
      ? process.env.OPENAI_MODEL.trim() 
      : "gpt-4o-mini";

    // --- 真实比对逻辑核心注入 ---
    // 尝试获取该 URL 最新的历史报告作为 oldContent
    let previousContentContext = "";

    if (pastReports && pastReports.length > 0) {
      const lastReport = pastReports[0] as { social_sentiment?: { rawContent?: string }; created_at: string };
      const previousRawContent = lastReport.social_sentiment?.rawContent || "无记录";
      previousContentContext = `
      【重要上下文：历史原始网页内容】
      上一次采集时间：${new Date(lastReport.created_at).toISOString()}
      上一次的完整网页原始内容如下，这是你进行差异比对的唯一且最准确的基准：
      
      <<< 上一次网页内容开始 >>>
      ${previousRawContent}
      <<< 上一次网页内容结束 >>>
      `;
      console.log(`[Task ${taskId}] 2.5 成功注入历史RAW文本进行比对`);
    } else {
      console.log(`[Task ${taskId}] 2.5 这是首次采集，无历史上下文`);
      previousContentContext = `【重要上下文】这是该目标网站的第一次采集，没有历史数据。因此，所有的差异比对（differences）都应当为空数组 []。`;
    }

    const { object } = await generateObject({
      model: customOpenAI(modelName), // 使用自定义实例
      schema: reportSchema,
      prompt: `
        你是一个资深的商业分析与数据挖掘专家。我现在给你一个目标网站最新的网页内容（Markdown格式）。
        
        ${previousContentContext}

        请你仔细阅读并提取有价值的商业情报。
        
        【真实比对逻辑要求】
        1. 核心任务是做“网站调整和定价对比的分析”。我们不再关注社媒舆情和历史事件。
        2. 关于 "differences"：如果存在【历史原始网页内容】，请你将它与当前最新的网页内容进行逐字逐句的严格比对！提取**真正**的变动（重点关注定价数值的调整、功能增删、营销话术改变等）。如果这是第一次采集，或者真的没有实质性变动，必须严格返回空数组 []！绝对不允许无中生有！
        3. 关于 "summary"：请提取当前网页中所有的具体价格、数据、核心功能和标语，写成一篇极其详细的快照摘要。
        4. 给出切实可行的 "advices"（基于网站内容和定价的变化给出战略建议）。
        
        **非常重要：你返回的所有分析内容、总结、建议、字段说明等，必须全部使用中文（简体）！**

        目标网站 URL: ${url}
        === 网页内容 ===
        ${truncatedContent}
        === 网页内容结束 ===
      `,
    });

    const finalData: ReportData = {
      ...object,
      url: url,
    };

    console.log(`[Task ${taskId}] 3. 大模型分析完毕！`);
    
    // 保存到数据库
    await saveToDatabase(taskId, finalData, truncatedContent, userId);

    taskStore.set(taskId, { status: "completed", data: finalData, requiresLogin: !userId });

  } catch (error) {
    console.error(`[Task ${taskId}] 处理失败:`, error);
    // 不再使用 mock 数据兜底，直接将任务状态标记为 error，并将错误信息传递给前端
    taskStore.set(taskId, { status: "error", error: error instanceof Error ? error.message : String(error) });
  }
}

async function saveToDatabase(taskId: string, finalData: ReportData, rawContent: string, userId?: string) {
  if (!userId) {
    console.warn(`[Task ${taskId}] 未登录用户，跳过数据库保存（reports.user_id NOT NULL 约束）。`);
    return;
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    console.log(`[Task ${taskId}] 4. 正在保存到 Supabase 数据库... 使用 service_role 权限`);
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from('reports').insert({
      user_id: userId,
      url: finalData.url,
      company_name: finalData.companyName,
      summary: finalData.summary,
      company_profile: finalData.companyProfile,
      social_sentiment: { rawContent },
      historical_timeline: [],
      differences: finalData.differences,
      advices: finalData.advices,
    });

// 如果是由于 RLS 导致插入失败（因为没有绑定有效的 user_id），但作为 POC 依然允许在前端展示 diff
    if (dbError && dbError.message.includes("row-level security")) {
      console.warn(`[Task ${taskId}] 由于 RLS 策略保存到数据库失败，但允许继续返回数据给前端。`);
      // 继续向下执行
    } else if (dbError) {
      console.error(`[Task ${taskId}] 保存到数据库失败:`, dbError);
      throw new Error(`数据库保存失败: ${dbError.message}`);
    } else {
      console.log(`[Task ${taskId}] 5. 成功保存到数据库！`);
      // 更新 monitor_targets 的 last_run_at
      if (userId) {
        await supabase
          .from('monitor_targets')
          .update({ last_run_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('url', finalData.url);
      }
    }
  }
}

export async function POST(req: Request) {
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    // BUG-05 fix: 非 JSON 请求体返回 400 而非 500
    return NextResponse.json({ error: "请求体必须是合法 JSON" }, { status: 400 });
  }

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // BUG-04 fix: 服务端 URL 格式与协议校验
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

    // 获取当前用户会话以便鉴权
    let userId: string | undefined = undefined;
    let pastReports: Record<string, unknown>[] = [];
    
    try {
      const supabaseServer = await createSupabaseServerClient();
      const { data: { session } } = await supabaseServer.auth.getSession();
      userId = session?.user?.id;

      // 在这里（前台同步生命周期内）去拿历史记录，避开后台取不到 cookies 的问题
      const query = supabaseServer
        .from('reports')
        .select('summary, company_profile, social_sentiment, created_at')
        .eq('url', url)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const { data } = await query;
      if (data) pastReports = data;
    } catch {
      console.warn("未获取到登录信息，可能处于非强制 Auth 模式");
    }

    // 设置状态为 pending
    taskStore.set(taskId, { status: "pending", data: null });

    // 真正的后台异步处理（在 serverless 下可能被杀，但 POC 内存 Map 足够）
    processAnalysisTask(taskId, url, pastReports, userId).catch(console.error);

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
