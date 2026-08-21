import { NextResponse } from "next/server";
import { loadCorpus, aggregateCorpusGroundedness } from "@/lib/follow-up";
import type { FollowUpsResponse } from "@/lib/domain";

/** No auth, no live model call — reads the committed corpus. */
export async function GET() {
  const entries = loadCorpus();
  const response: FollowUpsResponse = {
    entries,
    groundedness: aggregateCorpusGroundedness(entries),
  };
  return NextResponse.json(response);
}
