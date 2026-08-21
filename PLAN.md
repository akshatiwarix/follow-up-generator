# Day 023 — Follow-Up Generator — Implementation Plan

> This file is the contract. It was settled before any code was written, through a
> structured grilling session, and it is not a starting point to improve on. If the
> code contradicts this file, the code is wrong. If this file needs to change, it
> changes here first, in writing, with the reason.

**Repo:** `follow-up-generator` · **Day:** 023 of 100 · **Time limit:** one day
**Brief (fixed by the master plan):** *A workflow that turns meeting context into a
grounded follow-up draft and next-step summary.*
**Portfolio angle:** sales workflow automation, grounded generation.

---

## Problem

A sales rep leaves a call and owes the prospect a follow-up email — and owes their
own pipeline an accurate next-step. Two failures show up over and over:

**1. Follow-ups drift from what was actually said.** Written from memory, hours or
days later, they smooth over gaps ("I'll just say we'll be in touch") or — worse —
invent specifics that were never agreed ("as discussed, we'll have pricing to you by
Friday" when no date was actually confirmed). The prospect reads confidence; the rep
is guessing.

**2. When generation is automated (an LLM drafts the email), the same failure mode
gets worse, not better.** An LLM asked to "write a follow-up from these notes" will
happily invent a next-meeting date, a resolved objection, or a named stakeholder to
make the prose read smoothly — hallucination dressed as helpfulness, and unlike a
human rep, it will do it with total fluency and no visible hedge.

This repo's subject is that second failure: an LLM-generated follow-up draft and
next-step summary where every factual claim in the draft is machine-checked against
the meeting context it was supposedly drawn from, and gaps in that context are
surfaced as gaps in the output — not filled in.

### What this repo is not

- **Not connected to any other day's code.** Thematically closest to Day 021
  Meeting to CRM (both consume "meeting context") and Day 024 MEDDICC Extractor —
  fully standalone, no shared module, no cross-repo import. Linked from the README
  only.
- **Not an extractor.** Day 021 owns turning a raw transcript into structured CRM
  fields. This repo starts one step downstream — it assumes structured meeting
  context already exists (its own synthetic corpus, shaped similarly but generated
  independently) and turns it into outbound copy.
- **Not a CRM writer.** No write-back to any CRM. Output is a draft a rep would
  copy, review, and send themselves.
- **Not multi-meeting.** One follow-up per one meeting. Account-level rollups
  across several meetings are out of scope for this day.

---

## Intended user

A B2B sales rep (or someone evaluating this as a portfolio piece) who wants to see:
generate a follow-up from meeting notes, and trust that anything it asserts is
actually backed by those notes — not smoothed-over LLM confidence.

## User journey

1. Land on the **Follow-Up Library** — 50 precomputed meetings, each already run
   through the generator, each showing a groundedness score. A corpus-wide panel
   splits the average by clean vs. ambiguous meetings.
2. Open a **meeting detail** page — meeting context on one side, the generated
   follow-up draft and next-step summary on the other, every grounded line showing
   the source field it cites, ungrounded lines visually flagged.
3. Go to **Try It Yourself** — paste your own meeting notes (a small structured
   form, not free text — see Data sources below), get a live-generated draft and
   next-step summary with the same citation/groundedness treatment, no server
   round-trip delay beyond the one real LLM call.

---

## MVP scope

**In:**
- Standalone synthetic corpus of 50 "meeting context" records, ~40% flagged
  ambiguous (one deliberate gap each).
- One real LLM call per meeting (via Vercel AI Gateway), generating a structured
  follow-up draft + next-step summary + per-line citations, done once at corpus-build
  time and committed.
- A pure, deterministic grounding validator that recomputes a groundedness score
  from any (context, generated follow-up) pair.
- Three screens: Follow-Up Library, meeting detail, Try It Yourself (live LLM call).
- `/api/v1/follow-ups` + `/api/schema`.
- `npm run sweep` invariants over the committed corpus.

**Out (see Post-MVP):**
- Editable/regenerate UI on the Library.
- Multi-meeting/account rollup.
- Any CRM write-back.
- Rate limiting beyond a client-side char cap + in-flight lock on Try It Yourself.

---

## Stack

Next.js (App Router) + React + TypeScript strict (`noUncheckedIndexedAccess`),
Tailwind CSS 4, zod at every boundary (API output, corpus load, LLM structured
output), vitest + vite-node for tests/scripts, deployed on Vercel. **One dependency
exception to the series' zero-live-dependency streak:** Vercel AI SDK + AI Gateway,
used to make real model calls. Everything else about the stack matches the
established series convention (Day 001–021).

## Data sources / APIs

- **Vercel AI Gateway** (via `ai` / `@ai-sdk/gateway`, plain `"anthropic/claude-..."`
  model string) — the one live dependency. Used in two places:
  1. `scripts/generate-corpus.mts` — one-time, local, generates the committed
     follow-up corpus. Needs an AI Gateway credential locally when run.
  2. `app/api/generate` (Try It Yourself) — live, per-request. Authenticates via
     Vercel OIDC automatically once deployed on Vercel; no manual key needed in
     production.
- No other external APIs. No database — corpus is a committed JSON file, same
  pattern as every prior day.

---

## System / architecture

```
data/                 deterministic meeting-context generation (seeded RNG) + committed JSON
  ↓
lib/domain/            MeetingContext, ContactFact, CommitmentFact, OpenQuestion,
                        NextMeetingProposal, GeneratedFollowUp, DraftLine, NextStepItem,
                        FollowUpGrade, FollowUpResult, CorpusGroundedness — types + zod
  ↓
lib/generation/         prompt + AI SDK call → GeneratedFollowUp (structured output)
  ↓
lib/grounding/           gradeFollowUp — pure, deterministic citation validator
  ↓
lib/follow-up/           orchestration — assembles FollowUpResult, aggregates CorpusGroundedness
  ↓
app/                      three screens + /api/v1/follow-ups + /api/schema + /api/generate
```

### Rules of the architecture

- `lib/grounding/` is pure and deterministic: same `(MeetingContext,
  GeneratedFollowUp)` pair ⇒ byte-identical `FollowUpGrade`. No network, no
  randomness. Checked by a sweep invariant (recompute matches the committed grade).
- `lib/generation/` is the **only** module that talks to the AI Gateway. It is not
  required to be deterministic — it wraps a real model call — and is exercised at
  corpus-build time and by `/api/generate`, never imported by `lib/grounding/`.
- The Library and meeting detail pages read the precomputed, committed corpus only
  — no LLM call on page load. Try It Yourself is the only page that calls
  `lib/generation/` live (through `/api/generate`, a route handler — Node runtime,
  no `edge` runtime needed for streaming or otherwise).
- Confidence/groundedness is assigned in `lib/grounding/`, from the citation itself
  against the source context — never from whether the draft "reads" plausible.

---

## Data model

```ts
type DealStage =
  | "discovery" | "qualification" | "evaluation"
  | "proposal" | "negotiation" | "closed_won";

type AmbiguityKind =
  | "missing_next_meeting" | "vague_commitment"
  | "unresolved_objection" | "unnamed_stakeholder" | "unclear_deal_stage";

interface ContactFact { name: string | null; role: string; isNamed: boolean; }

interface CommitmentFact {
  by: "rep" | "prospect";
  text: string;
  isVague: boolean; // true for the vague_commitment ambiguity case
}

interface OpenQuestion { text: string; resolved: boolean; }

interface NextMeetingProposal {
  confirmed: boolean;      // false for missing_next_meeting ambiguity case
  timeframe: string | null; // e.g. "next Tuesday" — null when not confirmed
}

interface MeetingContext {
  id: string;
  company: string;
  industry: string;
  dealStage: DealStage;
  stageSignalsConflict: boolean; // true for unclear_deal_stage case
  contacts: ContactFact[];
  painPoints: string[];
  commitments: CommitmentFact[];
  openQuestions: OpenQuestion[];
  nextMeeting: NextMeetingProposal;
  ambiguous: boolean;
  ambiguityKind: AmbiguityKind | null;
}

interface DraftLine {
  text: string;
  citation: { field: string; value: string } | null; // dot-path into MeetingContext, e.g. "nextMeeting.timeframe"
}

interface NextStepItem {
  text: string;
  owner: "rep" | "prospect" | "unassigned";
  dueHint: string | null;
  citation: { field: string; value: string } | null;
}

interface GeneratedFollowUp {
  subject: string;
  draftLines: DraftLine[];
  nextSteps: NextStepItem[];
}

interface FollowUpGrade {
  citationCoverage: number;   // 0-1: fraction of draftLines with a non-null citation
  citationAccuracy: number;   // 0-1: fraction of those citations whose field resolves to a matching value
  groundednessScore: number;  // 0-100: round(100 * coverage * accuracy)
  ungroundedLines: number[];  // indices of draftLines with no citation, for UI flagging
  invalidCitations: number[]; // indices whose citation field/value didn't resolve
}

interface FollowUpResult {
  context: MeetingContext;
  followUp: GeneratedFollowUp;
  grade: FollowUpGrade;
}

interface CorpusGroundedness {
  overall: number; clean: number; ambiguous: number;
}
```

All types have a matching zod schema in `lib/domain/`, used to validate the LLM's
structured output at generation time and the committed corpus at load time.

---

## Method

### Corpus generative model (`data/generate-contexts.ts`)

- Seeded RNG (mulberry32-style, no crypto, no `Math.random()`), fixed seed
  committed in source — same reproducibility guarantee as Day 021.
- 50 `MeetingContext` records. ~40% (20) flagged `ambiguous`, one deliberate
  `ambiguityKind` each (4 of each of the 5 kinds), the remaining 30 clean.
- Small fixed banks (company names, industries, roles, pain-point phrases,
  objection phrases) combined by the seeded RNG — enough variety to be readable,
  not an attempt at exhaustive realism.

### Generation (`lib/generation/`)

- One AI SDK call per `MeetingContext`, using structured output
  (`generateObject`) against the `GeneratedFollowUp` zod schema — the model
  cannot return free text, only the typed shape.
- Prompt instructs: (1) write a short external, prospect-facing follow-up email as
  an ordered list of lines, (2) attach a citation (`field` + `value`) to every line
  that asserts a specific fact, leave `citation: null` only for connective lines
  (greeting, thanks, sign-off) that assert nothing, (3) for any context field that
  is unresolved/unconfirmed (`nextMeeting.confirmed === false`, an unresolved
  `OpenQuestion`, a `CommitmentFact` with `isVague: true`), state that gap plainly
  instead of inventing a specific — this instruction is the whole point of the
  repo and is verified, not trusted (see Grounding below).
- `scripts/generate-corpus.mts` runs this once over all 50 contexts and writes the
  committed `data/follow-up-corpus.json` (context + followUp + grade per entry).
  Requires an AI Gateway credential locally when run; not required at app runtime
  for the Library/detail pages, since they read the committed file.

### Grounding (`lib/grounding/`)

- `gradeFollowUp(context, followUp): FollowUpGrade` — pure function:
  1. `citationCoverage` = non-null-citation lines ÷ total lines.
  2. For each non-null citation, resolve `field` as a dot-path into `context`; the
     citation is **valid** if the resolved value's string form contains (or is
     contained by, case-insensitive) the citation's `value`. `citationAccuracy` =
     valid citations ÷ total non-null citations.
  3. `groundednessScore = round(100 * citationCoverage * citationAccuracy)`.
  4. Records `ungroundedLines` and `invalidCitations` indices for the UI.
