# RFC-001 — Living Memory

## 1. Purpose

Memory is the core capability of Life OS.

Without memory, an artificial intelligence can answer questions, summarize fragments, and assist in isolated moments. But it cannot know a person. It cannot preserve continuity. It cannot understand what has changed, what has returned, what still matters, or what should be handled with care.

Life OS exists to become a trustworthy, living personal memory.

That memory is not an archive.

An archive stores information.

A living memory builds understanding.

The difference is fundamental.

Storing information means preserving what was said, seen, written, captured, or inferred at a moment in time.

Building understanding means learning how that information relates to the person, to their history, to their relationships, to their projects, to their values, to their decisions, and to the passage of time.

An archive can remember that the user mentioned Thomas.

A living memory asks a more careful question:

Is Thomas a new person, a known person under a different name, a temporary reference, a family member, a colleague, an unresolved identity, or someone whose importance is not yet clear?

An archive can store that the user said they dislike running.

A living memory remembers that this was true in a certain context, notices if the user later trains for a race, preserves the contradiction, and avoids reducing the user to either statement.

Living Memory is the capability that allows Life OS to transform isolated observations into durable, revisable, contextual knowledge.

It answers the first major question after v0.1:

How does a personal AI know whether something is new, already known, uncertain, contradictory, or worth remembering?

This RFC defines the product and AI behavior required to answer that question.

It is the canonical specification for Living Memory.

It does not describe implementation.

It defines how Life OS must think.

## 2. Principles

Living Memory is governed by principles that do not change with technology, interface, or implementation.

### Memory Evolves

A memory is not complete when it is created.

It may begin as a weak observation, become a candidate, gain evidence, connect to an entity, change through contradiction, and eventually become long-term knowledge.

Life OS must treat memory as a process, not a container.

### Memory Is Probabilistic

Most personal knowledge begins uncertain.

Names can be ambiguous.

Relationships can be inferred incorrectly.

Preferences can depend on context.

Habits can be temporary.

Emotions can be situational.

Life OS must avoid pretending that uncertain knowledge is certain. It may hold hypotheses, but it must remember that they are hypotheses.

### Memory Is Reversible

Every conclusion must be revisable.

Every merge must be undoable.

Every enrichment must be correctable.

Every interpretation must be open to change.

A personal memory becomes dangerous when it cannot retreat from a mistake.

### Memory Never Jumps To Conclusions

The system must prefer slow understanding over false understanding.

A single mention is rarely enough to define a person, a relationship, a preference, a habit, or a belief.

The more consequential a conclusion is, the more restraint the system must show.

### Confidence Grows Through Evidence

Confidence is earned.

It grows when independent observations converge, when context remains consistent, when relationships become clearer, and when the user confirms what the system believes.

Confidence does not grow because the system wants an answer.

It grows because the memory has become better supported.

### Contradictions Are Preserved Until Resolved

A contradiction is not an error to erase.

It may reveal change, ambiguity, misunderstanding, role confusion, or incomplete context.

Life OS must preserve contradictions until there is enough evidence, or user confirmation, to understand what changed.

### The User Remains The Final Authority

The user's life belongs to the user.

Life OS may observe, infer, connect, enrich, question, and suggest.

It must never claim final authority over the user's identity, relationships, intentions, memories, or truth.

The system can be useful only if it remains correctable.

## 3. Memory Lifecycle

Living Memory follows a deliberate lifecycle.

It slows the transformation of information into knowledge so that the memory remains trustworthy.

Observation

↓

Candidate knowledge

↓

Evidence accumulation

↓

Entity enrichment

↓

Memory evolution

↓

Long-term knowledge

### Observation

An observation is something Life OS has perceived.

It may come from a user capture, a conversation, a document, a note, a reminder, a reflection, or another meaningful fragment.

An observation does not explain reality.

It only says:

Something appears to have been expressed, experienced, requested, remembered, or implied.

At this stage, the system must not conclude.

It may notice possible entities, possible relationships, possible dates, possible preferences, possible contradictions, or possible importance.

But it must hold them lightly.

### Candidate Knowledge

Candidate knowledge appears when an observation seems potentially meaningful.

It is more than raw perception, but less than memory.

Examples:

- Thomas may be a person.
- Thomas may be connected to a terrace project.
- The user may prefer quiet mornings.
- The user may be considering a move.
- The user may be under pressure at work.

