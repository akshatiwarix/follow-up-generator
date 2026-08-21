import { groundednessBand, GROUNDEDNESS_BAND_CLASSES } from "./groundedness-style";

export function GroundednessBadge({ score }: { score: number }) {
  const band = groundednessBand(score);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular ${GROUNDEDNESS_BAND_CLASSES[band]}`}
    >
      {score}
    </span>
  );
}
