import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { defaultContent, type SandboxData } from "../../../lib/sandboxStore";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

export async function GET() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("sandbox_content")
    .select("content")
    .eq("id", "default")
    .single();

  const content: SandboxData = data?.content && Object.keys(data.content).length > 0
    ? data.content as SandboxData
    : defaultContent;

  const res = NextResponse.json(content);
  // 完全禁用 GET 接口的 CDN 缓存和浏览器缓存
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  res.headers.set('Surrogate-Control', 'no-store');
  return res;
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabase();
  await supabase
    .from("sandbox_content")
    .upsert({ id: "default", content: { ...defaultContent, ...body }, updated_at: new Date().toISOString() });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = getSupabase();
  await supabase
    .from("sandbox_content")
    .upsert({ id: "default", content: defaultContent, updated_at: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
