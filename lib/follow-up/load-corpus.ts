import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { followUpResultSchema, type FollowUpResult } from "@/lib/domain";

const CORPUS_PATH = path.join(process.cwd(), "data", "follow-up-corpus.json");

/** Reads and validates the committed corpus. Server-only (uses node:fs). */
export function loadCorpus(): FollowUpResult[] {
  const raw = readFileSync(CORPUS_PATH, "utf-8");
  return z.array(followUpResultSchema).parse(JSON.parse(raw));
}

export function loadCorpusEntry(id: string): FollowUpResult | undefined {
  return loadCorpus().find((entry) => entry.context.id === id);
}
