import type { MeetingContext } from "@/lib/domain";
import { STAGE_LABELS } from "./stage-label";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wide text-ink-dim">{label}</p>
      <div className="mt-1 text-sm text-ink">{children}</div>
    </div>
  );
}

export function MeetingContextPanel({ context }: { context: MeetingContext }) {
  return (
    <div className="space-y-4">
      <Field label="Company">
        {context.company} · {context.industry}
      </Field>

      <Field label="Deal stage">
        {STAGE_LABELS[context.dealStage]}
        {context.stageSignalsConflict && (
          <span className="ml-2 text-ground-medium">(signals conflict)</span>
        )}
      </Field>

      <Field label="Contacts">
        <ul className="space-y-1">
          {context.contacts.map((contact, index) => (
            <li key={index}>
              {contact.name ?? <span className="italic text-ink-dim">unnamed</span>} — {contact.role}
            </li>
          ))}
        </ul>
      </Field>

      <Field label="Pain points">
        <ul className="list-inside list-disc space-y-1">
          {context.painPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </Field>

      <Field label="Commitments">
        <ul className="space-y-1">
          {context.commitments.map((commitment, index) => (
            <li key={index}>
              <span className="text-ink-dim">{commitment.by === "rep" ? "Rep" : "Prospect"}:</span>{" "}
              {commitment.text}
              {commitment.isVague && <span className="ml-2 text-ground-medium">(vague)</span>}
            </li>
          ))}
        </ul>
      </Field>

      {context.openQuestions.length > 0 && (
        <Field label="Open questions">
          <ul className="list-inside list-disc space-y-1">
            {context.openQuestions.map((question, index) => (
              <li key={index}>{question.text}</li>
            ))}
          </ul>
        </Field>
      )}

      <Field label="Next meeting">
        {context.nextMeeting.confirmed ? (
          context.nextMeeting.timeframe
        ) : (
          <span className="text-ground-medium">not confirmed</span>
        )}
      </Field>
    </div>
  );
}
