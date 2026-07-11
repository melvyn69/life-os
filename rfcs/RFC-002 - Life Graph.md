RFC-002 — Life Graph

Statut : Approved
Version cible : Life OS v0.3
Auteur décisionnaire : Fondateur
Responsables du cadrage : Product, CTO, AI Architecture
Dépendance principale : Life OS v0.2 — Living Memory
Document suivant : SPEC-002 — Life Graph Implementation

⸻

1. Purpose

This RFC defines the product behavior of the Life Graph for Life OS v0.3.

The Life Graph is the layer that makes the relationships inside a human life progressively understandable.

It does not create a second memory system.

It does not replace entities, observations, memories or briefings.

It does not attempt to map an entire person exhaustively.

Its purpose is to reveal, with caution and clarity, how the meaningful elements of a life are connected.

The Life Graph must answer questions such as:

* Who matters in this project?
* What memories are connected to this place?
* Which relationships have evolved over time?
* What parts of my life repeatedly appear together?
* Why does Life OS believe that two elements are related?
* Is this relationship confirmed, suggested, outdated or contradicted?

The Life Graph must remain understandable on mobile, explainable by evidence and reversible by the user.

⸻

2. Context

Life OS v0.1 introduced the foundational flow:

Capture
→ Observation
→ Entity
→ Memory
→ Briefing

Life OS v0.2 introduced Living Memory and established the principles required for trustworthy knowledge evolution:

* conservative entity enrichment;
* immutable evidence;
* deterministic confidence evolution;
* explicit confirmation and correction;
* preservation of contradictions;
* duplicate detection without automatic merging;
* server-side validation of sensitive actions;
* filtering of unreliable knowledge from briefings.

These foundations allow Life OS to understand individual elements of a life.

They do not yet allow Life OS to express how these elements relate to each other.

A person is not a collection of isolated facts.

A person is shaped by relationships between:

* people;
* projects;
* places;
* events;
* passions;
* habits;
* values;
* organizations;
* periods of life;
* memories.

Life OS v0.3 introduces the first trusted representation of these relationships.

⸻

3. Product Definition

The Life Graph is a living, evidence-backed representation of meaningful relationships between entities in a person’s life.

It is:

* progressive;
* contextual;
* temporal;
* explainable;
* uncertainty-aware;
* controlled by the user.

It is not:

* an exhaustive database visualization;
* a social graph;
* a contact manager;
* a CRM;
* a mind map;
* a task dependency graph;
* an organization system the user must maintain;
* a psychological diagnosis of the user;
* an autonomous interpretation of human relationships.

The graph exists to support understanding.

It must never require the user to organize their life manually for the system to function.

⸻

4. Fundamental Principle

The Life Graph does not decide what a life means.

It proposes an understandable representation of relationships supported by evidence.

Every meaningful relationship must be traceable to one or more of the following:

* explicit user statements;
* validated observations;
* confirmed memories;
* confirmed entity attributes;
* repeated contextual evidence;
* explicit user confirmation.

No relationship may become trusted solely because an AI model produced a plausible interpretation.

Plausibility is not evidence.

Co-occurrence is not automatically a meaningful relationship.

Repetition is not automatically importance.

Emotional significance must not be inferred from frequency alone.

⸻

5. Core Product Principles

5.1 Understanding over organization

The Life Graph must reduce cognitive effort.

The user should not need to:

* create folders;
* build hierarchies;
* draw links;
* classify every entity;
* maintain a database manually;
* choose where every piece of information belongs.

The system should progressively surface useful connections from the existing memory flow.

5.2 Caution over apparent intelligence

When evidence is weak, the graph must remain uncertain.

It is preferable to omit a relationship than to present a false relationship as established.

5.3 Human control over irreversible autonomy

The user must retain control over:

* confirmation;
* correction;
* rejection;
* visibility;
* sensitive relationships;
* obsolete relationships.

The system must not silently rewrite confirmed relationships.

5.4 Evidence over persuasion

The graph must be able to explain why a connection exists.

The user must never be asked to trust an opaque result.

5.5 Simplicity over exhaustiveness

The main graph experience must show only the most relevant relationships for the current context.

It must not attempt to display the entire life at once.

5.6 Mobile-first comprehension

The primary experience must work naturally on a mobile device.

The product must not depend on a large desktop canvas to be usable.

⸻

6. Graph Model

The Life Graph consists of:

