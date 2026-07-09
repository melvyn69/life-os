# SPEC-001 — Living Memory Implementation

## 1. Purpose

This specification translates RFC-001 into an engineering blueprint for Living Memory.

RFC-001 defines how Life OS must think about memory.

This document defines how that thinking should be engineered.

It bridges the product behavior described in RFC-001 and the implementation work required for v0.2. It does not define technical mechanisms, integration contracts, user interface screens, or framework details. It defines the system responsibilities, decision boundaries, validation expectations, and implementation sequence needed to build Living Memory without weakening the principles of Life OS.

Living Memory must preserve the original product promise:

- memory evolves;
- memory is probabilistic;
- memory is reversible;
- confidence is earned through evidence;
- contradictions are preserved until understood;
- the user remains the final authority.

The purpose of v0.2 is not to make Life OS remember more aggressively.

The purpose is to make Life OS remember more carefully.

v0.1 proves that the system can transform a capture into observations, entities, memories, and a simple briefing. v0.2 must make that transformation more trustworthy by teaching the system how to decide whether something is new, known, duplicated, uncertain, contradictory, outdated, or worth preserving as part of an evolving personal memory.

This specification should be treated as the canonical engineering specification for Living Memory.

---

## 2. Scope

v0.2 belongs to the memory layer.

It improves how Life OS turns new observations into durable, revisable understanding.

The scope of v0.2 includes:

- entity enrichment;
- entity matching;
- duplicate detection;
- evidence accumulation;
- confidence evolution;
- contradiction handling;
- memory history.

### Entity Enrichment

Living Memory must allow existing entities to become richer over time.

Enrichment may add a new alias, clarify a role, connect an entity to a project, preserve a remembered event, record a correction, update an importance signal, or attach a new uncertain hypothesis.

Enrichment must not overwrite the past.

It must preserve what changed, why it changed, and what evidence supported the change.

### Entity Matching

Living Memory must decide whether a new observation refers to an existing entity, a new entity, multiple possible entities, or no durable entity yet.

The system must be comfortable with uncertainty.

It must support the state where two references are possibly related without being treated as the same.

### Duplicate Detection

Living Memory must detect when two entities, memories, or candidates may describe the same underlying reality.

Duplicate detection exists to reduce fragmentation, not to force clean data.

A possible duplicate is not automatically a merge.

### Evidence Accumulation

Living Memory must preserve and evaluate the evidence behind memory decisions.

Evidence may come from repeated observations, explicit user confirmation, contextual consistency, temporal continuity, related entities, or prior corrections.

Evidence must remain connected to the conclusion it supports or weakens.

### Confidence Evolution

Living Memory must allow confidence to increase, decrease, stabilize, or remain unresolved.

Confidence is a guide for system behavior.

It determines whether Life OS should rely on a memory, ask the user, speak tentatively, stay silent, archive a hypothesis, or preserve competing interpretations.

### Contradiction Handling

Living Memory must preserve contradictions instead of erasing them.

Contradictions may represent error, change, ambiguity, outdated context, role confusion, or incomplete information.

The system must not collapse contradiction into a single convenient answer before it has enough evidence or user clarification.

### Memory History

Living Memory must preserve the history of understanding.

The system should know when something was first observed, when it became stronger, when it was contradicted, when it was confirmed, when it was corrected, and when it became obsolete or archived.

Memory history is not an audit feature only.

It is the foundation that allows Life OS to speak honestly about what it knows and how it came to know it.

### Explicitly Excluded From v0.2

v0.2 does not include:

- Life Graph;
- Companion;
- proactive suggestions;
- multimodal reasoning.

Living Memory prepares these later capabilities, but does not implement them.

Life Graph requires reliable entity identity and relationship history. v0.2 creates the memory foundation but does not expose or build the graph product.

Companion requires conversational use of memory. v0.2 improves the underlying memory but does not introduce a new companion behavior layer.

Proactive suggestions require timing, restraint, and user-facing intervention rules. v0.2 may classify whether memory is strong enough to be used later, but it does not decide when to interrupt the user.

Multimodal reasoning requires interpreting images, audio, files, and other formats in combination. v0.2 assumes observations already exist. It does not expand perception.

---

## 3. Current State (v0.1)

v0.1 is built around a simple memory pipeline:

Capture

↓

Observation

↓

Entity

↓

Memory

↓

Briefing

This pipeline is intentionally minimal.

It proves the core Life OS loop:

the user captures a fragment of life, the system analyzes it cautiously, the user can review what was understood, meaningful entities and memories can be created, and a briefing can return useful context.

### Capture

A capture is the raw fragment provided by the user.

It may be a thought, note, reminder, link, reflection, or other intentional input.

The capture preserves the original source.

It is not itself memory.

### Observation

An observation is the system's first layer of interpretation.

It represents what Life OS believes it may have perceived in a capture.

An observation is provisional.

It may be correct, incomplete, temporary, ambiguous, sensitive, contradicted, or wrong.

### Entity

An entity is a meaningful presence in the user's life.

