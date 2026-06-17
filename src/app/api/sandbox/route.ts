import { NextResponse } from "next/server";

export type SandboxData = {
  title: string;
  description: string;
  features: string[];
  basicPrice: string;
  basicDesc: string;
  proPrice: string;
  proDesc: string;
  proTag: string;
  email: string;
};

const defaultContent: SandboxData = {
  title: "Lensmor 测试官网",
  description: "这是一个用于测试 Lensmor Monitor 差异对比引擎的虚拟网站。",
  features: [
    "基于最新的 AI 大模型驱动",
    "支持多租户架构隔离",
    "支持 Jina Reader 网页快照提取",
  ],
  basicPrice: "$41.99 / 月",
  basicDesc: "适合个人开发者，支持最多 4 个监控任务。",
  proPrice: "$79.99 / 月",
  proDesc: "适合中小型企业，支持无限任务与 API 接入。",
  proTag: "",
  email: "contact@lensmor.test",
};

const g = global as unknown as { sandboxContent?: SandboxData };
if (!g.sandboxContent) g.sandboxContent = { ...defaultContent };

export async function GET() {
  return NextResponse.json(g.sandboxContent);
}

export async function POST(req: Request) {
  const body = await req.json();
  g.sandboxContent = { ...defaultContent, ...body };
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  g.sandboxContent = { ...defaultContent };
  return NextResponse.json({ success: true });
}