* nodes;
* relationships;
* evidence;
* relationship states;
* temporal context;
* user decisions.

6.1 Nodes

A node represents an existing Life OS entity.

The Life Graph does not introduce an independent category of graph-only objects.

Potential node types include:

* person;
* project;
* organization;
* place;
* event;
* passion;
* habit;
* object;
* value;
* period;
* other canonical entity types defined by the project documentation.

A node may appear in the graph only when it meets the visibility requirements defined by this RFC and later translated into deterministic rules in SPEC-002.

6.2 Relationships

A relationship represents a meaningful, explainable connection between two entities.

A relationship must always connect two valid entities belonging to the same user.

A relationship is directional when direction carries meaning.

Examples:

* a person contributes to a project;
* a project belongs to an organization;
* an event occurred at a place;
* a memory concerns a person;
* a habit supports an objective;
* a passion was important during a period.

A relationship may be non-directional when direction does not add meaningful information.

Examples:

* two people participated in the same event;
* two memories concern the same period;
* two entities repeatedly appear in the same confirmed context.

Directionality must not be invented only for technical convenience.

⸻

7. Relationship Categories

Life OS v0.3 must use a constrained relationship vocabulary.

The exact canonical list will be frozen in SPEC-002, but RFC-002 establishes the required conceptual families.

7.1 Participation

An entity takes part in another entity.

Examples:

* person → project;
* person → event;
* organization → event.

7.2 Belonging or affiliation

An entity belongs to, works with or is affiliated with another entity.

Examples:

* person → organization;
* project → organization.

Affiliation must not be interpreted as emotional closeness.

7.3 Location

An entity is associated with a place.

Examples:

* event → place;
* memory → place;
* project → place.

Location may be temporary or historical.

7.4 Temporal association

An entity is associated with a period or date range.

Examples:

* project → period;
* passion → period;
* relationship → period.

7.5 Subject or concern

An entity is the subject of another element.

Examples:

* memory → person;
* memory → project;
* event → organization.

7.6 Contribution or support

An entity contributes to another.

Examples:

* person → project;
* habit → objective;
* organization → event.

This category must only be used when contribution is supported by evidence.

7.7 Origin or creation

An entity created, initiated or caused another entity.

Examples:

* person → project;
* organization → event.

Causality requires stronger evidence than simple association.

7.8 Contextual association

Two entities repeatedly appear within a shared, meaningful context.

This is the weakest semantic category allowed in the trusted graph.

It must never imply:

* affection;
* friendship;
* conflict;
* dependency;
* causality;
* hierarchy;
* importance.

A contextual association may later be refined after user confirmation or stronger evidence.

⸻

8. Relationship Sources

Each relationship must identify its source category.

8.1 Explicit relationship

The user directly states the relationship.

Example:

“Sarah works with me on Life OS.”

This may create a high-confidence candidate, subject to deterministic validation.

8.2 Observed relationship

The relationship is supported by one or more validated observations.

Example:

Multiple captures describe Sarah participating in Life OS meetings.

8.3 Memory-backed relationship

The relationship is supported by confirmed or sufficiently reliable memories.

8.4 User-confirmed relationship

The user explicitly confirms a suggested relationship.

8.5 AI-suggested relationship

The AI proposes a possible relationship from available evidence.

An AI-suggested relationship must remain visibly and structurally distinct from a confirmed relationship.

The AI may propose.

It may not silently establish trust.

⸻

9. Co-occurrence Is Not a Relationship

Two entities appearing in the same capture, observation or memory does not automatically prove that a meaningful relationship exists.

Co-occurrence may be used as:

* candidate-generation evidence;
* contextual support;
* a reason to request clarification;
* a reason to suggest a weak association.

It may not automatically establish:

* friendship;
* collaboration;
* conflict;
* family relationship;
* ownership;
* causality;
* emotional importance;
* professional hierarchy;
* dependency.

Example:

A person and an organization appearing in the same photograph do not prove employment.

A person repeatedly mentioned near a project does not prove project ownership.

A place repeatedly mentioned alongside a person does not prove residence.

⸻

10. Relationship Lifecycle

Each relationship follows an explicit lifecycle.

10.1 Suggested

The system has identified a plausible relationship supported by evidence, but it is not yet sufficiently reliable to be treated as confirmed.

Suggested relationships may appear in limited contexts.

They must not be presented as established truth.

10.2 Supported