It may be a person, project, place, habit, passion, event, object, value, organization, or other identifiable element that can carry history.

In v0.1, entities can be suggested and reviewed, but the system has limited ability to decide whether a new reference belongs to an existing entity or should remain unresolved.

### Memory

A memory is useful, stabilized context that may influence future understanding.

In v0.1, memories can be created from observations and linked to entities, but the system does not yet have a complete model for evidence accumulation, confidence changes, contradiction preservation, or historical evolution.

### Briefing

A briefing returns useful context from memory.

In v0.1, the briefing depends on the quality of existing memories.

It does not yet benefit from a mature Living Memory layer that can distinguish current knowledge from old assumptions, unresolved hypotheses, and contradictions.

### Current Limitations

v0.1 has the right conceptual layers, but the memory behavior is still shallow.

Its main limitations are:

- new references can fragment into duplicate entities;
- similar names can be over-linked or under-linked;
- observations do not accumulate evidence in a disciplined way;
- confidence is mostly static after creation;
- contradictions can be detected but are not fully preserved as competing interpretations;
- entity enrichment can resemble replacement rather than evolution;
- memory history is not yet strong enough to explain how understanding changed;
- user validation is necessary but not yet governed by a clear decision model;
- the system has limited protection against false merges;
- briefings cannot reliably distinguish stable knowledge from weak hypotheses.

These limitations are acceptable in v0.1 because the product is still proving the first memory loop.

They must be addressed in v0.2 because Living Memory becomes the foundation for every later intelligent capability.

---

## 4. Target State (v0.2)

v0.2 introduces a more deliberate Living Memory pipeline:

Observation

↓

Candidate Match

↓

Evidence Evaluation

↓

Memory Decision

↓

Entity Evolution

↓

Memory Evolution

↓

Briefing

This pipeline does not replace the v0.1 concepts.

It refines what happens between observation and memory.

The central change is that Life OS no longer treats "create entity" or "create memory" as the primary next step after analysis. It first asks what the observation might be evidence for.

### Observation

The observation remains the system's first interpretation of a captured fragment.

At this stage, the system must not conclude.

It may identify candidate entities, possible relationships, possible memories, possible contradictions, and sensitivity.

It must preserve uncertainty.

### Candidate Match

The candidate match stage asks whether the observation may refer to something already known.

Possible outcomes include:

- likely existing entity;
- possible existing entity;
- likely new entity;
- possible duplicate;
- unresolved reference;
- no entity-level meaning.

Candidate matching must be conservative.

It should not merge, enrich, or create memory by itself.

It prepares options for evidence evaluation.

### Evidence Evaluation

Evidence evaluation weighs the new observation against existing understanding.

It asks:

- What supports this interpretation?
- What weakens it?
- What conflicts with it?
- Is the evidence independent or repetitive?
- Is the context stable or different?
- Has the user confirmed or corrected this before?
- Is the topic sensitive?
- Would a wrong decision be harmful?

Evidence evaluation does not need to produce mathematical certainty.

It must produce a behaviorally useful assessment: rely, enrich, ask, wait, preserve contradiction, archive, or ignore.

### Memory Decision

The memory decision stage determines what should happen next.

It may create a new entity, enrich an existing entity, create or update a memory, preserve a contradiction, keep an unresolved candidate, request validation, archive stale knowledge, or ignore a low-value observation.

This is the core decision layer of Living Memory.

Its responsibility is not to make the system seem smart.

Its responsibility is to protect the quality of personal memory.

### Entity Evolution

Entity evolution applies accepted changes to entities.

An entity may gain an alias, a relationship, a role, a period, a linked memory, a confidence change, a correction, or a historical note.

Entity evolution must be traceable and reversible.

It must distinguish enrichment from merge.

### Memory Evolution

Memory evolution applies accepted changes to memories.

A memory may become stronger, weaker, contradicted, confirmed, obsolete, hidden, archived, or corrected.

A new memory may be created when the evidence supports durable future use.

Memory evolution must preserve the previous understanding.

The system must not silently rewrite the past to fit the present.

### Briefing

Briefing continues to return useful context.

In v0.2, briefings should benefit from the stronger memory layer by favoring stable, current, relevant memories and avoiding overconfident use of unresolved or contradicted knowledge.

The briefing layer should not expose the full machinery of Living Memory.

It should inherit its restraint.

---

## 5. Canonical Decision Flow

After receiving a new observation, Living Memory must decide what state the observation should produce.

Every decision must be explainable in terms of evidence, confidence, sensitivity, consequence, and user authority.

### Decision: Create New Entity

The system may create a new entity when the observation appears to refer to a distinct element in the user's life and the evidence is strong enough to preserve it as something with future history.

This may occur when:

- the user explicitly introduces a person, project, place, habit, value, or other meaningful element;
- the same element appears repeatedly across independent observations;
- the observation contains enough context to distinguish it from known entities;
- the element appears likely to matter beyond the moment;
- not creating an entity would make future memory less understandable;
- the risk of accidental duplication is low.

Creating a new entity should be avoided when:

- the reference is passing or purely logistical;
- the name is ambiguous;
- a plausible existing entity may match;
- the topic is sensitive and not explicitly declared by the user;
- the system only has curiosity, not utility.

### Decision: Enrich Existing Entity

The system may enrich an existing entity when the observation aligns with that entity strongly enough to add context without distorting identity.

Enrichment may occur when:

- the user uses a known name or confirmed alias;
- the surrounding context matches prior history;
- the same project, place, time period, or relationship appears;
- previous user confirmations support the link;
- no credible alternative entity competes;
- the consequence of a mistaken link is low or validation has been obtained.

Enrichment must preserve uncertainty when the match is not confirmed.

For example, "Thomas" may enrich "Thomas Dupont" as a likely reference in a low-impact terrace project context, while still retaining the possibility that the system could be wrong.

### Decision: Keep Unresolved

The system must keep a reference unresolved when it lacks enough evidence to create, merge, or enrich safely.

Unresolved is a valid memory state.

It should occur when:

- multiple entities could match;
- a name or role is ambiguous;
- the observation is context-poor;
- the relationship between references is possible but not established;
- the information may become useful later but is not reliable yet;
- asking the user would be unnecessary or intrusive.

Unresolved references should remain available for future evidence.

They should not pollute stable memory.

### Decision: Request User Confirmation

The system should request user confirmation when uncertainty has meaningful consequences.

Validation is required when:

- a potential merge could combine two different people or important entities;
- an uncertain match would change an important or sensitive memory;
- a contradiction affects identity, relationship, health, family, finances, beliefs, conflict, or other sensitive domains;
- the system is about to rely on an assumption in a way that may affect future assistance;
- the user has previously corrected a similar assumption;
- the user explicitly asks the system to remember something accurately.

Validation should be optional or deferred when:

- the observation is low impact;
- the system can safely wait for more evidence;
- the user would be interrupted for a detail that may never matter;
- the only reason to ask is to satisfy system neatness.

### Decision: Preserve Contradiction

The system must preserve contradiction when a new observation conflicts with existing understanding and the conflict cannot be safely resolved.

This may occur when:

- a relationship appears to have changed;
- a preference conflicts with earlier behavior;
- two names may refer to one person or several people;
- a date, role, location, or status differs from prior memory;
- user language suggests a possible change but not a confirmed one;
- an old assumption may be obsolete.

Preserving contradiction means keeping both the prior understanding and the new evidence, with enough context to evaluate them later.

It does not mean presenting both as equally current.

### Decision: Merge

The system may merge entities or memory candidates only when the evidence strongly supports that they describe the same underlying reality.

Merge requires a higher standard than enrichment.

It should occur when:

- the user explicitly confirms sameness;
- aliases, context, relationships, and time align strongly;
- no meaningful contradiction remains;
- the merge can be reversed;
- the historical traces of both sides are preserved.

The system should avoid merging when:

- names are merely similar;
- roles conflict;
- context is weak;
- the entity is sensitive or consequential;
- the system lacks a clear explanation for the decision.

### Decision: Archive

The system may archive a memory, candidate, or entity when it appears no longer active but remains part of the user's history.

Archiving may occur when:

- a project is complete;
- a temporary plan has passed;
- an old preference appears outdated;
- a weak candidate has not received support over time;
- the user indicates something is no longer relevant;
- the memory remains historically meaningful but should not influence current understanding strongly.

Archiving is not deletion.

Archived information may remain part of history but should have reduced influence on current assistance.

### Decision: Ignore

The system may ignore an observation for Living Memory purposes when it does not appear useful, durable, reliable, or respectful to retain.

Ignore may occur when:

- the observation is noise;
- the content is purely transient;
- the system lacks enough context and future usefulness is unlikely;
- remembering it would feel invasive;
- the observation is too weak to become evidence;
- the user has rejected similar interpretation before.

Ignoring should not destroy the original capture unless the user deletes it.

It means the observation does not become part of active Living Memory.

---

## 6. Matching Strategy

Matching is the process of deciding whether a new observation refers to something already known, something new, or something unresolved.

The strategy must be conceptual, layered, and conservative.

It must not depend on a single signal.

It must not treat similarity as identity.

### Matching Signals

Living Memory may consider multiple signals when evaluating a match.

These include:

- semantic similarity;
- names and aliases;
- temporal context;
- recurring relationships;
- related projects, places, events, or periods;
- user phrasing;
- previous confirmations;
- previous corrections;
- sensitivity;
- contradiction with existing facts;
- absence of plausible alternatives.

No single signal is sufficient in every case.

A name match may be weak if several people share the name.

Semantic similarity may be weak if context differs.

Temporal proximity may be weak if the user is discussing the past.

User confirmation is strong, but even confirmed understanding may later become outdated.

### Semantic Similarity

Semantic similarity can suggest that two references may concern the same thing.

It is useful for identifying possible relationships between differently worded observations.

It must not be treated as proof.

"Terrace project" and "garden renovation" may be related.

They may also be different.

