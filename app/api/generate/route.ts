import { NextResponse } from "next/server";
import { generateFollowUp } from "@/lib/generation";
import { gradeFollowUp } from "@/lib/grounding";
import { tryItInputSchema, toMeetingContext } from "@/lib/follow-up";
import type { FollowUpResult } from "@/lib/domain";

/**
 * Try It Yourself's only live call. No auth, no rate limiting — guarded by
 * the field length caps in tryItInputSchema (bounds the prompt to roughly
 * 4000 chars) and the client's in-flight submit lock. See PLAN.md § Settled
 * decisions.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = tryItInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
  }

  const context = toMeetingContext(parsed.data);

  try {
    const followUp = await generateFollowUp(context);
    const grade = gradeFollowUp(context, followUp);
    const result: FollowUpResult = { context, followUp, grade };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