The relationship is supported by sufficient evidence under deterministic rules but has not been explicitly confirmed by the user.

A supported relationship may appear in the main graph when permitted by visibility rules.

It must remain distinguishable from a confirmed relationship.

10.3 Confirmed

The user has explicitly confirmed the relationship, or the relationship originates from an explicit user declaration satisfying the confirmation rules defined in SPEC-002.

Confirmation must be recorded as a server-side controlled action.

10.4 Corrected

The user has changed the type, direction, meaning, temporal range or participating entities of a relationship.

The previous version must remain preserved in history.

Correction creates a new canonical state.

It must not erase the previous evidence.

10.5 Rejected

The user has indicated that the proposed relationship is false.

A rejected relationship must not silently reappear from the same evidence.

New materially different evidence may create a new candidate, but the previous rejection must be considered.

10.6 Contradicted

Reliable evidence conflicts with the current relationship.

The contradiction must be preserved.

The system must not automatically choose one interpretation.

10.7 Outdated

The relationship was valid in the past but is no longer current.

An outdated relationship is not equivalent to a false relationship.

Examples:

* former employment;
* completed project participation;
* past residence;
* former organizational affiliation.

10.8 Archived

The relationship is removed from active graph views without destroying its history.

Archiving must not be used to conceal unresolved contradictions.

⸻

11. Relationship History

Every meaningful transition must be traceable.

The system must preserve:

* initial creation;
* source evidence;
* confidence evolution inputs;
* user confirmations;
* user corrections;
* rejections;
* contradictions;
* temporal changes;
* archival events.

History must be immutable.

The current relationship state may evolve.

Its evidence and decision history must not be rewritten.

⸻

12. Confidence and Uncertainty

Confidence exists to control system behavior.

It is not a gamified metric for the user.

Life OS v0.3 must not expose a raw numeric confidence score in the primary interface.

The user-facing vocabulary should remain qualitative.

Potential levels include:

* suggested;
* supported;
* confirmed;
* uncertain;
* contradicted;
* outdated.

The exact interface wording will be frozen in SPEC-002.

12.1 Deterministic confidence

Confidence transitions must be governed by deterministic rules.

The AI may extract or classify evidence.

The AI must not directly assign the final trusted state of a relationship.

12.2 Evidence strength

Evidence strength may depend on:

* explicitness;
* source type;
* source reliability;
* repetition;
* temporal consistency;
* user confirmation;
* contradiction presence;
* evidence independence.

Repeated copies of the same underlying source must not be treated as independent evidence.

12.3 No hidden emotional score

Life OS must not calculate or display hidden scores for:

* closeness;
* love;
* loyalty;
* trustworthiness;
* compatibility;
* relationship quality;
* human importance.

Such interpretations require product decisions beyond v0.3 and may be inappropriate for Life OS entirely.

⸻

13. Contradictions

Contradictions are first-class information.

They are not system failures to be hidden.

Examples:

* a person is described as both current and former collaborator;
* a project is associated with two incompatible organizations;
* a place is described as both current and past residence;
* a relationship is supported by some evidence and rejected by the user.

When a contradiction occurs:

1. the conflicting evidence must be preserved;
2. the relationship must not be silently rewritten;
3. the contradiction must affect visibility and trust;
4. the user may be invited to clarify;
5. the AI may summarize the disagreement;
6. the AI may not resolve it autonomously.

A contradicted relationship may be withheld from the primary graph if displaying it would create a misleading impression.

It must remain accessible from the relevant entity detail or review surface.

⸻

14. Temporal Model

Relationships change over time.

A relationship may include:

* start date;
* end date;
* approximate period;
* first observed date;
* last observed date;
* last confirmed date;
* current or historical status.

Dates may be exact, approximate or unknown.

The system must distinguish:

* unknown date;
* approximate date;
* explicit date.

Absence of recent evidence does not automatically mean a relationship has ended.

14.1 v0.3 temporal scope

The primary graph represents the best current understanding of the user’s life.

Historical relationships may be accessible from entity details.

v0.3 does not include:

* full timeline playback;
* animated graph evolution;
* complex temporal comparison;
* automatic historical storytelling.

The data model must not prevent these capabilities later.

⸻

15. Main User Experience

The Life Graph must not open as an uncontrolled map of every known entity.

The primary experience is a focused graph.

15.1 Focused graph

The graph begins from:

* a selected entity;
* a relevant current context;
* a meaningful entry point surfaced by Life OS.