The system should use semantic similarity to propose candidates, not to settle identity.

### Aliases

Aliases are names, nicknames, roles, or references that may point to the same entity.

Aliases can become strong evidence when they are confirmed by the user or repeatedly appear in stable context.

Unconfirmed aliases should remain tentative.

"Tom" may be an alias for "Thomas Dupont."

"my brother" may refer to the same person as "Thomas."

Neither should be merged solely because it is plausible.

### Temporal Context

Time helps determine whether a match is likely.

References close together in time may support a match, especially when the surrounding context is consistent.

Older memories may still be true, but they may also belong to a past period.

The system must distinguish continuity from change.

Temporal context should help Life OS ask whether something is still current, not simply whether it appeared before.

### Recurring Relationships

An entity often becomes recognizable through relationships.

A person mentioned with the same project, place, organization, or family role across time becomes easier to identify.

Recurring relationships can strengthen a match.

They can also reveal contradiction.

If "Thomas" appears in a work context and "Thomas" later appears in a family context, the system should not automatically assume one person. It should preserve the possibility of one person with multiple roles and the possibility of two different people.

### Previous Confirmations

Previous user confirmations carry special weight.

If the user confirmed that "Tom" means "Thomas Dupont," future references to Tom in a similar context may be matched more confidently.

Previous confirmations should not become blind rules.

If later evidence conflicts with them, the system should preserve the conflict and ask when necessary.

### Previous Corrections

Previous corrections are also evidence.

If the user corrected a false match before, the system should become more cautious with similar future matches.

Corrections should shape future restraint.

The system must not repeat the same wrong inference simply because new wording looks similar.

### Conceptual Confidence Thresholds

Living Memory should use confidence thresholds as behavior boundaries, not as visible claims of truth.

Low confidence means the system has a possibility but should not rely on it.

Medium confidence means the system has meaningful support but should preserve uncertainty and ask when consequence is meaningful.

High confidence means the system has repeated, coherent evidence and may rely on the match for low- and medium-impact behavior while remaining correctable.

Confirmed means the user has explicitly validated the understanding or directly declared it with clear intent.

Thresholds must rise with consequence and sensitivity.

A weak match may be acceptable for grouping a low-impact observation.

The same strength is not acceptable for merging people, changing relationship context, or influencing sensitive memory.

---

## 7. Evidence Model

Evidence is any support that helps Life OS decide whether candidate knowledge should be strengthened, weakened, connected, questioned, remembered, archived, or corrected.

Evidence is not merely quantity.

It is quality, context, independence, consistency, sensitivity, time, and user authority.

### What Counts As Evidence

Evidence may include:

- an explicit user statement;
- a user confirmation;
- a user correction;
- repeated observations across time;
- contextual consistency;
- relationships to known entities;
- continuity of names, aliases, roles, projects, places, or periods;
- contradiction with prior understanding;
- absence of expected continuation;
- age and decay of older assumptions;
- prior system mistakes;
- the source and sensitivity of the observation.

Evidence may support a conclusion.

It may weaken a conclusion.

It may split one candidate into several possible interpretations.

It may show that the safest action is to wait.

### Evidence Strength

Different evidence should contribute differently.

User confirmation is the strongest positive evidence.

User correction is the strongest corrective evidence.

Repeated independent observations are stronger than repetition inside one narrow moment.

Context-rich observations are stronger than isolated fragments.

Sensitive inferences require stronger support than ordinary logistical facts.

Old evidence may still matter, but it should be evaluated in relation to time and possible change.

### Examples

If the user says, "Remember that Sarah is my accountant," the system has strong declared evidence for a person and role.

If the user writes, "Need to send the receipt to Sarah," the system may have weak evidence that Sarah is connected to finances, but it should not conclude her role.

If Sarah appears across several tax-related captures over several months, the system may gain confidence that the relationship is finance-related.

If the user later says, "Sarah is not my accountant anymore," the system should not erase the previous memory. It should preserve that the role changed.

If the system once confused two Sarahs and the user corrected it, future Sarah references require more caution.

### Evidence And Sensitivity

The more sensitive the conclusion, the stronger the required evidence.

The system may quietly infer that "Monoprix" is likely a place or organization from a receipt-like note.

It should not quietly infer a medical condition, relationship status, financial stress, religious belief, sexuality, trauma, or deep personality trait from indirect evidence.

Sensitive evidence may still be preserved as an observation.

It should not become durable interpretation without clear authority.

### Evidence And Silence

No evidence is also information.

If a project has not appeared for a long time, Life OS may reduce its active importance.

It should not assume the project has ended unless there is evidence.

Silence may suggest sleep, not disappearance.

### No Formulas

This specification does not define formulas for evidence scoring.

The required behavior is qualitative:

- stronger evidence should increase reliance;
- weaker evidence should preserve uncertainty;
- contradictory evidence should prevent overconfidence;
- sensitive evidence should raise validation requirements;
- corrections should reshape future behavior;
- history should remain traceable.

---

## 8. Contradiction Strategy

Contradictions are expected in Living Memory.

