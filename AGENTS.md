# AGENTS.md v2 — Engineering Playbook

This document is the engineering contract for every human or AI agent working on Life OS.

It defines how to execute approved work. It does not define product behavior.

## 1. Mission

- Build Life OS exactly as specified.
- Turn approved product decisions into simple, secure, traceable, mobile-first software.
- Protect user-owned memory before optimizing speed, convenience, automation, or feature breadth.
- Prefer an incomplete but trustworthy implementation to a complete but speculative one.
- Stop and report ambiguity when implementation would require a product decision.

## 2. Source of Truth

Use this precedence order:

1. `AGENTS.md` governs engineering conduct and execution.
2. Documents `001–019` govern the approved product and architecture baseline.
3. Approved RFCs govern the product behavior of their named evolution.
4. Approved implementation SPECs govern the technical implementation of their named RFC.
5. The code records the current implementation; it is never authority for undocumented behavior.

Apply the following rules:

- Read every document named by the task before changing code.
- Read adjacent canonical documents when the change crosses product, data, AI, security, or lifecycle boundaries.
- Treat RFC-001 as canonical for Living Memory behavior.
- Treat RFC-002 as canonical for Life Graph product behavior.
- Treat SPEC-002 as canonical for Life Graph implementation, subordinate to RFC-002.
- Follow the more specific approved document when two documents operate at different levels of detail.
- If canonical documents conflict at the same level, stop. Identify the exact conflict and request a CTO decision.
- Never resolve a documentation conflict by inventing behavior.
- Never use this playbook to override a product decision in canonical documentation.

## 3. Engineering Principles

- Implement the smallest complete change that satisfies the approved scope.
- Prefer deterministic logic to generative logic.
- Prefer readable code to abstraction.
- Prefer existing conventions to new architecture.
- Keep modules cohesive, components small, dependencies minimal, and boundaries explicit.
- Do not add infrastructure, abstraction, configuration, or extensibility without a current documented requirement.
- Preserve compatibility and user data. Make breaking changes explicit and migration-backed.
- Make every material state change attributable, reviewable, and reversible where the specification requires it.
- Optimize only from measured constraints. Preserve the documented operational limits.
- Keep each change easy to review, remove, and extend.

## 4. Product Principles

- Do not define, redesign, or reinterpret the product in code.
- Implement only behavior explicitly authorized by canonical documentation and the current task.
- Keep the primary experience mobile-first.
- Favor simplicity before completeness and trust before automation.
- Show only the information and choices the user needs.
- Hide database mechanics, prompt mechanics, and internal model reasoning from the product surface.
- Preserve uncertainty in user-facing states. Never present a suggestion, contradiction, or low-confidence inference as fact.
- Keep the user in control of durable memory and consequential decisions.
- Do not expand the active release with roadmap features, scaffolding, or adjacent workflows.

## 5. AI Principles

- Use AI only for documented generative responsibilities such as extraction, summarization, cautious classification, constrained suggestion, explanation, and briefing generation.
- Keep ownership, permissions, validation, identifiers, state transitions, confidence evolution, sensitivity enforcement, deletion, and audit behavior deterministic.
- Treat every model output as untrusted input.
- Require structured output and validate it against a strict server-owned contract before use or persistence.
- Normalize or reject invalid output. Fail safely without losing the source Capture or mutating trusted state.
- Preserve evidence, uncertainty, contradictions, and provenance.
- Never allow AI to confirm durable knowledge, resolve contradictions autonomously, merge identities automatically, or overwrite validated history.
- Never allow AI to invent IDs, facts, sources, evidence, relationship types, statuses, confidence levels, or sensitivity levels.
- Never infer sensitive attributes, diagnoses, emotional meaning, intent, causality, moral value, or relationship status from ambiguous evidence.
- Prefer no inference to a plausible but misleading inference.
- Keep prompts, prompt versions, model selection, response validation, and persistence on the backend.
- Keep contracts independent of a specific model. A model change must not require a frontend or database redesign.
- Record the prompt version for AI operations where canonical observability requires it. Do not log raw sensitive model inputs or outputs.

## 6. Database Principles

- Treat PostgreSQL as the canonical persisted state.
- Follow the canonical schema, table names, IDs, enums, constraints, statuses, confidence levels, and sensitivity levels. Add none without explicit authorization.
- Use Supabase-generated UUIDs. Never accept model-generated identifiers.
- Store ownership on every user-owned canonical record.
- Enable RLS on every user-owned table and test isolation in both directions between distinct users.
- Enforce invariants at the database boundary when bypassing them would violate ownership, history, lifecycle, or trust.
- Make migrations explicit, ordered, reviewable, forward-safe, and protective of existing user data.
- Regenerate Supabase types after schema changes.
- Preserve immutable evidence and history where required. Do not edit or delete append-only records through normal application paths.
- Use soft deletion or archival by default. Require explicit documented authority for physical deletion.
- Make rollback non-destructive after real user data exists. Disable new usage before considering structural removal.
- Use bounded queries, stable ordering, required indexes, pagination, and documented density limits.
- Do not introduce graph databases, vector stores, recursive unbounded queries, or parallel persistence models without an approved requirement and measured need.

