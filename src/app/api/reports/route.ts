import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (targetUrl) {
      query = query.eq('url', targetUrl);
    } else {
      query = query.limit(10); // default limit if not filtering by url
    }

    const { data: reports, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ reports });
  } catch (err) {
    console.error("Fetch reports error:", err);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
