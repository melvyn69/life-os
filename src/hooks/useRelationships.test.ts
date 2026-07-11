import { describe, expect, it } from "vitest";
import { getRelationshipDetailNextPageParam } from "@/hooks/useRelationships";
import type { RelationshipDetail } from "@/types/relationships";

type DetailCursorPage = {
  evidence: Array<{ created_at: string; id: string }>;
  history: Array<{ created_at: string; id: string }>;
  page_info: RelationshipDetail["page_info"];
};

const evidenceItem = {
  id: "10000000-0000-4000-8000-000000000001",
  created_at: "2026-07-10T12:00:00.000Z"
};

const historyItem = {
  id: "20000000-0000-4000-8000-000000000002",
  created_at: "2026-07-10T11:00:00.000Z"
};

function buildPage(): DetailCursorPage {
  return {
    evidence: [evidenceItem],
    history: [historyItem],
    page_info: {
      evidence_next_cursor: null,
      evidence_has_more: false,
      history_next_cursor: "2026-07-10T11:00:00.000Z|20000000-0000-4000-8000-000000000002",
      history_has_more: true
    }
  };
}

describe("relationship detail combined pagination", () => {
  it("keeps an exhausted evidence cursor terminal while history continues", () => {
    const nextPage = getRelationshipDetailNextPageParam(
      buildPage(),
      1,
      { evidenceCursor: null, historyCursor: null }
    );

    expect(nextPage).toEqual({
      evidenceCursor: `${evidenceItem.created_at}|${evidenceItem.id}`,
      historyCursor: "2026-07-10T11:00:00.000Z|20000000-0000-4000-8000-000000000002"
    });
  });

  it("does not restart an already exhausted empty collection", () => {
    const page = buildPage();
    page.evidence = [];

    const nextPage = getRelationshipDetailNextPageParam(
      page,
      2,
      { evidenceCursor: "terminal-evidence-cursor", historyCursor: "prior-history-cursor" }
    );

    expect(nextPage?.evidenceCursor).toBe("terminal-evidence-cursor");
  });
});
