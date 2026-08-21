# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Day 023 of a 100-day portfolio series. A workflow that turns synthetic meeting
context into an LLM-generated follow-up draft and next-step summary, every
factual claim carrying a citation back to the meeting-context field it's drawn
from, checked by a separate deterministic grader. **`PLAN.md` is the contract for
this repo** — it was settled with the user before any code was written (and
amended in place, in writing, whenever an external constraint forced a change:
the AI Gateway credit-card requirement, the free-tier quota wall) and is not a
draft to improve on. If code and `PLAN.md` disagree, the code is wrong. Read
`PLAN.md` in full before implementing anything — it contains the data model, the
generation prompt's field-path convention, the grounding formula, and the
numbered implementation task order this repo was built in.

## Commands

- `npm run dev` — start the dev server.
- `npm run build` — production build.
- `npm run typecheck` — `next typegen && tsc --noEmit`.
- `npm run lint` — ESLint (flat config, `eslint-config-next`).
- `npm test` / `npm run test:watch` — vitest over `lib/**/*.test.ts` and
  `data/**/*.test.ts`.
- `npm run sweep` — `vite-node` script (`scripts/sweep.mts`) asserting the eight
  corpus-wide invariants listed in `PLAN.md` (§ Validation / test plan). No
  network — reads the already-committed corpus.
- `npm run corpus` — regenerates/resumes the committed follow-up corpus from
  `scripts/generate-corpus.mts`. **This one makes real network calls** to Google
  Generative AI and needs `GOOGLE_GENERATIVE_AI_API_KEY` in the environment
  (`.env.local`, gitignored). Only run this if you mean to spend quota — it's not
  needed for local dev, tests, typecheck, lint, or sweep, all of which read the
  already-committed `data/follow-up-corpus.json`.
- Run a single test file: `npx vitest run lib/grounding/grade-follow-up.test.ts`.

## Architecture

Six downward-only dependency layers.

```
data/                 deterministic meeting-context generation (seeded RNG) + committed JSON
  ↓
lib/domain/            MeetingContext, GeneratedFollowUp, FollowUpGrade, FollowUpResult — types + zod
  ↓
lib/generation/         prompt + AI SDK call (Google Gemini) → GeneratedFollowUp
  ↓
lib/grounding/           gradeFollowUp — pure, deterministic citation validator
  ↓
lib/follow-up/           orchestration — corpus loader, groundedness aggregation, Try-It input
  ↓
app/                      three screens + /api/v1/follow-ups + /api/schema + /api/generate
```

Load-bearing rules (each enforced by a `npm run sweep` invariant — see
`PLAN.md`):

- `lib/grounding/` is pure and deterministic: same `(MeetingContext,
  GeneratedFollowUp)` pair ⇒ byte-identical `FollowUpGrade`. No network, no
  unseeded `Math.random()`.
- `lib/generation/` is the **only** module that talks to the model provider. It
  is exercised at corpus-build time (`scripts/generate-corpus.mts`) and by
  `app/api/generate` (Try It Yourself) — never imported by `lib/grounding/`.
- The citation `field` a model emits must be a dot-path that resolves against
  the *exact* JSON shape `lib/generation/prompt.ts` serialized into the prompt.
  If you change `MeetingContext`'s shape, the prompt's example paths and
  `lib/grounding/resolve-field.ts` need to stay in lockstep, or citations will
  silently fail to resolve.
- **Never import from the `@/lib/follow-up` or `@/lib/generation` barrel
  (`index.ts`) inside a `"use client"` component.** Both barrels re-export
  `load-corpus.ts`, which uses `node:fs`, and bundling that into client code
  crashes Turbopack ("does not support external modules: node:fs"). This
  already bit `try-it-form.tsx` once — client components must import the
  specific file they need (e.g. `@/lib/follow-up/try-it-input`), not the
  barrel.
- Corpus-shape changes (meeting count, ambiguity mix) can silently invalidate a
  cached id in `scripts/generate-corpus.mts`'s resume logic. The script guards
  against this by comparing a cached entry's full context content, not just its
  id, before reusing it — don't remove that check.

## Stack

Next.js (App Router) + React + TypeScript strict with
`noUncheckedIndexedAccess`, Tailwind CSS 4, zod at every boundary (API output,
corpus load, LLM structured output), vitest + vite-node for tests/scripts,
deployed on Vercel. **One live dependency, unlike every other day in this
series:** the AI SDK (`ai` + `@ai-sdk/google`), calling Google Generative AI
directly — not the Vercel AI Gateway, which requires a credit card even for its
free tier. Model is `gemini-3.5-flash` specifically, not a `-latest` alias: the
free-tier key caps every current-generation Flash model at a flat 20
requests/day, and Pro tier is unusable entirely (0 quota) — see `PLAN.md`
§ Settled decisions for the full story before changing the model id.

## Corpus

`data/generate-contexts.ts` produces 20 deterministic `MeetingContext` records
(seeded RNG, fixed seed) — 8 flagged ambiguous, one deliberate gap each
(`missing_next_meeting`, `vague_commitment`, `unresolved_objection`,
`unnamed_stakeholder`, `unclear_deal_stage`). `scripts/generate-corpus.mts` then
calls Gemini once per context and grades the result, writing the committed
`data/follow-up-corpus.json`. If you touch the generator or need to add
meetings, re-run `npm run corpus` (needs `GOOGLE_GENERATIVE_AI_API_KEY`, and
mind the 20-requests/day quota) and then `npm run sweep` to confirm all eight
invariants still hold.

@AGENTS.md