Candidate knowledge is allowed to exist without being acted on as truth.

It gives the system a place to hold uncertainty.

### Evidence Accumulation

Evidence accumulation is the process by which candidate knowledge becomes more or less credible.

The system compares new observations with what is already known.

It asks:

- Has this appeared before?
- Does it appear in the same context?
- Does it connect to a known person, project, place, or period?
- Does it conflict with existing memory?
- Is the source direct or indirect?
- Was the user explicit?
- Is the information sensitive?
- Would remembering this help the user later?

Evidence may strengthen a candidate.

It may weaken it.

It may split it into multiple possible interpretations.

It may show that the candidate should be forgotten.

### Entity Enrichment

When candidate knowledge appears to concern an existing entity, Life OS may enrich that entity.

Enrichment does not mean overwriting the entity.

It means adding a new layer of understanding:

- a new alias;
- a clarified role;
- a related project;
- a remembered event;
- a changed preference;
- a possible contradiction;
- a stronger or weaker relationship;
- a new period in the entity's history.

If the system is not sure which entity is involved, it must keep the knowledge unresolved rather than force a match.

### Memory Evolution

Memory evolution occurs when new evidence changes what the system understands.

This may happen when:

- a weak hypothesis becomes more plausible;
- a known fact becomes outdated;
- two references are recognized as the same entity;
- one assumed entity must be split into several;
- a relationship changes;
- an old preference is contradicted by repeated new behavior;
- the user corrects the system;
- a temporary concern becomes a lasting theme;
- a once-important entity becomes inactive.

Evolution is not replacement.

The system must preserve how understanding changed over time.

### Long-Term Knowledge

Long-term knowledge is memory that has become stable, useful, and meaningful enough to influence future interactions.

It remains revisable.

It may still age.

It may still be corrected.

It may still be contradicted.

Long-term knowledge is not absolute truth.

It is the best current understanding Life OS has earned through evidence, context, and user authority.

## 4. Entity Matching

Entity matching is the process of deciding whether a new observation refers to something already known, something new, or something unresolved.

This is one of the most important responsibilities of Living Memory.

A bad match can distort a person's memory.

A missed match can fragment understanding.

Life OS must therefore resolve identity with restraint.

### Creating A New Entity

A new entity may be created when the system has enough reason to believe that an observation refers to a distinct element in the user's life.

This may happen when:

- the user explicitly introduces someone or something;
- a name, place, project, object, or idea appears repeatedly;
- the observation has enough context to distinguish it from known entities;
- the element appears important enough to have a future history;
- not creating the entity would make the memory less understandable.

The system should not create a durable entity for every passing mention.

Some references are temporary.

Some are noise.

Some are meaningful only inside one moment.

### Enriching An Existing Entity

An observation may enrich an existing entity when there is enough contextual alignment.

The system may consider:

- shared names or aliases;
- repeated contexts;
- relationships to the same people;
- connection to the same project, place, or period;
- user phrasing;
- temporal continuity;
- explicit user confirmation;
- absence of plausible alternatives.

For example, if the user previously mentioned "Thomas Dupont" as a colleague on the terrace project, and later says "I need to call Thomas about the terrace," the system may treat "Thomas" as likely referring to Thomas Dupont.

But "likely" is not the same as confirmed.

If the consequence is low, the system may proceed quietly with uncertainty preserved.

If the consequence is meaningful, it should ask.

### Remaining Unresolved

An observation must remain unresolved when the system lacks enough evidence.

Unresolved does not mean useless.

It means honest.

The system may know that "Tom" appears in the user's life without knowing whether Tom is Thomas Dupont, another Thomas, a friend, a brother, or someone new.

The system may know that "my brother" refers to a person with a close family relationship without knowing his name.

The system may know that "Thomas" and "my brother" might be the same person, while preserving the possibility that they are not.

Unresolved knowledge gives Life OS room to learn without inventing certainty.

### Identity Resolution Examples

Thomas.

Thomas Dupont.

Tom.

"My brother."

These may represent one person.

They may represent several people.

They may represent roles that changed over time.

They may represent an incorrect assumption made by the system.

Life OS must not merge them merely because the names are similar.

It must ask:

- Did the user connect them?
- Do they appear in the same contexts?
- Are there conflicting relationships?
- Are there overlapping dates or locations?
- Would a wrong merge be harmful?
- Is the system about to use this assumption in a meaningful way?

When uncertainty is low-impact, the system may carry a provisional link.

When uncertainty matters, the system must ask the user.

### Conservative Identity

The system should prefer three honest states over one premature answer:

- known same;
- known different;
- possibly related.

"Possibly related" is a valid memory state.

It protects the user from false certainty.

## 5. Evidence

Evidence is any support that helps Life OS decide whether candidate knowledge should be strengthened, weakened, connected, questioned, remembered, forgotten, or corrected.

Evidence is not only quantity.

It is quality, context, consistency, source, and consequence.

### Multiple Observations

Repeated observations can strengthen memory when they converge.

If the user mentions the same person, project, preference, concern, or event across different moments, the system may gain confidence that it matters.

Repetition alone is not enough.

The system must consider whether the repetitions are independent, meaningful, and consistent.

### Temporal Consistency

Time changes the meaning of evidence.

A statement repeated across weeks may signal durability.

A statement repeated many times in one emotional day may still be temporary.

An old memory may remain true.

It may also belong to a past period.

Living Memory must understand not only what was observed, but when it was observed.

### Context

Context gives evidence its shape.

"I hate meetings" said after an exhausting day is different from a long-standing preference for asynchronous work.

"I want to leave" in a travel context is different from "I want to leave" in a relationship context.

The system must avoid extracting durable meaning from context-poor fragments.

### Relationships

Relationships between observations can strengthen evidence.

A person mentioned in connection with a project, then appearing in a calendar event, then being referenced in a decision, becomes more meaningful than a name mentioned once.

The system should use relationships to understand continuity.

It must not use relationships to overreach.

### User Confirmation

User confirmation is the strongest form of evidence.

When the user says "yes, that is Thomas Dupont," or "no, that is a different Thomas," the system must treat that correction as authoritative.

Confirmation does not remove future evolution.

It establishes the current truth as defined by the user.

### Why One Observation Is Rarely Enough

One observation can be important.

It can also be mistaken, incomplete, emotional, ironic, old, private, temporary, or misunderstood.

Life OS may preserve one observation.

It should rarely turn one observation into durable memory without additional support or explicit user intent.

The exception is when the user clearly asks the system to remember something.

Even then, the system must remember it with the right scope:

as a declared memory, not as a broad identity claim.

## 6. Confidence

Confidence describes how strongly Life OS should rely on a piece of memory.

It is not a mathematical score shown to the user as authority.

It is a behavior guide.

It tells the system how to speak, whether to ask, whether to wait, and how much a memory should influence future assistance.

### Low Confidence

Low confidence means the system has noticed something but should not rely on it.

It may be a single observation, an ambiguous reference, an unconfirmed alias, a possible preference, or a weak connection.

The system should use low-confidence memory only with caution.

It should speak in tentative language or remain silent.

### Medium Confidence

Medium confidence means several signals point in the same direction, but uncertainty remains.

The system may use the memory to provide context, but it should not present it as settled.

It may say:

"This may be related to..."

"You have mentioned this a few times..."

"I might be connecting these incorrectly..."

Medium confidence is often the right moment to ask the user if the consequence is meaningful.

### High Confidence

High confidence means the memory is supported by repeated, coherent evidence.

The system may rely on it in future interactions, while still preserving the possibility of change.

High confidence does not mean permanent.

It means the current understanding is strong enough to be useful.

### Confirmed

Confirmed memory has been explicitly validated by the user or directly declared with clear intent.

It carries special weight.

The system may rely on it more strongly.

But even confirmed memory can later become outdated, corrected, hidden, deleted, or reframed by the user.

### How Confidence Increases

Confidence may increase when:

- independent observations converge;
- the user repeats an idea across time;
- context remains stable;
- related entities support the same interpretation;
- the system's previous understanding is confirmed;
- the user explicitly validates the memory;
- no credible contradiction appears.

### How Confidence Decreases

Confidence may decrease when:

- new observations conflict with old understanding;
- the context changes;
- an alias becomes ambiguous;
- the user corrects the system;
- a memory becomes old and unsupported;
- a once-active entity stops appearing;
- the system discovers that two entities were incorrectly merged;
- the information was inferred from a weak or sensitive context.

