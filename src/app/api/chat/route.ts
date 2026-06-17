import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const customOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

type MsgPart = { type: string; text?: string };
type RawMessage = { role?: string; content?: unknown; parts?: MsgPart[] };

// Extract plain text from a UIMessage (ai v6 format has .parts[])
function extractText(msg: RawMessage): string {
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text ?? '')
      .join('');
  }
  return typeof msg.content === 'string' ? msg.content : '';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reportData = {} } = body;

    // Safely get messages array regardless of format
    const rawMessages: RawMessage[] = Array.isArray(body.messages)
      ? body.messages
      : typeof body.messages === 'object' && body.messages !== null
        ? Object.values(body.messages)
        : [];

    const modelName = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

    const systemPrompt = `你是一个顶尖的商业战略参谋（如麦肯锡或贝恩的资深合伙人）。
你的老板刚刚查阅了一份关于竞争对手或目标公司（${reportData.companyName || '未知公司'}）的最新监控情报。
现在老板正在向你发起深度追问。

【核心情报上下文】
目标公司: ${reportData.companyName || '未知公司'}
网页快照摘要: ${reportData.summary || '无'}
最近发现的实质性差异变动 (Diff): ${JSON.stringify(reportData.differences || [])}
情报系统初步给出的执行层建议: ${JSON.stringify(reportData.advices || [])}

【你的回答原则】
1. 回答必须基于上述【核心情报上下文】，如问到具体变动，必须结合 Diff 数据来回答。
2. 保持冷静、客观、犀利、一针见血，不需要客套寒暄。
3. 给出可直接落地执行的"销售话术"、"产品防守策略"或"市场营销打法"。
4. 使用 Markdown 格式输出（加粗、列表等）。
5. 必须全部使用中文（简体）回复。`;

    // Manually convert UIMessage[] → CoreMessage[] (works with both ai v5 and v6 formats)
    const coreMessages: { role: 'user' | 'assistant'; content: string }[] = rawMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: extractText(m) }))
      .filter((m) => m.content.trim() !== '');

    console.log('[Chat] messages count:', coreMessages.length, 'company:', reportData.companyName);

    const result = await streamText({
      model: customOpenAI(modelName),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