## 7. Backend Principles

- Route every OpenAI call through a documented Supabase Edge Function. Never call OpenAI from the frontend.
- Authenticate every protected operation with a valid JWT and derive the user from `auth.uid()`.
- Ignore client-supplied `user_id` values for authorization.
- Verify ownership of every referenced object before reading, linking, or mutating it.
- Validate and bound all inputs before side effects.
- Keep state transitions, confidence changes, sensitivity rules, history creation, duplicate prevention, and visibility rules server-controlled.
- Make mutation endpoints and database operations idempotent where retries are possible.
- Use secure database functions for privileged user decisions when required by the canonical SPEC.
- For `security definer` functions, set `search_path`, validate `auth.uid()`, verify ownership, restrict `EXECUTE`, and revoke access from `anon` and `public`.
- Limit service-role usage to documented server code. Apply explicit user filters even when RLS can be bypassed.
- Return stable error contracts without secrets, tokens, stack traces, SQL details, prompts, or personal data.
- Preserve source data and avoid partial trusted-state mutations when AI or downstream processing fails.
- Log operation name, request identifier, pseudonymous user reference, relevant object identifier, result, duration, and safe error code when required. Never log secrets, JWTs, full captures, or complete sensitive evidence.

## 8. Frontend Principles

- Build with React, Vite, TypeScript, and Tailwind CSS unless canonical documentation explicitly changes the stack.
- Design and verify the smallest supported mobile viewport first. Enhance larger layouts progressively.
- Keep the frontend a projection of server-authorized state.
- Never calculate authoritative status, confidence, ownership, sensitivity, or lifecycle transitions in the client.
- Send user decisions to documented server operations and render the returned canonical result.
- Represent loading, empty, error, offline or retry, tentative, contradicted, archived, and permission states when relevant to the feature.
- Make uncertainty, provenance, and available user actions understandable without exposing internal reasoning.
- Use semantic HTML, keyboard access, visible focus, readable contrast, and descriptive labels.
- Avoid unnecessary requests and N+1 loading. Fetch only the fields and bounded collections needed by the current surface.
- Do not persist sensitive records, evidence, prompts, or model output in `localStorage`.
- Do not add a dependency when the existing stack can implement the requirement clearly.

## 9. TypeScript Principles

- Keep strict typing enabled and leave the repository with no TypeScript errors.
- Derive database types from generated Supabase types and domain contracts from canonical schemas.
- Validate untrusted data at runtime; TypeScript types alone are not validation.
- Use discriminated unions or exhaustive mappings for canonical states when appropriate.
- Keep API, Edge Function, and database contracts explicit and serializable.
- Do not use `any`, broad casts, non-null assertions, or ignored compiler errors to bypass uncertainty.
- Narrow unknown values at boundaries.
- Prefer small named types near their domain over generic utility abstractions.
- Remove dead types and keep frontend and backend contracts synchronized.

## 10. Security Principles

- Never expose API keys, service-role keys, prompts containing secrets, or privileged credentials to the client, repository, logs, fixtures, or error responses.
- Never bypass RLS for convenience.
- Never trust client input, model output, URL parameters, local state, or object ownership claims.
- Apply least privilege to database grants, functions, tokens, services, and runtime access.
- Enforce user isolation at the database boundary and re-check it in privileged server paths.
- Protect sensitive personal and third-party information by default. When intent or permission is unclear, do not display or act.
- Do not place real personal data in tests, fixtures, screenshots, telemetry, or development logs.
- Review destructive operations, authentication changes, RLS changes, `security definer` functions, and service-role code as high-risk.
- Keep dependencies minimal, pinned through the repository lockfile, and justified by current scope.
- Fail closed on authorization, validation, ownership, and contract errors.

## 11. Git Workflow

- Start from the branch named by the task. Confirm the worktree is clean before creating a branch.
- Use one branch and one pull request for one approved scope.
- Use the exact branch name and commit message requested. Otherwise use a concise, scoped conventional commit.
- Inspect the existing worktree before editing. Preserve unrelated user changes.
- Modify only files required by the task. Do not reformat, rename, regenerate, or clean unrelated files.
- Keep commits atomic, buildable, and reviewable.
- Review `git diff` and `git status --short` before committing.
- Run checks proportionate to the changed surface before committing.
- Do not amend, rebase, force-push, reset, or discard work without explicit authorization.
- Push only the intended branch. Never push directly to `main` unless explicitly authorized.
- Do not start the next PR before the current PR is reviewed.
- Report the branch, full commit SHA, pushed remote, final status, changed files, checks, and blockers.

## 12. Goal Execution Standard

For every implementation goal:

1. Read the task, this playbook, and all named canonical documents.
2. Inspect the repository, current branch, worktree state, conventions, scripts, and relevant implementation.
3. Restate the permitted scope internally as concrete files, contracts, behaviors, and exclusions.
4. Identify product ambiguity, documentation conflict, destructive risk, migration risk, and security boundaries before editing.
5. Stop for a CTO decision if success requires undocumented product behavior or contradicts a canonical contract.
6. Implement the smallest coherent vertical change within scope.
7. Add or update tests at the layer that owns each invariant.
8. Run targeted checks, then the repository's required validation suite.
9. Inspect the final diff for scope, security, data preservation, generated artifacts, and accidental changes.
10. Commit and push only when authorized by the task.
11. Deliver an evidence-based report. State exactly what changed, what was verified, what remains unverified, and every blocker.

Do not claim completion from code inspection alone when the behavior can be executed or tested.

## 13. Review Checklist

Before requesting review, verify:

- Scope matches the task and no undocumented behavior was added.
- The change follows the applicable documents `001–019`, RFCs, and SPECs.
- Product behavior, canonical vocabulary, lifecycle, and release boundaries are unchanged unless explicitly requested.
- AI remains suggestive, constrained, server-side, validated, and unable to mutate trusted state autonomously.
- Ownership, JWT handling, RLS, grants, service-role use, and cross-user isolation are correct.
- Migrations preserve data, history, rollback safety, and generated types.
- Failure paths preserve source data and avoid partial authoritative mutations.
- Frontend states are mobile-first, accessible, bounded, and honest about uncertainty.
- TypeScript is strict and contains no bypass casts or suppressed errors.
- Tests cover the changed success path, rejection path, failure path, authorization boundary, and canonical regression risks.
- Typecheck, lint, build, relevant tests, migration checks, and mobile verification pass when applicable.
- Logs, errors, fixtures, and screenshots contain no secrets or personal data.
- The diff contains only intended files and no debug code, stale flags, or unrelated formatting.
- Documentation and setup instructions are updated only when the approved change requires them.

## 14. Definition of Done

A goal is done only when:

- The approved behavior is implemented completely within scope.
- All applicable canonical invariants remain true.
- Acceptance criteria and canonical scenarios pass.
- Relevant typecheck, lint, build, unit, integration, RLS, Edge Function, migration, rollback, accessibility, and mobile checks pass.
- Existing Living Memory behavior does not regress; Life Graph work also satisfies RFC-002 and SPEC-002 gates.
- User data, evidence, history, ownership, and reversibility are preserved as specified.
- The final diff is reviewed and contains no unrelated change.
- Required migrations, generated types, tests, and documentation are included.
- The authorized Git workflow is complete and the final worktree state is reported.
- Any check that could not run is explicitly reported. An unrun required check is not a pass.

## 15. Forbidden Decisions

Agents must not:

- Invent product behavior, user flows, canonical objects, tables, fields, types, statuses, confidence levels, sensitivity levels, transitions, or permissions.
- Expand the MVP or current release with roadmap features or speculative infrastructure.
- Redesign the product, information architecture, visual language, or core pipeline without an approved document.
- Add autonomous agents, specialized agents, hidden automation, background actions without user control, or external actions performed by AI.
- Let AI confirm durable knowledge, generate canonical IDs, merge identities, resolve contradictions, delete history, or bypass user validation.
- Add sensitive inference, psychological profiling, scoring, diagnosis, moral judgment, or medical, legal, or financial decisioning.
- Call OpenAI from the frontend or expose secrets to client code.
- Bypass RLS, trust client ownership, weaken grants, or use service-role access without explicit user scoping.
- Physically delete user memory, immutable evidence, or history outside a documented deletion path.
- Introduce unsupported tables, graph infrastructure, vector storage, embeddings, integrations, dependencies, or caches.
- Load unbounded personal data or the complete graph into the browser.
- Change behavior to make a failing test pass when the test reflects a canonical contract.
- Silence errors with unsafe casts, disabled checks, ignored failures, or misleading fallbacks.
- Modify unrelated files, discard existing work, or perform destructive Git operations without authorization.

## 16. CTO Review Contract

Request CTO review before implementation when:

- Canonical documents conflict or leave a behavior materially ambiguous.
- The task requires a new product behavior, user decision, canonical state, data category, inference, permission, or lifecycle transition.
- A migration may destroy, rewrite, merge, or make user-owned data or history unreachable.
- The implementation would weaken RLS, expand service-role access, expose sensitive data, or change deletion semantics.
- The requested work crosses an explicit non-goal, release boundary, approval gate, or forbidden decision.
- The existing repository cannot satisfy an approved SPEC without changing its product contract.

Provide the CTO with:

- the exact decision required;
- the conflicting or missing canonical references;
- the current implementation evidence;
- the smallest viable options and their security, data, product, and migration consequences;
- a recommended option only when the documents support one;
- the work that remains safely executable without that decision.

Do not continue past the blocked boundary until the decision is documented. After approval, implement only the approved option and cite that decision in the review report.
