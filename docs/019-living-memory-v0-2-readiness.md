# Living Memory v0.2 Readiness

Living Memory v0.2 is the careful evolution layer for the existing Capture → Inbox → Observation → Entity → Memory → Briefing flow.

## Included behavior

- entities and memories retain source-linked supporting and contradicting evidence;
- duplicate detection prepares candidates without automatically merging identities;
- confidence is evaluated only after evidence is stored by fixed, conservative rules, never reaches `confirmed` through AI, and remains unchanged by contradictions;
- meaningful updates preserve immutable before-and-after history with the relevant evidence references;
- user confirmation and correction are authoritative, server-enforced, traceable actions;
- sensitive or contradicted suggestions remain tentative and receive a quiet confirmation request;
- archives remain historical but are excluded from current briefing context;
- suggested observations remain available for review; v0.2 provides no irreversible hide action.

## Final validation scenarios

- Capture, analyze, observation processing, evidence creation, and briefing generation use the authenticated production flow.
- Similar or ambiguous names are kept as separate entities; no automatic merge path exists.
- Two independent normal-sensitivity captures can promote `low` to `medium`; three can promote `medium` to `high`. Contradictions block promotion without reducing confidence.
- Explicit confirmation and correction create `confirmed` current knowledge while history and prior evidence remain intact.
- Sensitive and unresolved-contradiction records remain tentative until a user decides.
- Archived, low-confidence, and unresolved-contradiction records are excluded from briefing context.
- RLS prevents cross-user reads and writes for records, evidence, history, and validation actions; direct client writes cannot produce `confirmed` confidence.

## Deterministic confidence policy

- Confidence is evaluated only from immutable, supporting `memory_evidence` owned by the record's user. An independent source is a capture when present, otherwise an observation.
- Only normal-sensitivity, `suggested` or `active` records can be promoted. A sensitive target or any sensitive supporting source is never automatically promoted.
- An unresolved contradiction or any contradicting evidence blocks promotion. Neither condition lowers confidence.
- `low` promotes to `medium` with at least two independent normal-sensitivity sources. `medium` promotes to `high` with at least three. `high` and `confirmed` are never automatically changed.
- Confidence evolution makes no OpenAI request. Capture processing makes one initial extraction request only when the capture has suggested observations; no target-specific confidence requests are made.

## Known limitations and deliberate boundaries

- Duplicate candidates are never automatically merged. Merge, split, and reversal workflows need a future user-approved product design.
- Contradictions are preserved but not automatically resolved; Life OS waits for later evidence or user clarification.
- Corrections currently edit entity descriptions and memory wording. Identity changes, split/merge corrections, and richer period modelling remain future work.
- Confidence remains qualitative; v0.2 intentionally has no user-facing numeric score.
- Life Graph and Companion behavior are explicitly out of scope for this release.
