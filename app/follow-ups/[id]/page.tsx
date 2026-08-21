import { notFound } from "next/navigation";
import Link from "next/link";
import { loadCorpusEntry } from "@/lib/follow-up";
import { MeetingContextPanel } from "@/app/components/meeting-context-panel";
import { DraftView } from "@/app/components/draft-view";
import { NextStepsList } from "@/app/components/next-steps-list";
import { GroundednessBadge } from "@/app/components/groundedness-badge";

export default async function FollowUpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = loadCorpusEntry(id);

  if (!entry) notFound();

  const { context, followUp, grade } = entry;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        ← Back to Follow-Up Library
      </Link>

      <header className="mt-4 flex flex-wrap items-baseline gap-3">
        <h1 className="font-display text-3xl italic text-ink sm:text-4xl">{context.company}</h1>
        <GroundednessBadge score={grade.groundednessScore} />
        {context.ambiguous && (
          <span className="font-mono text-xs uppercase tracking-wide text-ink-dim">
            {context.ambiguityKind}
          </span>
        )}
      </header>
      <p className="mt-1 text-ink-dim">
        Groundedness = citation coverage × citation accuracy, recomputed from the committed
        draft and context — not a stored, trust-me number.
      </p>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-xl italic text-ink">Meeting context</h2>
          <div className="mt-3 rounded-lg border border-line bg-paper-raised p-4">
            <MeetingContextPanel context={context} />
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl italic text-ink">Follow-up draft</h2>
          <div className="mt-3 rounded-lg border border-line bg-paper-raised p-4">
            <DraftView followUp={followUp} grade={grade} />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl italic text-ink">Next steps</h2>
        <div className="mt-3 max-w-2xl">
          <NextStepsList nextSteps={followUp.nextSteps} />
        </div>
      </section>
    </main>
  );
}