They are not defects to hide.

They may represent change, ambiguity, incomplete context, incorrect assumptions, multiple entities, temporary emotion, or a past truth that no longer describes the present.

The system must preserve contradictions until they can be understood.

### Competing Facts

Competing facts occur when two pieces of evidence cannot both be true in the same way at the same time.

Examples:

- the user says a trip was in May, then later says it was in June;
- a project is described as active, then later described as abandoned;
- the same person appears with two incompatible roles;
- a preference is stated strongly and later contradicted by repeated behavior.

The system must not simply choose the newest fact.

The newest fact may be a correction.

It may also be a different context, a mistake, or a temporary feeling.

Living Memory should preserve both pieces of evidence, their dates, their sources, and the current interpretation.

### Changing Relationships

Relationships change.

A colleague may become a friend.

A partner may become an ex-partner.

A distant family member may become central.

A project collaborator may become irrelevant after a project ends.

Relationship changes should be represented as evolution, not contradiction whenever the timeline explains the difference.

When the timeline does not explain the difference, the system should preserve uncertainty.

### Conflicting Names

Names are ambiguous.

The same person may appear as Thomas, Tom, Thomas Dupont, "my brother," or an email address.

Different people may share the same first name.

The system must preserve possible aliases without forcing identity.

Conflicting names should produce one of three states:

- known same;
- known different;
- possibly related.

"Possibly related" is a valid and important state.

### Uncertainty

Uncertainty should be explicit inside the memory layer, even when not surfaced to the user.

The system should know when it is carrying a hypothesis.

It should know when a memory is useful but not settled.

It should know when the safest behavior is to speak tentatively or stay silent.

Uncertainty is not failure.

It is what prevents Life OS from becoming overconfident.

### Preservation Rules

When a contradiction appears, the system should preserve:

- the previous understanding;
- the new observation;
- the reason they appear to conflict;
- the affected entity or memory;
- the time context;
- whether the contradiction may represent change;
- whether user validation is required;
- what the system should rely on until resolved.

Contradiction preservation must not create user-facing noise by default.

The user should be asked only when the contradiction matters.

### Resolution

A contradiction may be resolved when:

- the user clarifies it;
- later observations make one interpretation clearly stronger;
- the conflict is explained by time;
- the conflict is explained by separate entities;
- the memory can safely remain uncertain without further action.

Some contradictions should never be forced into resolution.

Human life does not always become tidy.

---

## 9. Memory Evolution

Memory evolution is the process by which entities and memories become richer, more accurate, more contextual, or less active over time.

Evolution is not replacement.

It is the history of understanding becoming more faithful.

### Entity Richness

Entities become richer when Life OS learns more about what they represent.

This may include:

- names and aliases;
- roles;
- relationships;
- projects;
- places;
- periods;
- events;
- preferences;
- emotional context;
- corrections;
- uncertainty;
- importance;
- sensitivity;
- historical changes.

Richness must serve understanding.

The goal is not to attach every possible detail to an entity.

The goal is to preserve the details that help Life OS support the user with more continuity and care.

### Merge Versus Enrichment

Enrichment adds context to an existing entity.

Merge recognizes that two representations describe the same underlying entity.

They require different levels of certainty.

Enrichment may be acceptable when the system has a likely match and low risk.

Merge requires stronger evidence because a false merge can corrupt memory.

A merge must preserve:

- both prior representations;
- the evidence that justified the merge;
- any remaining uncertainty;
- user confirmation when required;
- the ability to reverse the merge;
- the history of how the system previously understood each side.

The system must never merge by overwriting one entity with another.

### Historical Traceability

Every meaningful evolution should remain traceable.

The system should be able to answer:

- What did Life OS previously believe?
- What new evidence changed that belief?
- Was the change caused by observation, user confirmation, user correction, time, or contradiction?
- What is the current understanding?
- What remains uncertain?
- What should no longer influence future behavior?

This traceability is required for trust.

It also protects future engineering work from building on hidden assumptions.

### Confidence Changes

Confidence should evolve with evidence.

It may increase when observations converge, context remains stable, relationships support the same interpretation, and the user confirms.

It may decrease when contradictions appear, context changes, an alias becomes ambiguous, a user correction arrives, or old information stops being supported.

Decreasing confidence is healthy.

It means the memory is alive enough to retreat from unsupported assumptions.

### Memory States Over Time

Living Memory should support memories moving through states such as:

- candidate;
- active;
- uncertain;
- contradicted;
- confirmed;
- obsolete;
- archived;
- hidden;
- forgotten by user instruction.

These states are conceptual.

The implementation may express them differently, but it must preserve the behavior.

The important rule is that memory should not be either "stored" or "not stored."

There must be room for weak, emerging, stable, contradicted, outdated, and intentionally forgotten knowledge.

---

## 10. Human Validation

Human validation protects the user's authority over their memory.

It must be selective.

Asking too often turns the user into an operator of the system.

Asking too rarely allows the system to become overconfident.

The correct behavior is to ask when the answer matters and wait when it does not.