The interface displays a limited number of meaningful connected entities.

The user may progressively explore outward.

15.2 Progressive disclosure

The graph should reveal complexity in layers.

Initial view:

* focused entity;
* strongest relevant relationships;
* clear labels;
* simple visual hierarchy.

Secondary exploration:

* additional relationships;
* historical links;
* uncertain suggestions;
* evidence and explanations.

15.3 Relationship detail

Selecting a relationship should reveal:

* relationship meaning;
* current state;
* involved entities;
* temporal context;
* evidence summary;
* why Life OS believes the relationship exists;
* confirmation or correction actions when applicable.

15.4 Node detail

Selecting a node should allow the user to:

* understand what the entity represents;
* view its meaningful relationships;
* access its relevant memories;
* review uncertain or contradicted relationships;
* continue exploration from that entity.

15.5 Search and navigation

The user should be able to reach an entity using natural search or existing Life OS navigation.

The Life Graph must not become a separate universe disconnected from the rest of the product.

⸻

16. Mobile Experience

Mobile is the canonical experience.

The interface must prioritize:

* readability;
* touch targets;
* limited visible density;
* stable interactions;
* clear focus;
* one-handed navigation where possible;
* progressive exploration;
* understandable relationship labels.

The product must not rely on:

* precise cursor interaction;
* tiny nodes;
* dense edge crossings;
* permanent overview of hundreds of entities;
* drag-and-drop graph organization;
* complex gestures without alternatives.

The visual graph may be combined with structured cards or lists when these improve comprehension.

A visually impressive graph that is difficult to understand is a product failure.

⸻

17. User Actions

The user may:

* confirm a suggested relationship;
* reject a suggested relationship;
* correct a relationship type;
* correct direction when meaningful;
* correct temporal context;
* mark a relationship as no longer current;
* inspect supporting evidence;
* review contradictions;
* hide a relationship from the primary view;
* archive a relationship when permitted.

The user must not be required to:

* manually create every relationship;
* position nodes;
* classify the whole graph;
* maintain relationship confidence;
* resolve every low-value uncertainty.

17.1 Manual creation

Free-form manual graph construction is excluded from v0.3.

The user may express a relationship through a normal capture or explicit correction flow.

Life OS then processes that input through the canonical memory system.

This preserves the principle that the graph is produced from lived information, not administered like a database.

⸻

18. AI Responsibilities

The AI may:

* identify candidate entity pairs;
* extract explicit relationship statements;
* suggest constrained relationship types;
* identify possible temporal context;
* summarize supporting evidence;
* detect semantic contradictions;
* generate concise explanations;
* propose clarification questions;
* recognize when evidence is insufficient.

The AI must:

* return structured outputs;
* operate within the canonical relationship vocabulary;
* cite source evidence internally;
* express uncertainty;
* avoid unsupported causality;
* avoid emotional interpretation;
* avoid sensitive inference;
* avoid creating entities or relationships outside the documented rules.

The AI must not:

* confirm relationships on behalf of the user;
* merge entities automatically;
* resolve contradictions automatically;
* infer private characteristics from weak signals;
* determine emotional closeness;
* assign moral value to relationships;
* decide which people matter most to the user;
* infer family, romantic, political, religious, medical or sexual relationships without explicit and permitted evidence;
* mutate trusted graph state directly.

⸻

19. Deterministic Responsibilities

The following must remain deterministic and server-controlled:

* ownership;
* RLS enforcement;
* relationship status transitions;
* canonical relationship types;
* evidence references;
* confidence evolution;
* user confirmation;
* correction;
* rejection;
* archival;
* history creation;
* graph visibility rules;
* sensitive category filtering;
* duplicate prevention;
* temporal validity checks;
* audit trail;
* deletion behavior.

No client-side operation may bypass these rules.

⸻

20. Sensitive Relationships

Some relationships may expose highly personal information.

Sensitive categories include, but are not limited to:

* health;
* religion;
* political affiliation;
* sexuality;
* romantic relationships;
* family conflicts;
* legal matters;
* financial dependency;
* addiction;
* trauma;
* private location patterns;
* protected personal characteristics.

Life OS must not infer sensitive relationships from ambiguous evidence.

Sensitive relationships require stronger evidence and stricter visibility rules.

The default behavior should favor non-display when confidence or user intent is unclear.

Sensitive relationship evidence must never be exposed to another user.