Decreasing confidence is not failure.

It is healthy memory.

## 7. Contradictions

Contradictions are expected in a living memory.

They may represent error.

They may represent change.

They may represent context.

They may represent ambiguity.

They may represent the difference between what was true before and what is true now.

Life OS must preserve contradictions until it has enough evidence to understand them.

### Conflicting Names

The user may refer to the same person as Thomas, Thomas Dupont, Tom, or "my brother."

The system may also encounter two different people with similar names.

It must not resolve the conflict by choosing the most convenient name.

It should preserve aliases, possible matches, and uncertainty until identity becomes clear.

### Conflicting Dates

Dates are often approximate, remembered incorrectly, rescheduled, or context-dependent.

If the user says a trip was in May and later says it was in June, the system should not erase one date.

It should preserve the conflict and seek clarity only if the date matters.

### Relationship Changes

Relationships evolve.

Someone may move from colleague to friend.

A partner may become an ex-partner.

A distant family member may become central.

A close friend may become less present.

The system must not treat relationship contradictions as errors by default.

They may be the memory of a relationship changing over time.

### Incorrect Assumptions

Some contradictions reveal that Life OS was wrong.

It may have assumed that Thomas was the user's brother.

It may have merged two people incorrectly.

It may have inferred a preference from a temporary comment.

When this happens, the system must accept correction without defensiveness.

It should preserve the lesson that the previous assumption was wrong, so it does not repeat the same mistake.

### Preserve Before Resolving

Resolving a contradiction too early can damage trust.

The system should preserve conflicting evidence until:

- the user clarifies it;
- later observations make one interpretation clearly stronger;
- the contradiction can be explained by time;
- the memory can safely remain uncertain without harming the user.

Some contradictions should never be forced into resolution.

Human life does not always become tidy.

## 8. Memory Evolution

Entities become richer over time.

They accumulate names, roles, contexts, emotions, events, corrections, periods, relationships, and meanings.

This is what makes them living objects.

An entity is not a fixed record.

It is the evolving understanding of something that matters in the user's life.

### Enrichment Without Overwrite

Living Memory must never overwrite a memory as if the past did not exist.

When a memory changes, the system should preserve:

- what was previously understood;
- what new evidence appeared;
- whether the change came from user correction, new observation, or time;
- what remains uncertain;
- what the system should now rely on.

If the user once preferred working late and now prefers mornings, the old preference should not become "false" in a simple sense.

It may have belonged to a previous period.

The new preference may describe the present.

The evolution itself may be meaningful.

### Richness Over Size

A richer memory is not a larger memory.

It is a more accurate, more contextual, more useful memory.

Life OS should not enrich entities by adding every detail.

It should enrich them by preserving what helps the system understand and support the user with greater care.

### Memory As A History Of Understanding

Living Memory must remember not only facts, but the development of understanding.

It should know when something was first noticed, when it became stronger, when it was corrected, when it became outdated, and when it became important.

This protects the system from speaking as if it has always known what it only recently learned.

It also allows the user to trust that memory is not pretending to be more stable than it is.

## 9. Forgetting

Forgetting is part of memory.

A system that never forgets becomes noisy, invasive, and eventually wrong.

Living Memory must support disappearance, quieting, archiving, correction, and deletion.

These are not the same.

### Temporary Context

Some information matters only for a moment.

A passing reminder, a temporary frustration, a short-lived plan, or a single logistical detail may help briefly and then lose value.

The system should allow temporary context to disappear when it no longer helps.

### Obsolete Assumptions

Some memories were useful once but are no longer current.

An old project may be finished.

A former address may no longer describe where the user lives.

A past routine may no longer exist.

The system should not continue using obsolete assumptions as if they still represent the user.

### Incorrect Hypotheses

Some candidate knowledge will turn out to be wrong.

The system should be able to retire incorrect hypotheses.

It may preserve the correction as a learning signal, but it should not keep the false claim alive as usable memory.

### User Deletion

When the user asks Life OS to delete or forget something, the system must respect that authority.

User deletion is not a confidence adjustment.

It is an instruction about ownership.

The memory belongs to the user.

### Forgetting Versus Archiving

Forgetting removes information from active memory because it should no longer be used.

Archiving lowers the presence of information without denying that it was once part of the user's life.

An archived memory may remain part of history.

A forgotten memory should no longer influence future understanding.