- Same function grades every meeting, precomputed and clean/ambiguous corpus
  aggregation happens in `lib/follow-up/`.

---

## Follow-Up Generator (app)

- **`/` Follow-Up Library** — sortable/filterable table (stage, ambiguous/clean,
  groundedness) + a corpus groundedness panel (overall/clean/ambiguous), mirroring
  Day 021's Meeting Library layout.
- **`/follow-ups/[id]` meeting detail** — meeting context panel next to the
  generated draft (each line shows its citation on hover/expand; ungrounded or
  invalid-citation lines visually flagged) and the next-step summary list.
- **`/try-it` Try It Yourself** — a small structured form (not free text) matching
  `MeetingContext` fields, submit calls `/api/generate`, renders the same
  draft/next-step/citation UI live. Input capped (~4000 chars total across fields),
  submit disabled while a request is in flight. No accuracy/grounding claim is
  hidden here — it's graded the same way, live, since grading needs no ground
  truth (unlike Day 021's extraction accuracy, which needs a hidden answer key).

## API surface

- `GET /api/v1/follow-ups` — the full committed corpus (context + followUp +
  grade per entry) + `CorpusGroundedness`.
- `GET /api/v1/follow-ups/[id]` — one entry.
- `GET /api/schema` — zod-derived JSON schema for the API shapes.
- `POST /api/generate` — Try It Yourself only; body is a partial `MeetingContext`,
  response is `FollowUpResult` for that input, generated live.

---

## Implementation task order

1. Scaffold Next.js app (App Router, TS strict, Tailwind 4, ESLint flat config),
   matching Day 021's `package.json` script set plus `ai` / AI Gateway deps.
2. `lib/domain/` — all types + zod schemas above.
3. `data/generate-contexts.ts` + seeded RNG — deterministic `MeetingContext[]`,
   committed as part of build (or generated into the same corpus file as step 5).
4. `lib/generation/` — prompt + AI SDK structured-output call.
5. `lib/grounding/` — `gradeFollowUp`, pure and tested first (TDD: write the
   grading tests against hand-built fixture context/followUp pairs before wiring
   generation).
6. `scripts/generate-corpus.mts` — run generation over all 50 contexts, grade
   each, write committed `data/follow-up-corpus.json`.
7. `lib/follow-up/` — corpus loader + `CorpusGroundedness` aggregation.
8. API routes: `/api/v1/follow-ups`, `/api/v1/follow-ups/[id]`, `/api/schema`,
   `/api/generate`.
9. App screens: Library, meeting detail, Try It Yourself.
10. `scripts/sweep.mts` — invariants (below).
11. Tests: domain schemas, corpus structure, grounding formulas (already written
    in step 5), generation-output schema validation, full read-path.
12. `README.md`, `docs/plain-english-guide.md`, screenshots, `CLAUDE.md`.
13. `git init`, GitHub repo, first + incremental commits/pushes per step.
14. Vercel project link + deploy; confirm AI Gateway auth works in production
    (OIDC, no manual key) and Try It Yourself works live on the deployed URL.

---

## Validation / test plan

`npm test` (vitest):
- `lib/domain/*.test.ts` — schema validation, edge cases.
- `data/generate-contexts.test.ts` — corpus size, ambiguity mix (exactly 20/50,
  4 per `ambiguityKind`), determinism (two generations from the same seed are
  byte-identical).
- `lib/grounding/*.test.ts` — hand-built fixtures: a fully-grounded draft (100
  score), a fully-ungrounded draft (0 score), a partially-invalid-citation draft,
  a draft citing a null/unconfirmed field (must be caught as invalid).
- `lib/follow-up/*.test.ts` — aggregation math.

`npm run sweep` (`scripts/sweep.mts`), over the committed corpus:
1. Corpus size is 50.
2. Ambiguity mix: exactly 20 ambiguous, 4 of each `ambiguityKind`.
3. Every `GeneratedFollowUp` validates against its zod schema.
4. Grading reproducibility: recomputing `gradeFollowUp(context, followUp)` for
   every committed entry matches the committed `grade` byte-for-byte.
5. Groundedness floor: corpus-wide overall groundedness ≥ 80.
6. Difficulty realism: ambiguous-meeting average groundedness < clean-meeting
   average (the ambiguous cases are supposed to be harder to ground perfectly,
   or at minimum show the model correctly flagging the gap rather than
   inventing — either way this should show as measurably different, not equal).
7. Zero-fabrication check: for every ambiguous meeting, scan `draftLines` and
   `nextSteps` for any concrete date/name/detail that does not appear anywhere
   in that meeting's own `MeetingContext` (a stricter, meeting-specific version
   of invariant 4/5 targeted at the exact failure this repo exists to catch).
