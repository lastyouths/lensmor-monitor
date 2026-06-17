import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function POST(req: Request) {
  let body: { report_id?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是合法 JSON" }, { status: 400 });
  }

  const { report_id, type } = body;
  if (!report_id) return NextResponse.json({ error: "Missing report_id" }, { status: 400 });
  if (!type || !["useful", "wrong", "not_important"].includes(type)) {
    return NextResponse.json({ error: "type 必须是 useful / wrong / not_important 之一" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // upsert: 同一用户对同一报告只保留最新一条反馈
  const { error } = await supabase
    .from("report_feedbacks")
    .upsert(
      { report_id, user_id: session.user.id, type },
      { onConflict: "report_id,user_id" }
    );

  if (error) {
    // 表不存在时优雅降级，不阻断前端体验
    console.error("[feedback] upsert error:", error);
    return NextResponse.json({ error: "保存反馈失败", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const report_id = searchParams.get("report_id");
  if (!report_id) return NextResponse.json({ error: "Missing report_id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("report_feedbacks")
    .select("type")
    .eq("report_id", report_id)
    .eq("user_id", session.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ type: data?.type ?? null });
}
