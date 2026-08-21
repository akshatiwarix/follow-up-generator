import { NextResponse } from "next/server";
import { z } from "zod";
import { followUpsResponseSchema } from "@/lib/domain";

/** Rendered straight from the zod schema so it cannot drift from the implementation. */
export async function GET() {
  return NextResponse.json({ response: z.toJSONSchema(followUpsResponseSchema) });
}
