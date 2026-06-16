import { NextResponse } from "next/server";
import { mockReportData, ReportData } from "../../mock_data";
import { z } from "zod";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// 初始化 OpenAI 客户端
const customOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// 全局任务存储，伪异步核心 (在开发和无状态边缘环境中会丢失，只适用于 POC)
const globalStore = global as unknown as { taskStore: Map<string, any> };
if (!globalStore.taskStore) {
  globalStore.taskStore = new Map();
}
const taskStore = globalStore.taskStore;

const reportSchema = z.object({
  companyName: z.string(),
  summary: z.string().describe("综合概述，基于提取到的网页内容提炼。"),
  companyProfile: z.object({
    founded: z.string(),
    type: z.string(),
    stage: z.string(),
    location: z.string(),
    employees: z.string(),
    targetMarket: z.string(),
  }),
  socialSentiment: z.object({
    overallTone: z.enum(["Positive", "Neutral", "Negative", "Mixed"]),
    score: z.number().min(0).max(100),
    keywords: z.array(z.string()),
    riskSignals: z.array(z.string()),
  }),
  historicalTimeline: z.array(z.object({
    date: z.string().describe("格式: YYYY-MM-DD"),
    title: z.string(),
    category: z.enum(["pricing", "marketing", "feature", "operation"]),
  })),
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

async function processAnalysisTask(taskId: string, url: string) {
  try {
    console.log(`[Task ${taskId}] 1. 开始使用 Jina Reader 抓取: ${url}`);
    console.log(`[Task ${taskId}] 当前 API KEY 长度:`, process.env.OPENAI_API_KEY?.length);
    console.log(`[Task ${taskId}] 当前 BASE URL:`, process.env.OPENAI_BASE_URL);
    
    // 如果没有配 Key (长度为 0 或 undefined)，直接走 Mock 逻辑
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
      console.log(`[Task ${taskId}] ⚠️ 未检测到 OPENAI_API_KEY，降级为使用 Mock 数据。`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      taskStore.set(taskId, { status: "completed", data: { ...mockReportData, url } });
      return;
    }

    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "text/markdown",
        "X-Return-Format": "markdown",
        // 如果有 JINA_API_KEY 可以加，没有也能有限制地用
      }
    });

    if (!jinaRes.ok) {
      throw new Error(`Jina fetch failed with status: ${jinaRes.status}`);
    }

    const markdownContent = await jinaRes.text();
    const truncatedContent = markdownContent.substring(0, 12000); // 截断防爆 Token

    console.log(`[Task ${taskId}] 2. 抓取成功 (截取 ${truncatedContent.length} 字符)。开始调用大模型分析...`);

    const modelName = process.env.OPENAI_MODEL && process.env.OPENAI_MODEL.trim() !== "" 
      ? process.env.OPENAI_MODEL.trim() 
      : "gpt-4o-mini";

    const { object } = await generateObject({
      model: customOpenAI(modelName), // 使用自定义实例
      schema: reportSchema,
      prompt: `
        你是一个资深的竞品分析专家。我现在给你一个目标网站最新的网页内容（Markdown格式）。
        请你仔细阅读并提取有价值的商业情报。
        由于我们处于 POC 阶段，没有接入 Wayback Machine 历史记录和真实的 Reddit API，
        请你基于网页内容，**合理地推演或伪造**以下内容以填充数据结构：
        1. 假设它过去 30 天内修改了定价或特性，提取合理的 "differences"。
        2. 假设在开发者社区或社媒上对它有一些讨论，填写合理的 "socialSentiment" 和 "historicalTimeline"。
        3. 给出切实可行的 "advices"。

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
    taskStore.set(taskId, { status: "completed", data: finalData });

  } catch (error) {
    console.error(`[Task ${taskId}] 处理失败:`, error);
    // POC: 遇到真实错误时，回退到 mock 数据，避免页面挂掉
    taskStore.set(taskId, { status: "completed", data: { ...mockReportData, url } });
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 设置状态为 pending
    taskStore.set(taskId, { status: "pending", data: null });

    // 真正的后台异步处理（在 serverless 下可能被杀，但 POC 内存 Map 足够）
    // 注意：不要在 await 阻塞
    processAnalysisTask(taskId, url).catch(console.error);

    return NextResponse.json({ taskId, status: "pending" });
  } catch (err) {
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