### Validation Is Required

Validation is required when:

- a merge may combine two important entities;
- an uncertain match affects a person, family member, relationship, health matter, financial matter, belief, conflict, identity, or other sensitive topic;
- the system would otherwise convert a weak hypothesis into durable memory;
- a contradiction affects a consequential memory;
- an entity or memory correction would change what Life OS relies on in future interactions;
- the user explicitly asks for something to be remembered accurately;
- the system has a history of being wrong in a similar context;
- the cost of a false positive is meaningfully higher than the cost of waiting.

### Validation Is Optional

Validation is optional when:

- the match is likely but low impact;
- the memory can remain tentative;
- the system can enrich with uncertainty preserved;
- the user can easily correct later;
- the observation is useful but not consequential;
- the system is only preparing future evidence, not relying on the conclusion.

Optional validation should not interrupt the user's flow by default.

It may appear as a quiet review opportunity.

### AI May Decide Alone

AI may decide without asking when:

- the decision is low impact;
- the observation is clearly temporary;
- the system is choosing to ignore, archive, or keep unresolved rather than assert;
- the user has already confirmed the relevant rule or identity;
- the action does not increase reliance on sensitive or uncertain memory;
- the decision can be safely corrected later;
- the system is applying deterministic user-controlled rules.

AI deciding alone should usually mean restraint:

- keep unresolved;
- preserve a weak candidate;
- archive inactive context;
- avoid creating a memory;
- use tentative language;
- avoid surfacing a conclusion.

The system should not interpret "AI may decide alone" as permission to make bold inferences.

### Validation Experience Principles

Validation questions should be:

- rare;
- specific;
- easy to answer;
- easy to ignore;
- grounded in visible context;
- free of pressure;
- free of internal system language.

The user should feel they are guiding their memory, not correcting a machine's private data model.

---

## 11. Engineering Components

Living Memory affects several conceptual components of the system.

This section identifies responsibilities, not implementation modules.

### Observation Processing

Observation processing must continue to extract provisional meaning from captures.

For v0.2, it must also provide enough context for later memory decisions:

- possible entities;
- possible aliases;
- possible relationships;
- possible memory candidates;
- possible contradictions;
- confidence and sensitivity signals;
- source context;
- temporal context.

Observation processing must not make final memory decisions.

It prepares evidence.

### Candidate Matching

Candidate matching identifies possible links between a new observation and existing memory.

It should return possibilities, not conclusions.

Its responsibility is to find plausible existing entities, possible duplicates, possible aliases, and unresolved references so that evidence evaluation can decide what to do.

### Evidence Evaluation

Evidence evaluation compares the new observation with existing understanding.

It determines whether evidence supports, weakens, contradicts, or fails to affect candidate knowledge.

It should be able to explain why a decision is safe, unsafe, premature, or validation-worthy.

### Memory Engine

The memory engine owns decisions about memory state.

It determines whether to create, enrich, contradict, confirm, weaken, archive, ignore, or keep unresolved.

It must preserve traceability.

It must prevent weak observations from becoming durable memory too quickly.

### Entity Engine

The entity engine owns entity evolution.

It handles enrichment, possible duplicate handling, merge decisions, alias management, confidence changes, and historical continuity.

It must protect against false merges.

It must preserve the difference between confirmed identity and possible relationship.

### Contradiction Handling

Contradiction handling detects and preserves conflicts between new evidence and existing memory.

It must distinguish:

- true conflict;
- temporal change;
- separate entities;
- outdated assumption;
- weak contradiction;
- user correction.

It must recommend whether to ask the user, wait for evidence, or preserve both interpretations.

### History And Traceability

History and traceability preserve how memory changed.

This component should allow the system to reconstruct the path from observation to current understanding.

It should make corrections and reversals possible.

It should ensure that current memory does not pretend to have always been known.

### Briefing Generation

Briefing generation should consume Living Memory responsibly.

It should prefer stable, relevant, current knowledge.

It should avoid treating weak candidates, unresolved references, and contradictions as settled facts.

It may surface uncertainty only when it is useful to the user.

It must not turn Living Memory into proactive suggestion behavior.

---

## 12. Required Testing

v0.2 requires behavioral validation, not only technical correctness.

Tests should prove that Living Memory protects trust under realistic memory conditions.

### Duplicate Detection

The system should identify possible duplicates without automatically merging them.

Expected behavior:

- similar names produce candidate duplicate states;
- obvious duplicates with strong evidence may be prepared for merge;
- ambiguous duplicates remain unresolved or request validation;
- possible duplicates do not pollute stable memory as confirmed identity.

### Entity Enrichment

The system should enrich an existing entity when evidence supports the link.

Expected behavior:

- confirmed aliases enrich the correct entity;
- repeated context strengthens the entity;
- enrichment preserves the source observation;
- uncertain enrichment remains marked as uncertain;
- enrichment does not erase prior entity history.

### Contradiction Preservation

The system should preserve contradictions without prematurely resolving them.

Expected behavior:

