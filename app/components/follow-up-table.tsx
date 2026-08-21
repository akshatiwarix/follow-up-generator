"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FollowUpResult } from "@/lib/domain";
import { GroundednessBadge } from "./groundedness-badge";
import { STAGE_LABELS } from "./stage-label";

type SortKey = "company" | "dealStage" | "groundedness";
type AmbiguityFilter = "all" | "clean" | "ambiguous";

function compare(a: FollowUpResult, b: FollowUpResult, key: SortKey): number {
  switch (key) {
    case "company":
      return a.context.company.localeCompare(b.context.company);
    case "dealStage":
      return a.context.dealStage.localeCompare(b.context.dealStage);
    case "groundedness":
      return a.grade.groundednessScore - b.grade.groundednessScore;
  }
}

export function FollowUpTable({ entries }: { entries: FollowUpResult[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("groundedness");
  const [sortAsc, setSortAsc] = useState(false);
  const [ambiguityFilter, setAmbiguityFilter] = useState<AmbiguityFilter>("all");

  const rows = useMemo(() => {
    const filtered = entries.filter((entry) => {
      if (ambiguityFilter === "clean") return !entry.context.ambiguous;
      if (ambiguityFilter === "ambiguous") return entry.context.ambiguous;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => compare(a, b, sortKey));
    return sortAsc ? sorted : sorted.reverse();
  }, [entries, sortKey, sortAsc, ambiguityFilter]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((asc) => !asc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-2 font-mono text-xs uppercase tracking-wide">
        {(["all", "clean", "ambiguous"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setAmbiguityFilter(option)}
            className={`rounded-full border px-3 py-1 ${
              ambiguityFilter === option
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink-dim hover:border-line-strong"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-paper-raised">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-xs uppercase tracking-wide text-ink-dim">
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("company")}>
                Company
              </th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("dealStage")}>
                Stage
              </th>
              <th className="px-4 py-3">Ambiguity</th>
              <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort("groundedness")}>
                Groundedness
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.context.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/follow-ups/${entry.context.id}`}
                    className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                  >
                    {entry.context.company}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-dim">{STAGE_LABELS[entry.context.dealStage]}</td>
                <td className="px-4 py-3 text-ink-dim">
                  {entry.context.ambiguous ? entry.context.ambiguityKind : "clean"}
                </td>
                <td className="px-4 py-3">
                  <GroundednessBadge score={entry.grade.groundednessScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
