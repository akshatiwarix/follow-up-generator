"use client";

import { useMemo, useState } from "react";
import { toMeetingContext, type TryItInput } from "@/lib/follow-up/try-it-input";
import type { DealStage, FollowUpResult } from "@/lib/domain";
import { STAGE_LABELS } from "./stage-label";
import { MeetingContextPanel } from "./meeting-context-panel";
import { DraftView } from "./draft-view";
import { NextStepsList } from "./next-steps-list";

const DEAL_STAGES: DealStage[] = [
  "discovery",
  "qualification",
  "evaluation",
  "proposal",
  "negotiation",
  "closed_won",
];

const MAX_TOTAL_CHARS = 4000;

const DEFAULT_INPUT: TryItInput = {
  company: "Northwind Robotics",
  industry: "robotics",
  dealStage: "evaluation",
  stageSignalsConflict: false,
  contactName: "Priya Patel",
  contactRole: "Director of Engineering",
  painPoints: ["manual QA on the assembly line", "slow incident response times"],
  repCommitment: "send a rollout timeline",
  repCommitmentVague: false,
  prospectCommitment: "confirm headcount for the pilot",
  prospectCommitmentVague: false,
  openQuestion: "who owns final budget approval",
  nextMeetingConfirmed: false,
  nextMeetingTimeframe: "",
};

function totalChars(input: TryItInput): number {
  return JSON.stringify(input).length;
}

export function TryItForm() {
  const [input, setInput] = useState<TryItInput>(DEFAULT_INPUT);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<FollowUpResult | null>(null);

  const charCount = useMemo(() => totalChars(input), [input]);
  const overLimit = charCount > MAX_TOTAL_CHARS;
  const previewContext = useMemo(() => toMeetingContext(input), [input]);

  function update<K extends keyof TryItInput>(key: K, value: TryItInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (overLimit || status === "loading") return;

    setStatus("loading");
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = (await response.json()) as FollowUpResult | { error: string };
      if (!response.ok) {
        throw new Error("error" in body ? body.error : "Generation failed.");
      }
      setResult(body as FollowUpResult);
      setStatus("idle");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Generation failed.");
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Company
            <input
              value={input.company}
              onChange={(e) => update("company", e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
            />
          </label>
          <label className="text-sm">
            Industry
            <input
              value={input.industry}
              onChange={(e) => update("industry", e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          Deal stage
          <div className="mt-1 flex items-center gap-3">
            <select
              value={input.dealStage}
              onChange={(e) => update("dealStage", e.target.value as DealStage)}
              className="w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
            >
              {DEAL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
            <label className="flex shrink-0 items-center gap-1 text-xs text-ink-dim">
              <input
                type="checkbox"
                checked={input.stageSignalsConflict}
                onChange={(e) => update("stageSignalsConflict", e.target.checked)}
              />
              signals conflict
            </label>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Contact name <span className="text-ink-dim">(blank = unnamed)</span>
            <input
              value={input.contactName}
              onChange={(e) => update("contactName", e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
            />
          </label>
          <label className="text-sm">
            Contact role
            <input
              value={input.contactRole}
              onChange={(e) => update("contactRole", e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          Pain points <span className="text-ink-dim">(one per line)</span>
          <textarea
            value={input.painPoints.join("\n")}
            onChange={(e) =>
              update(
                "painPoints",
                e.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
              )
            }
            rows={3}
            className="mt-1 w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          Rep committed to
          <div className="mt-1 flex items-center gap-2">
            <input
              value={input.repCommitment}
              onChange={(e) => update("repCommitment", e.target.value)}
              className="w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
            />
            <label className="flex shrink-0 items-center gap-1 text-xs text-ink-dim">
              <input
                type="checkbox"
                checked={input.repCommitmentVague}
                onChange={(e) => update("repCommitmentVague", e.target.checked)}
              />
              vague
            </label>
          </div>
        </label>

        <label className="block text-sm">
          Prospect committed to
          <div className="mt-1 flex items-center gap-2">
            <input
              value={input.prospectCommitment}
              onChange={(e) => update("prospectCommitment", e.target.value)}
              className="w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
            />
            <label className="flex shrink-0 items-center gap-1 text-xs text-ink-dim">
              <input
                type="checkbox"
                checked={input.prospectCommitmentVague}
                onChange={(e) => update("prospectCommitmentVague", e.target.checked)}
              />
              vague
            </label>
          </div>
        </label>

        <label className="block text-sm">
          Open question <span className="text-ink-dim">(optional)</span>
          <input
            value={input.openQuestion}
            onChange={(e) => update("openQuestion", e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-paper-raised p-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          Next meeting
          <div className="mt-1 flex items-center gap-2">
            <label className="flex shrink-0 items-center gap-1 text-xs text-ink-dim">
              <input
                type="checkbox"
                checked={input.nextMeetingConfirmed}
                onChange={(e) => update("nextMeetingConfirmed", e.target.checked)}
              />
              confirmed
            </label>
            <input
              value={input.nextMeetingTimeframe}
              onChange={(e) => update("nextMeetingTimeframe", e.target.value)}
              disabled={!input.nextMeetingConfirmed}
              placeholder="e.g. next Tuesday"
              className="w-full rounded-md border border-line bg-paper-raised p-2 text-sm disabled:opacity-50"
            />
          </div>
        </label>

        <div className="flex items-center justify-between">
          <p className={`font-mono text-xs ${overLimit ? "text-ground-low" : "text-ink-dim"}`}>
            {charCount} / {MAX_TOTAL_CHARS} chars
          </p>
          <button
            type="submit"
            disabled={overLimit || status === "loading"}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {status === "loading" ? "Generating…" : "Generate follow-up"}
          </button>
        </div>
        {errorMessage && <p className="text-sm text-ground-low">{errorMessage}</p>}
      </form>

      <div>
        <h2 className="font-display text-xl italic text-ink">
          {result ? "Generated follow-up" : "Meeting context preview"}
        </h2>
        <p className="mt-1 text-xs text-ink-dim">
          Runs a real, live model call — no accuracy grade beyond groundedness here, since
          there&apos;s no ground truth for a meeting you made up yourself.
        </p>
        <div className="mt-3 rounded-lg border border-line bg-paper-raised p-4">
          {result ? (
            <div className="space-y-6">
              <DraftView followUp={result.followUp} grade={result.grade} />
              <div>
                <h3 className="font-mono text-xs uppercase tracking-wide text-ink-dim">Next steps</h3>
                <div className="mt-2">
                  <NextStepsList nextSteps={result.followUp.nextSteps} />
                </div>
              </div>
            </div>
          ) : (
            <MeetingContextPanel context={previewContext} />
          )}
        </div>
      </div>
    </div>
  );
}