- conflicting facts remain visible to the memory layer;
- old and new evidence are both preserved;
- contradictions can lower confidence;
- contradictions can trigger validation when consequential;
- contradictions explained by time become evolution rather than error.

### Confidence Evolution

The system should adjust confidence as evidence changes.

Expected behavior:

- repeated independent evidence can increase confidence;
- user confirmation can establish confirmed understanding;
- user correction can lower or replace prior confidence;
- contradictions can prevent confidence from increasing;
- old unsupported assumptions can become less active.

### History Preservation

The system should preserve meaningful memory history.

Expected behavior:

- changes can be traced to observations or user actions;
- previous understanding remains reconstructable;
- merges preserve both prior identities;
- corrections are retained as correction history;
- archived information no longer behaves as current knowledge.

### False-Positive Protection

The system should prefer unresolved memory over harmful false certainty.

Expected behavior:

- two people with the same first name are not merged without strong evidence;
- sensitive inferences are not promoted from weak observations;
- a temporary emotional statement does not become a durable identity claim;
- possible relationships remain possible, not confirmed;
- the system asks the user when consequence is high.

### Memory Decision Coverage

Tests should cover every canonical decision:

- create new entity;
- enrich existing entity;
- keep unresolved;
- request user confirmation;
- preserve contradiction;
- merge;
- archive;
- ignore.

Each test should verify both the resulting state and the reason the decision is allowed.

### Briefing Safety

Briefings should not present uncertain or contradicted knowledge as settled.

Expected behavior:

- confirmed and high-confidence memories can be used directly;
- medium-confidence memory is phrased cautiously when used;
- low-confidence memory is usually omitted;
- contradicted memory is not used as current truth;
- archived memory is used only when historical context is relevant.

---

## 13. Pull Request Plan

Implementation should be decomposed into small, reviewable PRs.

Each PR should compile independently, remain inside scope, and avoid unrelated product changes.

The suggested implementation order is below.

### PR 1 - Living Memory Decision Vocabulary

Goal

Define the conceptual decision states and shared vocabulary required by Living Memory.

Scope

- introduce decision categories for create, enrich, unresolved, validation, contradiction, merge, archive, and ignore;
- define confidence and sensitivity behavior boundaries;
- document how decisions relate to existing observations, entities, and memories;
- add focused tests for decision classification behavior where applicable.

Acceptance criteria

- all canonical decisions are represented consistently;
- no user-facing product redesign is introduced;
- no automatic merging is introduced;
- existing v0.1 behavior continues to compile and operate.

### PR 2 - Candidate Matching Layer

Goal

Add a candidate matching step between observation processing and memory decisions.

Scope

- identify possible existing entities for a new observation;
- identify likely new entities;
- identify possible duplicates and aliases;
- preserve unresolved references;
- expose candidate match reasons for later evaluation.

Acceptance criteria

- matching produces candidates rather than final mutations;
- ambiguous matches remain unresolved;
- candidate reasons are traceable;
- existing entity creation flows are not broken.

### PR 3 - Evidence Evaluation Layer

Goal

Evaluate candidate matches against evidence before memory changes occur.

Scope

- evaluate supporting and weakening evidence;
- consider temporal context, recurring relationships, confirmations, corrections, and sensitivity;
- determine whether a candidate is safe to use, should wait, should ask, or should preserve contradiction;
- add tests for evidence-driven confidence changes.

Acceptance criteria

- repeated evidence can strengthen confidence;
- contradictions can weaken confidence;
- sensitive conclusions require stronger support;
- user corrections override system inference.

### PR 4 - Entity Enrichment And Duplicate Protection

Goal

Allow entities to evolve without creating false merges.

Scope

- enrich existing entities with aliases, roles, relationships, and context when supported;
- detect possible duplicates without merging by default;
- require stronger evidence or validation for merges;
- preserve distinction between known same, known different, and possibly related.

Acceptance criteria

- enrichment does not overwrite prior entity context;
- possible duplicates are visible to the memory layer;
- ambiguous people are not merged automatically;
- confirmed aliases improve future matching.

### PR 5 - Contradiction Handling

Goal

Preserve contradictions as first-class memory events.

Scope

- detect conflicts between new observations and existing memory;
- distinguish possible change from possible error;
- lower confidence or request validation when needed;
- preserve competing facts until resolved.

Acceptance criteria

- contradictory observations do not overwrite existing memory;
- contradictions are traceable to evidence;
- user clarification can resolve a contradiction;
- unresolved contradictions are not used as settled truth.

### PR 6 - Memory History And Confidence Evolution

Goal

Preserve how memories and entities change over time.

Scope

- record meaningful memory evolution events;
- support confidence increases and decreases;
- preserve correction history;
- support archive and obsolete states conceptually;
- ensure previous understanding remains reconstructable.

Acceptance criteria

- memory changes can be traced to evidence;
- confidence can decrease without deleting memory;
- archived memory has reduced current influence;
- user corrections remain authoritative.

### PR 7 - Briefing Integration

Goal

Ensure briefings consume Living Memory responsibly.

Scope

