import type { FollowUpsResponse } from "@/lib/domain";
import { CorpusGroundednessPanel } from "./corpus-groundedness-panel";
import { FollowUpTable } from "./follow-up-table";

export function FollowUpLibrary({ response }: { response: FollowUpsResponse }) {
  return (
    <div className="space-y-6">
      <CorpusGroundednessPanel groundedness={response.groundedness} />
      <FollowUpTable entries={response.entries} />
    </div>
  );
}
