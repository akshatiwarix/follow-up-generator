import { NextResponse } from "next/server";
import { loadCorpusEntry } from "@/lib/follow-up";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = loadCorpusEntry(id);

  if (!entry) {
    return NextResponse.json({ error: `No follow-up found for id "${id}"` }, { status: 404 });
  }

  return NextResponse.json(entry);
}
