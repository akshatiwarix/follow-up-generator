import type { GeneratedFollowUp, FollowUpGrade } from "@/lib/domain";

export function DraftView({ followUp, grade }: { followUp: GeneratedFollowUp; grade: FollowUpGrade }) {
  const invalid = new Set(grade.invalidCitations);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">Subject</p>
      <p className="mt-1 font-display text-lg italic text-ink">{followUp.subject}</p>

      <div className="mt-4 space-y-3">
        {followUp.draftLines.map((line, index) => {
          const isInvalid = invalid.has(index);
          return (
            <div
              key={index}
              className={isInvalid ? "rounded-md border border-ground-low bg-ground-low-dim p-3" : ""}
            >
              <p className="text-sm text-ink">{line.text}</p>
              {line.citation && (
                <p
                  className={`mt-1 font-mono text-xs ${isInvalid ? "text-ground-low" : "text-ink-dim"}`}
                >
                  {isInvalid
                    ? `citation doesn't match ${line.citation.field}: "${line.citation.value}"`
                    : `cites ${line.citation.field}: "${line.citation.value}"`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
