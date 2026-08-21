import type { NextStepItem } from "@/lib/domain";

const OWNER_LABELS: Record<NextStepItem["owner"], string> = {
  rep: "Rep",
  prospect: "Prospect",
  unassigned: "Unassigned",
};

export function NextStepsList({ nextSteps }: { nextSteps: NextStepItem[] }) {
  if (nextSteps.length === 0) {
    return <p className="text-sm text-ink-dim">No next steps generated for this meeting.</p>;
  }

  return (
    <ul className="space-y-3">
      {nextSteps.map((step, index) => (
        <li key={index} className="rounded-md border border-line bg-paper-raised p-3">
          <p className="text-sm text-ink">{step.text}</p>
          <p className="mt-1 font-mono text-xs text-ink-dim">
            {OWNER_LABELS[step.owner]}
            {step.dueHint ? ` · ${step.dueHint}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