8. Determinism of `data/generate-contexts.ts` (independent of any LLM call).

Manually verified in-browser once deployed: Library sort/filter, a clean and an
ambiguous meeting both render correctly (including a genuine low-groundedness
case), Try It Yourself submits, generates live, shows citations, respects the
char cap and in-flight lock, and an unknown id 404s properly.

---

## Deployment plan

1. `gh repo create akshatiwarix/follow-up-generator --public --source=. ` (public,
   matching every prior day).
2. `vercel link` to a new Vercel project under the existing Vercel account.
3. Provision AI Gateway on the linked project (Vercel dashboard/CLI) so
   production requests authenticate via OIDC with no manual secret required.
4. For the one-time local `scripts/generate-corpus.mts` run: obtain a local AI
   Gateway credential (`vercel env pull` after linking, or a Gateway API key from
   the Vercel dashboard) — used only at corpus-build time, never committed.
5. `vercel deploy --prod` once the corpus is committed and the app builds clean.

---

## README plan

Follow the series' standard README structure (Why I Built This / What It Does /
Demo / How It Works / Architecture / Key Decisions & Tradeoffs / Getting Started /
Usage / Validation / Limitations / What I'd Build Next / License), with the
groundedness panel and a clean-vs-ambiguous detail-page pair as the two hero
screenshots — mirroring how Day 021's README proved its accuracy claim.

