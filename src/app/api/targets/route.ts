import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: targets, error } = await supabase
      .from('monitor_targets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ targets });
  } catch (err) {
    console.error("Fetch targets error:", err);
    return NextResponse.json({ error: "Failed to fetch targets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { url, name } = await req.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('monitor_targets')
      .insert({
        user_id: session.user.id,
        url,
        name: name || new URL(url).hostname,
        frequency: 'daily',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ target: data });
  } catch (err) {
    console.error("Create target error:", err);
    return NextResponse.json({ error: "Failed to create target" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, frequency, status } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates: any = {};
    if (frequency) updates.frequency = frequency;
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('monitor_targets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ target: data });
  } catch (err) {
    console.error("Update target error:", err);
    return NextResponse.json({ error: "Failed to update target" }, { status: 500 });
  }
}
