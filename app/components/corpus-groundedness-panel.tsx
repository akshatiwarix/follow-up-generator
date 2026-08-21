import type { CorpusGroundedness } from "@/lib/domain";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-paper-raised px-4 py-3">
      <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">{label}</p>
      <p className="mt-1 font-display text-3xl italic text-ink tabular">{value}</p>
    </div>
  );
}

export function CorpusGroundednessPanel({ groundedness }: { groundedness: CorpusGroundedness }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <Stat label="Overall" value={groundedness.overall} />
      <Stat label="Clean" value={groundedness.clean} />
      <Stat label="Ambiguous" value={groundedness.ambiguous} />
    </div>
  );
}