- prefer current, stable, relevant memories;
- avoid presenting unresolved, contradicted, or weak memory as fact;
- use cautious language when uncertainty is useful;
- avoid proactive suggestion behavior.

Acceptance criteria

- briefings do not expose internal memory machinery;
- contradicted memories are not treated as current truth;
- low-confidence candidates are omitted unless explicitly relevant;
- v0.1 briefing behavior remains simple.

### PR 8 - End-To-End Living Memory Validation

Goal

Validate the full v0.2 memory behavior across realistic scenarios.

Scope

- add end-to-end scenarios for duplicate detection, enrichment, contradiction, validation, merge, archive, and ignore;
- verify false-positive protection;
- verify history preservation;
- document known limitations for future versions.

Acceptance criteria

- every canonical decision path is covered;
- false merges are prevented in ambiguous scenarios;
- user confirmation changes future behavior;
- Living Memory is complete enough to support later Life Graph work without implementing Life Graph.

---

## 14. Risks

Living Memory introduces deeper intelligence into personal data.

The primary risks are trust risks.

### False Merges

A false merge can corrupt the user's memory by combining two different people, projects, places, or contexts.

This is one of the highest-risk failure modes.

Mitigation:

- require stronger evidence for merge than enrichment;
- preserve possible duplicate states;
- ask the user when consequence is meaningful;
- make merges reversible;
- preserve pre-merge history.

### Memory Corruption

Memory corruption occurs when new information overwrites old context without preserving history.

It can make Life OS appear to have forgotten, distorted, or fabricated the user's past.

Mitigation:

- treat evolution as additive and traceable;
- preserve previous understanding;
- distinguish current truth from historical truth;
- never silently delete important context;
- keep user corrections authoritative.

### Over-Aggressive Inference

The system may infer too much from weak evidence.

This is especially dangerous for relationships, identity, health, finance, beliefs, conflict, emotions, and third-party information.

Mitigation:

- raise evidence requirements for sensitive topics;
- prefer unresolved states over speculative certainty;
- test temporary emotional statements explicitly;
- prevent weak observations from becoming durable memory;
- use validation when consequence is high.

### Memory Fragmentation

The opposite risk is failing to connect related observations.

This can create duplicate entities, scattered memory, and weak briefings.

Mitigation:

- introduce candidate matching before memory decisions;
- use aliases, temporal context, recurring relationships, and confirmations;
- preserve possible relationships for future evidence;
- allow later merge when evidence becomes strong.

### User Interruption

Too many validation requests can make Life OS feel like work.

Mitigation:

- ask only when uncertainty has meaningful consequences;
- allow optional validation for low-impact cases;
- wait for more evidence when safe;
- keep validation questions simple and specific.

### Hidden Automation

Living Memory may become difficult to trust if the system silently changes important memory.

Mitigation:

- preserve traceability;
- expose review opportunities for meaningful changes;
- never hide uncertainty from the memory layer;
- keep sensitive or consequential changes validation-gated.

### Performance And Complexity

Matching, evidence evaluation, and history can make the system heavier.

Mitigation:

- keep v0.2 scoped to memory behavior;
- avoid unnecessary abstractions;
- evaluate only the context needed for the decision;
- prefer simple deterministic controls around generative interpretation;
- decompose implementation into small PRs.

### Briefing Overconfidence

Briefings may accidentally present uncertain memory as settled.

Mitigation:

- make confidence behavior available to briefing generation;
- exclude weak candidates by default;
- preserve cautious language for uncertain context;
- test contradicted memory in briefing scenarios.

---

## 15. Success Criteria

Living Memory is complete for v0.2 when Life OS can receive a new observation and make a careful, traceable memory decision without collapsing uncertainty into false certainty.

Success is defined by product behavior, not by code structure.

v0.2 is complete when:

- Life OS can distinguish new entities from likely existing entities;
- Life OS can preserve unresolved references without forcing a conclusion;
- Life OS can detect possible duplicates without automatically merging them;
- Life OS can enrich entities while preserving prior history;
- Life OS can accumulate evidence across observations;
- Life OS can increase, decrease, or preserve confidence based on evidence;
- Life OS can treat user confirmation and correction as authoritative;
- Life OS can preserve contradictions until they are clarified, explained by time, or safely left unresolved;
- Life OS can archive inactive or obsolete memory without deleting history;
- Life OS can ignore low-value observations without weakening the original capture model;
- Life OS can prevent false merges in ambiguous identity scenarios;
- Life OS can keep sensitive inferences tentative unless clearly supported or validated;
- Life OS can explain internally why a memory decision occurred;
- briefings can rely on stable memory while avoiding weak or contradicted claims;
- every meaningful memory change remains traceable to observation, evidence, time, or user action.

The final test is behavioral:

When Life OS encounters "Thomas," "Tom," "Thomas Dupont," and "my brother" across different moments, it should not rush to one answer.

It should hold what is known, preserve what is possible, ask only when the answer matters, learn from the user's corrections, and evolve the memory without pretending uncertainty never existed.

That is Living Memory.
