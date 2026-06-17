import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from('reports').select('id, url, is_read, user_id').limit(10);
  return NextResponse.json({ data });
}