## Definition of done

- All sweep invariants pass on the committed corpus.
- `npm test`, `npm run typecheck`, `npm run lint` all clean.
- Library, meeting detail, and Try It Yourself all manually verified on the
  deployed Vercel URL.
- README complete with real screenshots from the deployed app.
- User has reviewed and considers it shipped.

## Cut order if the day runs out

1. Cut Try It Yourself first (Library + detail alone still prove the concept).
2. Cut the corpus-wide clean/ambiguous split in the UI panel (keep the overall
   number only).
3. Reduce corpus from 50 to 20 meetings (keep the 40% ambiguity ratio).
4. Never cut: the grounding validator, the zero-fabrication sweep invariant, or
   citations in the UI — those are the entire point of the repo.

## Post-MVP (not in this build)

- Editable draft + a "regenerate" button on the Library (live LLM call from
  precomputed pages).
- Multi-meeting account rollup (one follow-up drawing on several past meetings).
- Per-IP rate limiting on `/api/generate` if this were to see real traffic.
- Tone/channel variants (Slack recap vs. email) from the same graded context.

---

## Settled decisions

Recap of the grilling session that produced this plan, for traceability:

- Real LLM call (Vercel AI Gateway, Sonnet-class model) for generation — the
  first day in the series to break the zero-live-dependency streak, deliberately,
  because "grounded generation" is the point of the brief.
- Standalone synthetic corpus, no cross-repo import from Day 021.
- Output = follow-up draft + separate structured next-step summary (both named
  explicitly in the brief).
- Draft is external/prospect-facing; next-step summary is the internal-facing
  artifact.
- One-day time limit, standard for the series.
- Stack unchanged from series convention plus the AI SDK/Gateway addition.
- Groundedness verified via required structured per-line citations, not a
  post-hoc string search or blind trust — validated against the source context,
  scored as coverage × accuracy, corpus-split clean vs. ambiguous like Day 021.
- Demo pattern: corpus precomputed/committed (zero live cost per visitor) +
  Try It Yourself as the only live-LLM surface.
- Next-step items are structured (`text`, `owner`, `dueHint`), not freeform, so
  they can be graded/checked the same way as the draft.
- Ambiguous-context fields must be stated as gaps, not invented — enforced as a
  hard sweep invariant, not a prompt-only hope.
- Try It Yourself guarded by a client-side char cap + in-flight submit lock; no
  rate-limiting infrastructure — appropriate for a low-traffic portfolio demo.
