import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient
} from "@tanstack/react-query";
import {
  archiveRelationship,
  confirmRelationship,
  correctRelationship,
  getRelationshipDetail,
  getRelationshipReviewQueue,
  listEntityRelationships,
  markRelationshipOutdated,
  rejectRelationship,
  restoreRelationship,
  setRelationshipVisibility
} from "@/services/relationships";
import type {
  Relationship,
  RelationshipCorrection,
  RelationshipDatePrecision,
  RelationshipDetail,
  RelationshipReviewFilter
} from "@/types/relationships";

const initialRelationshipCursor: string | null = null;
const initialRelationshipDetailCursor: {
  evidenceCursor: string | null;
  historyCursor: string | null;
} = {
  evidenceCursor: null,
  historyCursor: null
};

export function useRelationshipDetail(relationshipId: string | null) {
  const query = useInfiniteQuery({
    queryKey: ["relationships", "detail", relationshipId],
    queryFn: ({ pageParam }) => getRelationshipDetail(
      requireRelationshipId(relationshipId),
      pageParam.evidenceCursor,
      pageParam.historyCursor
    ),
    initialPageParam: initialRelationshipDetailCursor,
    getNextPageParam: (lastPage, pages, lastPageParam) =>
      getRelationshipDetailNextPageParam(lastPage, pages.length, lastPageParam),
    enabled: relationshipId !== null,
    staleTime: 60_000
  });

  return {
    ...query,
    data: mergeRelationshipDetailPages(query.data?.pages ?? [])
  };
}

export function getRelationshipDetailNextPageParam(
  lastPage: {
    evidence: Array<{ created_at: string; id: string }>;
    history: Array<{ created_at: string; id: string }>;
    page_info: RelationshipDetail["page_info"];
  },
  pageCount: number,
  lastPageParam: typeof initialRelationshipDetailCursor
) {
  if (pageCount >= 5) {
    return undefined;
  }
  if (!lastPage.page_info.evidence_has_more && !lastPage.page_info.history_has_more) {
    return undefined;
  }
  return {
    evidenceCursor: lastPage.page_info.evidence_has_more
      ? lastPage.page_info.evidence_next_cursor
      : terminalCursor(lastPage.evidence, lastPageParam.evidenceCursor),
    historyCursor: lastPage.page_info.history_has_more
      ? lastPage.page_info.history_next_cursor
      : terminalCursor(lastPage.history, lastPageParam.historyCursor)
  };
}

function terminalCursor(
  items: Array<{ created_at: string; id: string }>,
  fallback: string | null
) {
  const lastItem = items.at(-1);
  return lastItem ? `${lastItem.created_at}|${lastItem.id}` : fallback;
}

export function useRelationshipReviewQueue(filter: RelationshipReviewFilter) {
  return useInfiniteQuery({
    queryKey: ["relationships", "review", filter],
    queryFn: ({ pageParam }) => getRelationshipReviewQueue(filter, pageParam),
    initialPageParam: initialRelationshipCursor,
    getNextPageParam: (lastPage) => lastPage.page_info.has_more
      ? lastPage.page_info.next_cursor
      : undefined,
    staleTime: 15_000
  });
}

export function useEntityRelationships(entityId: string) {
  return useQuery({
    queryKey: ["entities", entityId, "relationships"],
    queryFn: () => listEntityRelationships(entityId),
    enabled: Boolean(entityId),
    staleTime: 30_000
  });
}

export function useConfirmRelationship() {
  return useRelationshipMutation(confirmRelationship);
}

export function useRejectRelationship() {
  return useRelationshipMutation((input: { relationshipId: string; reason: string | null }) =>
    rejectRelationship(input)
  );
}

export function useCorrectRelationship() {
  return useRelationshipMutation((input: RelationshipCorrection) => correctRelationship(input));
}

export function useMarkRelationshipOutdated() {
  return useRelationshipMutation((input: {
    relationshipId: string;
    endDate: string | null;
    datePrecision: RelationshipDatePrecision;
  }) => markRelationshipOutdated(input));
}

export function useSetRelationshipVisibility() {
  return useRelationshipMutation((input: { relationshipId: string; isVisible: boolean }) =>
    setRelationshipVisibility(input)
  );
}

export function useArchiveRelationship() {
  return useRelationshipMutation((relationshipId: string) => archiveRelationship(relationshipId));
}

export function useRestoreRelationship() {
  return useRelationshipMutation((relationshipId: string) => restoreRelationship(relationshipId));
}

function useRelationshipMutation<Input>(mutationFn: (input: Input) => Promise<Relationship>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (relationship) => invalidateRelationshipConsumers(queryClient, relationship)
  });
}

async function invalidateRelationshipConsumers(
  queryClient: QueryClient,
  relationship: Relationship
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["relationships", "detail", relationship.id] }),
    queryClient.invalidateQueries({ queryKey: ["graph", "focused", relationship.source_entity_id] }),
    queryClient.invalidateQueries({ queryKey: ["graph", "focused", relationship.target_entity_id] }),
    queryClient.invalidateQueries({ queryKey: ["relationships", "review"] }),
    queryClient.invalidateQueries({ queryKey: ["entities", relationship.source_entity_id, "relationships"] }),
    queryClient.invalidateQueries({ queryKey: ["entities", relationship.target_entity_id, "relationships"] }),
    queryClient.invalidateQueries({ queryKey: ["briefings"] })
  ]);
}

function requireRelationshipId(value: string | null) {
  if (!value) {
    throw new Error("A relationship ID is required.");
  }
  return value;
}

function mergeRelationshipDetailPages(pages: RelationshipDetail[]) {
  const firstPage = pages[0];
  const lastPage = pages.at(-1);
  if (!firstPage || !lastPage) {
    return undefined;
  }

  const evidenceById = new Map(firstPage.evidence.map((evidence) => [evidence.id, evidence]));
  const historyById = new Map(firstPage.history.map((entry) => [entry.id, entry]));
  for (const page of pages.slice(1)) {
    for (const evidence of page.evidence) {
      evidenceById.set(evidence.id, evidence);
    }
    for (const entry of page.history) {
      historyById.set(entry.id, entry);
    }
  }

  return {
    ...lastPage,
    evidence: [...evidenceById.values()],
    history: [...historyById.values()]
  };
}
