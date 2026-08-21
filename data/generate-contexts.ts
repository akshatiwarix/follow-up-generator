import { Rng, derive } from "@/lib/rng";
import type { MeetingContext, AmbiguityKind, DealStage, CommitmentFact, ContactFact, OpenQuestion } from "@/lib/domain";
import * as banks from "./banks";

export const CORPUS_SEED = 20230923;
export const CORPUS_SIZE = 50;

export const AMBIGUITY_KINDS: readonly AmbiguityKind[] = [
  "missing_next_meeting",
  "vague_commitment",
  "unresolved_objection",
  "unnamed_stakeholder",
  "unclear_deal_stage",
];
export const AMBIGUOUS_COUNT = 20; // 4 of each kind, ~40% of CORPUS_SIZE

const DEAL_STAGES: readonly DealStage[] = [
  "discovery",
  "qualification",
  "evaluation",
  "proposal",
  "negotiation",
  "closed_won",
];

function generateContacts(rng: Rng, ambiguityKind: AmbiguityKind | null): ContactFact[] {
  const contactCount = rng.intBetween(1, 2);
  return Array.from({ length: contactCount }, (_, index) => {
    const isLast = index === contactCount - 1;
    if (ambiguityKind === "unnamed_stakeholder" && isLast) {
      const role = rng.pick(banks.roles);
      const department = role.replace(/^(VP|Director of|Head of)\s+/, "").toLowerCase();
      return { name: null, role: `someone from ${department}`, isNamed: false };
    }
    return { name: rng.pick(banks.contactNames), role: rng.pick(banks.roles), isNamed: true };
  });
}

function generateCommitments(rng: Rng, ambiguityKind: AmbiguityKind | null): CommitmentFact[] {
  const commitmentCount = rng.intBetween(2, 3);
  return Array.from({ length: commitmentCount }, (_, index) => {
    const by = index % 2 === 0 ? "rep" : "prospect";
    if (ambiguityKind === "vague_commitment" && index === 0) {
      return { by, text: rng.pick(banks.vagueCommitments), isVague: true };
    }
    const text = by === "rep" ? rng.pick(banks.repCommitments) : rng.pick(banks.prospectCommitments);
    return { by, text, isVague: false };
  });
}

function generateOpenQuestions(rng: Rng, ambiguityKind: AmbiguityKind | null): OpenQuestion[] {
  const count = rng.intBetween(0, 2);
  const questions: OpenQuestion[] = rng
    .sample(banks.openQuestions, count)
    .map((text) => ({ text, resolved: false }));
  if (ambiguityKind === "unresolved_objection") {
    questions.push({ text: rng.pick(banks.objections), resolved: false });
  }
  return questions;
}

function generateOne(index: number, seed: number): MeetingContext {
  const meetingSeed = derive(seed, `meeting-${index}`);
  const rng = new Rng(meetingSeed);

  const ambiguous = index < AMBIGUOUS_COUNT;
  const ambiguityKind = ambiguous ? (AMBIGUITY_KINDS[index % AMBIGUITY_KINDS.length] as AmbiguityKind) : null;

  const nextMeeting =
    ambiguityKind === "missing_next_meeting"
      ? { confirmed: false, timeframe: null }
      : { confirmed: true, timeframe: rng.pick(banks.timeframes) };

  return {
    id: `m-${String(index + 1).padStart(3, "0")}`,
    company: banks.companies[index % banks.companies.length] as string,
    industry: rng.pick(banks.industries),
    dealStage: rng.pick(DEAL_STAGES),
    stageSignalsConflict: ambiguityKind === "unclear_deal_stage",
    contacts: generateContacts(rng, ambiguityKind),
    painPoints: rng.sample(banks.painPoints, rng.intBetween(1, 3)),
    commitments: generateCommitments(rng, ambiguityKind),
    openQuestions: generateOpenQuestions(rng, ambiguityKind),
    nextMeeting,
    ambiguous,
    ambiguityKind,
  };
}

/** Deterministic: same seed always produces byte-identical output. */
export function generateMeetingContexts(seed: number = CORPUS_SEED): MeetingContext[] {
  return Array.from({ length: CORPUS_SIZE }, (_, index) => generateOne(index, seed));
}
