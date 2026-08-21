import type { MeetingContext } from "@/lib/domain";

/**
 * Resolves a dot-path (as emitted by the model in a citation, e.g.
 * "nextMeeting.timeframe" or "commitments.0.text") against a MeetingContext.
 * Returns the resolved value's string form, or undefined if the path doesn't
 * resolve to a primitive (missing segment, or resolves to an object/array).
 */
export function resolveField(context: MeetingContext, path: string): string | undefined {
  const segments = path.split(".");
  let current: unknown = context;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) return undefined;
      current = current[index];
      continue;
    }

    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  if (current === null || current === undefined) return undefined;
  if (typeof current === "string" || typeof current === "number" || typeof current === "boolean") {
    return String(current);
  }
  return undefined;
}