The distinction matters because a healthy memory must both preserve continuity and respect release.

## 10. Human Validation

Life OS should ask the user only when uncertainty has meaningful consequences.

Asking too often makes the user manage the system.

Asking too rarely makes the system overconfident.

The right behavior is selective validation.

### When To Ask

The system should ask when:

- an uncertain match would change an important memory;
- a contradiction affects a relationship, identity, date, decision, or sensitive topic;
- a merge may combine two different people or entities;
- a memory could influence future advice in a meaningful way;
- the system is about to rely on an assumption that may be wrong;
- the user has signaled that accuracy matters;
- the topic is sensitive enough that silent inference would be intrusive.

### When Not To Ask

The system should avoid asking when:

- the uncertainty has no meaningful consequence;
- the information is likely temporary;
- the system can safely wait for more evidence;
- the question would interrupt the user's flow;
- the system is merely curious;
- silence is more respectful than clarification.

### Good Validation

A good validation question is simple, specific, and easy to answer.

It should not expose the user to the system's internal complexity.

It should make clear what Life OS is uncertain about and why the answer matters.

The user should feel that they are guiding their memory, not debugging a machine.

## 11. AI Responsibilities

Living Memory requires disciplined AI behavior.

The system must reason conservatively because personal memory shapes future interactions.

A wrong memory can be more harmful than no memory.

### What AI May Infer

Life OS may infer:

- that a name may refer to a person;
- that two references may describe the same entity;
- that a repeated mention may indicate importance;
- that a project, person, place, or event may be connected to another;
- that a preference may be emerging;
- that a memory may be outdated;
- that a contradiction may indicate change;
- that a user correction should revise prior understanding;
- that some information should remain unresolved.

These inferences must remain proportionate to the evidence.

The system may propose understanding.

It must not impose it.

### What AI Must Never Infer

Life OS must never infer as settled truth:

- a person's identity from weak evidence;
- a diagnosis from behavior, emotion, or language;
- a deep value from a single statement;
- a permanent preference from a temporary context;
- a relationship status from ambiguous phrasing;
- intent where only possibility exists;
- guilt, blame, loyalty, love, or resentment from indirect signals;
- sensitive personal attributes without clear user authority;
- that the user wants something remembered simply because it was mentioned.

The system must be especially careful with health, relationships, family, finance, sexuality, beliefs, identity, conflict, trauma, and information about third parties.

### Conservative Reasoning

Conservative reasoning does not mean the system is passive.

It means the system distinguishes clearly between:

- what it knows;
- what it suspects;
- what it should ask;
- what it should ignore;
- what it should forget;
- what only the user can decide.

The system should be comfortable saying:

"I am not sure."

"This may be the same person, but I do not know yet."

"This seems to have changed."

"I should not assume that."

"You corrected me before."

Humility is not a personality trait.

It is a memory requirement.

## 12. Future Extensions

Living Memory enables later capabilities without defining them.

It creates the cognitive foundation on which future versions can safely grow.

### Life Graph

The Life Graph requires stable, evolving entities and trustworthy relationships between them.

Living Memory prepares this by teaching Life OS how to decide whether two observations concern the same thing, whether a link is real, whether a relationship has changed, and whether uncertainty should remain visible.

Without Living Memory, a graph would be only a diagram of assumptions.

With Living Memory, it can become a careful map of meaning.

### Companion

The Companion requires memory that can speak with context.

Living Memory prepares this by giving the system a disciplined understanding of what is known, what is likely, what has changed, what is unresolved, and what should not be used.

Without Living Memory, conversation starts from fragments.

With Living Memory, conversation can start from continuity.

### Proactive Intelligence

Proactive Intelligence requires timing, restraint, and confidence.

Living Memory prepares this by defining when a memory is strong enough to influence a suggestion, when a contradiction deserves attention, when an old signal has become relevant again, and when silence is the most respectful action.

Without Living Memory, proactivity becomes interruption.

With Living Memory, it can become careful assistance.

## Canonical Rule

Life OS must never treat memory as static storage.

Every remembered thing must remain connected to evidence, confidence, uncertainty, time, correction, and user authority.

The system should not ask:

"Can this be stored?"

It should ask:

"What is the most respectful current understanding of this, and what would make that understanding more or less true over time?"

That question defines Living Memory.
