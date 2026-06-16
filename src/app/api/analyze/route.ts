import { NextResponse } from "next/server";
import { mockReportData } from "../../mock_data";

// 全局任务存储，伪异步核心 (在开发和无状态边缘环境中会丢失，只适用于 POC)
const globalStore = global as unknown as { taskStore: Map<string, any> };
if (!globalStore.taskStore) {
  globalStore.taskStore = new Map();
}
const taskStore = globalStore.taskStore;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 设置状态为 pending
    taskStore.set(taskId, { status: "pending", data: null });

    // 伪后台处理: 延迟 3 秒后变为 completed，并将 Mock 数据注入
    setTimeout(() => {
      // 此处将 URL 透传回数据
      const resultData = {
        ...mockReportData,
        url: url
      };
      taskStore.set(taskId, { status: "completed", data: resultData });
      console.log(`Task ${taskId} completed`);
    }, 3000);

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
