import { NextResponse } from "next/server";
import { getContent, setContent, resetContent } from "../../../lib/sandboxStore";

export async function GET() {
  return NextResponse.json(getContent());
}

export async function POST(req: Request) {
  const body = await req.json();
  setContent(body);
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  resetContent();
  return NextResponse.json({ success: true });
}
