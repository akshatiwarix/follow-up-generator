import Link from "next/link";
import { loadCorpus, aggregateCorpusGroundedness } from "@/lib/follow-up";
import { FollowUpLibrary } from "@/app/components/follow-up-library";

export default function Home() {
  const entries = loadCorpus();
  const groundedness = aggregateCorpusGroundedness(entries);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">
          Day 023 of 100 · Follow-Up Generator
        </p>
        <h1 className="mt-2 font-display text-4xl italic text-ink sm:text-5xl">
          A follow-up draft that says what it doesn&apos;t know.
        </h1>
        <p className="mt-4 text-ink-dim">
          {entries.length} synthetic meetings, each turned into an LLM-generated follow-up draft
          and next-step summary — every factual claim carrying a citation back to the meeting
          context it came from, checked by a deterministic grader rather than trusted on faith.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="https://github.com/akshatiwarix/follow-up-generator"
          >
            Source
          </a>
          <Link
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="/try-it"
          >
            Try It Yourself
          </Link>
          <Link
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="/api/v1/follow-ups"
          >
            GET /api/v1/follow-ups
          </Link>
          <Link
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="/api/schema"
          >
            GET /api/schema
          </Link>
          <a
            className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            href="https://github.com/akshatiwarix/follow-up-generator/blob/main/PLAN.md"
          >
            Plan
          </a>
        </p>
      </header>

      <FollowUpLibrary response={{ entries, groundedness }} />

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-dim">
        Synthetic corpus — every draft is a real, one-time LLM call (Google Gemini),
        precomputed and committed. No live model call happens when you load this page; the only
        live call in this app is on the Try It Yourself page.
      </footer>
    </main>
  );
}