RLS must guarantee complete user isolation.

The detailed sensitivity matrix will be defined in SPEC-002 based on existing canonical sensitivity rules.

⸻

21. Relationship Visibility

Not every stored relationship must appear in the primary graph.

Visibility depends on:

* relationship state;
* evidence strength;
* contradiction state;
* sensitivity;
* relevance to the focused entity;
* current versus historical context;
* user visibility preference;
* graph density limits.

21.1 Primary graph

The primary graph may include:

* confirmed relationships;
* sufficiently supported non-sensitive relationships;
* a limited number of clearly identified suggestions when useful.

21.2 Review surfaces

Suggested, contradicted or sensitive relationships may appear in dedicated review surfaces rather than the primary graph.

21.3 Hidden is not deleted

Removing a relationship from the main visualization does not delete its evidence or history.

⸻

22. Integration with Living Memory

Living Memory remains the source of trusted knowledge evolution.

The Life Graph must consume and project knowledge from:

* entities;
* observations;
* memories;
* explicit user decisions;
* evidence history.

The graph must not create an alternative enrichment pipeline.

When a relationship is confirmed or corrected:

1. the action is validated server-side;
2. relationship history is recorded;
3. the canonical graph state is updated;
4. any related memory implications follow documented rules;
5. original evidence remains unchanged.

Graph state must never silently overwrite entity or memory state.

Cross-system effects must be explicitly specified in SPEC-002.

⸻

23. Integration with Briefing

The Briefing may use graph relationships only when they satisfy the required reliability and sensitivity rules.

Suggested or contradicted relationships must not be presented as facts.

The Briefing may say:

“Life OS noticed a possible connection between this project and this person.”

It must not say:

“This person is involved in your project.”

unless the relationship is sufficiently supported or confirmed.

The graph may improve Briefing relevance by providing:

* connected people;
* related projects;
* contextual places;
* recent relationship changes;
* unresolved contradictions worth reviewing.

The Briefing must not expose sensitive relationships without an explicit product rule permitting it.

⸻

24. Explanation Standard

Every displayed relationship must support an explanation.

A useful explanation should answer:

* What is the relationship?
* What evidence supports it?
* When was it observed?
* Is it confirmed, supported or suggested?
* Is there conflicting evidence?
* What action can the user take?

Explanations must be concise in the primary interface.

Detailed evidence may be progressively disclosed.

The system must avoid fabricated narrative coherence.

It should not turn fragmented evidence into a polished story that implies more certainty than exists.

⸻

25. Canonical Scenarios

Scenario 1 — Explicit collaboration

The user captures:

“Sarah is helping me build Life OS.”

Life OS identifies:

* Sarah as a person entity;
* Life OS as a project entity;
* a possible contribution relationship.

The relationship is supported by explicit evidence.

Depending on deterministic rules, it may become supported or require confirmation.

The user can inspect the original evidence.

Scenario 2 — Repeated co-occurrence

Sarah appears in several captures mentioning Life OS, but no capture states her role.

Life OS may suggest a contextual association.

It must not infer that Sarah is:

* a cofounder;
* an employee;
* a collaborator;
* an investor.

Scenario 3 — Past employment

The user states:

“I left Company A in June.”

The existing affiliation relationship is not deleted.

It becomes historical or outdated with an end period.

Scenario 4 — Contradictory role

One capture says:

“Marc is my client.”

Another says:

“Marc is now my business partner.”

Life OS preserves both pieces of evidence.

It does not silently replace one with the other.

It may suggest that the relationship evolved or request clarification.

Scenario 5 — Rejected relationship

Life OS suggests that a person is associated with a project.

The user rejects the relationship.

The same evidence must not recreate the same suggestion later.

Scenario 6 — Sensitive inference

A person and a medical place repeatedly appear together.

Life OS must not infer a health relationship or diagnosis.

Scenario 7 — Mobile exploration

The user opens a project.

The graph shows:

* the project at the center;
* a small number of relevant people, organizations, places or events;
* clear relationship labels.

The user selects one relationship to understand its evidence and status.

⸻

26. Non-Goals for v0.3

Life OS v0.3 will not include:

* Companion conversational experience;
* full social graph;
* relationship quality scores;
* emotional closeness scores;
* psychological interpretation;
* predictive relationship modeling;
* automated conflict resolution;
* automated merge or split;
* public graph sharing;
* collaborative graph editing;
* contact-book synchronization;
* social network imports;
* autonomous recommendations based on inferred relationships;
* free-form visual graph editing;
* manual node positioning as persistent data;
* task dependencies;
* project management;
* CRM workflows;
* graph analytics dashboards;
* centrality or influence scores;
* full timeline playback;
* graph-based notifications without explicit rules;
* generic graph database adoption unless technically justified in SPEC-002.

⸻

27. Product Success Criteria

Life Graph v0.3 is successful when:

1. the user can understand meaningful connections between existing entities;
2. every displayed relationship is explainable;
3. uncertain relationships remain visibly uncertain;
4. contradictions are preserved;
5. relationship history is immutable;
6. the user can confirm, reject or correct relationships;
7. sensitive relationships are handled conservatively;
8. the primary mobile experience remains simple;
9. the graph does not require manual organization;
10. no relationship bypasses user ownership or RLS;
11. the graph improves understanding without becoming a CRM;
12. the Briefing uses graph knowledge only when sufficiently reliable;
13. the system does not silently infer emotional or sensitive meaning;
14. the user can understand why Life OS believes a relationship exists;
15. implementation remains compatible with future temporal and Companion experiences.

⸻

28. Technical Constraints for the Future SPEC

This RFC does not select:

* a visualization library;
* a database extension;
* a graph database;
* a layout algorithm;
* a React component architecture;
* an Edge Function structure;
* exact tables or columns;
* exact confidence thresholds;
* exact AI model;
* exact prompts.

SPEC-002 must derive these decisions from this RFC.

Technical convenience must not alter the product behavior defined here.

The graph must remain built on the canonical Life OS architecture unless a documented technical constraint requires otherwise.

⸻

29. Founder Decisions Required Before SPEC-002

The following decisions must be explicitly validated before implementation:

Decision 1 — Main graph philosophy

Recommended decision:

The main experience is a focused, contextual graph rather than an exhaustive overview of all entities.

Decision 2 — Suggested relationships in primary view

Recommended decision:

A small number of non-sensitive suggested relationships may appear, clearly identified, when they improve understanding.

Alternative:

Suggested relationships only appear in a separate review surface.

Decision 3 — Explicit declarations and confirmation

Recommended decision:

A direct and unambiguous user declaration may create a supported relationship, but confirmation remains distinct unless the declaration explicitly expresses the relationship as a fact.

Decision 4 — Manual relationship creation

Recommended decision:

No free-form manual graph editing.

The user creates or corrects relationships through natural capture and structured correction flows.

Decision 5 — Relationship deletion

Recommended decision:

Relationships are corrected, rejected or archived.

Evidence and history are never physically erased through normal product actions.

Account deletion and legal deletion requirements remain separate.

Decision 6 — Historical relationships

Recommended decision:

Historical relationships remain accessible from entity details but do not clutter the primary current graph.

Decision 7 — Sensitive relationships

Recommended decision:

Sensitive relationship inference is disabled unless based on explicit user-provided evidence and permitted by sensitivity rules.

Decision 8 — Emotional relationships

Recommended decision:

Life OS v0.3 does not infer emotional closeness, sentiment or relationship quality.

Decision 9 — Graph entry points

Recommended decision:

The graph is accessed from an entity and from a dedicated Life Graph surface that begins with a contextual focus rather than a global overview.

Decision 10 — Briefing integration

Recommended decision:

Only supported or confirmed relationships may be stated as facts in Briefing.

Suggestions may only be presented as possibilities.

⸻

30. Final Product Position

The Life Graph is not a map of everything Life OS knows.

It is a careful interface for understanding how meaningful parts of a life connect.

Its value does not come from the number of nodes displayed.

Its value comes from the quality, clarity and trustworthiness of each connection.

Life OS must prefer an incomplete graph that the user can trust over a complete-looking graph built on speculation.

The Life Graph should feel less like a database and more like a quiet explanation of a life progressively becoming understandable.

⸻

31. Approval Gate

RFC-002 must be approved by the founder before SPEC-002 begins.

Any unresolved decision affecting:

* memory;
* relationship meaning;
* confidence;
* sensitive inference;
* contradiction handling;
* user confirmation;
* deletion;
* visibility;
* Briefing behavior;
* AI autonomy;

must stop technical specification and implementation until explicitly decided.

After approval, RFC-002 becomes the canonical product source of truth for Life OS v0.3 — Life Graph.