SPEC-002 — Life Graph Implementation

Statut : Draft technique
Version cible : Life OS v0.3
Source produit canonique : RFC-002 — Life Graph, Approved
Dépendance principale : Life OS v0.2 — Living Memory
Audience : Product, Engineering, AI Architecture, Codex
Document suivant : Mission Codex — Life Graph v0.3

⸻

1. Purpose

Cette SPEC traduit RFC-002 en une implémentation technique complète et déterministe.

Elle ne modifie aucun comportement produit.

Elle définit :

* le modèle de données ;
* les règles d’autorisation ;
* le pipeline IA ;
* les transitions d’état ;
* les Edge Functions ;
* les contrats frontend ;
* le chargement du graphe ;
* les limites de performance ;
* les tests ;
* le déploiement ;
* les critères de validation de Life OS v0.3.

L’implémentation doit pouvoir être confiée à un unique Goal Codex sans lui demander de prendre une décision produit.

Toute ambiguïté entre cette SPEC et RFC-002 doit être résolue en faveur de RFC-002.

⸻

2. Source of Truth

L’ordre de priorité est :

AGENTS.md
↓
Documents 001–019
↓
RFC-001 — Living Memory
↓
RFC-002 — Life Graph
↓
SPEC-002 — Life Graph Implementation
↓
Code

RFC-002 reste la source de vérité du comportement produit.

SPEC-002 est la source de vérité de son implémentation technique.

Le code ne doit introduire aucun comportement absent de ces documents.

⸻

3. Architectural Position

Life Graph n’est pas un second système de mémoire.

Il est une projection relationnelle de la connaissance déjà produite par Living Memory.

Le pipeline canonique devient :

Capture
→ Observation
→ Entity
→ Memory
→ Relationship
→ Briefing

Ce diagramme exprime une progression logique, et non une obligation de créer chaque objet pour chaque capture.

Une relation :

* connecte toujours deux entités existantes ;
* appartient toujours au même utilisateur que ses deux entités ;
* conserve ses preuves ;
* possède un état courant ;
* possède un historique immuable ;
* ne modifie jamais silencieusement une entité ou une mémoire ;
* ne devient jamais confirmée par décision du modèle IA.

Les captures, observations et mémoires ne deviennent pas des nœuds du graphe v0.3.

Elles constituent des sources de preuve ou de provenance.

⸻

4. Layer Responsibilities

4.1 Capture layer

Responsabilités :

* recevoir les informations exprimées par l’utilisateur ;
* conserver le contenu source ;
* conserver la date et l’identité de l’utilisateur ;
* déclencher l’analyse canonique existante.

Elle ne crée pas directement de relation fiable.

4.2 Observation layer

Responsabilités :

* conserver les unités d’information extraites ;
* porter leur provenance, leur confiance et leur sensibilité ;
* fournir des preuves analysables au pipeline de relation.

Une observation suggérée ou non validée ne suffit jamais seule à confirmer une relation.

4.3 Entity layer

Responsabilités :

* représenter les nœuds du Life Graph ;
* fournir l’identité canonique, le type, le statut, la confiance et la sensibilité de chaque nœud ;
* empêcher les relations vers des entités appartenant à un autre utilisateur.

Life Graph ne crée aucun type de nœud parallèle.

4.4 Memory layer

Responsabilités :

* fournir des connaissances consolidées pouvant soutenir ou contredire une relation ;
* conserver ses preuves et son historique selon Living Memory ;
* rester indépendante de l’état du graphe.

La confirmation d’une relation ne confirme pas automatiquement une mémoire.

4.5 Relationship layer

Responsabilités :

* représenter les connexions entre entités ;
* appliquer le vocabulaire canonique ;
* associer les preuves ;
* calculer les états de confiance de manière déterministe ;
* préserver les corrections, contradictions, rejets et changements temporels.

4.6 Graph query layer

Responsabilités :

* charger un sous-graphe focalisé ;
* appliquer les règles de visibilité ;
* limiter la densité ;
* calculer un ordre de pertinence ;
* fournir une réponse directement exploitable par le frontend.

Elle ne modifie aucune donnée.

4.7 Briefing layer

Responsabilités :

* utiliser uniquement les relations autorisées ;
* distinguer les faits fiables des possibilités ;
* ne jamais présenter une relation suggérée ou contredite comme un fait ;
* filtrer les relations sensibles conformément à cette SPEC.

4.8 Frontend layer

Responsabilités :

* afficher la projection retournée par le serveur ;
* présenter clairement l’incertitude ;
* permettre la consultation des preuves ;
* envoyer les décisions utilisateur aux opérations serveur autorisées ;
* ne jamais calculer une transition de confiance ou de statut.

⸻

5. Canonical Relationship Vocabulary

La colonne relationship_type utilise les valeurs suivantes :

participates_in
affiliated_with
located_at
temporally_associated_with
concerns
contributes_to
created
contextually_associated_with

5.1 Semantics

participates_in

Une entité prend part à une autre entité.

Directionnelle.

Exemples :

person → project
person → event
organization → event

affiliated_with

Une entité appartient à, travaille avec ou est affiliée à une autre entité.

Directionnelle.

Cette relation ne porte aucune signification émotionnelle.

located_at

Une entité est associée à un lieu.

Directionnelle vers une entité de type place.

temporally_associated_with

Une entité est associée à une période représentée par une entité canonique compatible.

Directionnelle.

concerns

Une entité a pour sujet ou contexte principal une autre entité.

Directionnelle.

Elle ne transforme pas les mémoires en nœuds : une mémoire soutenant ce lien reste une preuve.

contributes_to

Une entité contribue ou apporte un support démontré à une autre entité.

Directionnelle.

Elle exige une preuve plus explicite qu’une simple cooccurrence.

created

Une entité a créé, initié ou causé l’existence d’une autre entité.

Directionnelle.

Elle exige une déclaration explicite ou une preuve forte.

contextually_associated_with

Deux entités apparaissent dans un même contexte significatif sans sémantique plus précise démontrée.

Non directionnelle.

Elle ne doit jamais impliquer automatiquement :

* affection ;
* amitié ;
* conflit ;
* hiérarchie ;
* emploi ;
* propriété ;
* dépendance ;
* importance ;
* causalité.

5.2 Direction rules

La direction est stockée par :

source_entity_id
target_entity_id

Pour contextually_associated_with, la relation est logiquement non directionnelle.

Afin d’empêcher les doublons, les identifiants doivent être normalisés avant insertion :

source_entity_id = min(entity_a_id, entity_b_id)
target_entity_id = max(entity_a_id, entity_b_id)

Pour les autres types, l’ordre sémantique doit être conservé.

Une relation ne peut jamais relier une entité à elle-même.

⸻

6. Relationship Lifecycle

La colonne status utilise :

suggested
supported
confirmed
corrected
rejected
contradicted
outdated
archived

6.1 Suggested

Une relation candidate existe mais ne satisfait pas les règles déterministes de support.

Elle peut apparaître :

* dans la file de revue ;
* dans le détail d’une entité ;
* exceptionnellement dans le graphe principal si elle est non sensible, utile au contexte et explicitement présentée comme suggestion.

6.2 Supported

La relation satisfait les règles déterministes de preuve mais n’a pas été confirmée par l’utilisateur.

Elle peut apparaître dans le graphe principal si elle n’est ni sensible, ni contredite, ni masquée.

6.3 Confirmed

La relation a été explicitement confirmée par une décision utilisateur serveur.

Une déclaration utilisateur directe peut produire un niveau initial élevé de preuve, mais ne doit produire confirmed que si le flux serveur dispose d’un signal explicite et non ambigu indiquant que l’utilisateur affirme cette relation comme un fait.

Aucune sortie IA seule ne peut produire confirmed.

6.4 Corrected

corrected est un état historique.

Lorsqu’une relation est corrigée :

1. la version précédente est inscrite dans relationship_history avec l’action corrected ;
2. la ligne canonique est mise à jour ;
3. son statut canonique devient confirmed ;
4. une nouvelle entrée d’historique enregistre l’état obtenu.

La ligne canonique ne doit pas rester durablement avec status = corrected.

6.5 Rejected

L’utilisateur a déclaré la relation incorrecte.

Elle est exclue :

* du graphe principal ;
* du Briefing ;
* des résultats relationnels normaux.

La même combinaison sémantique ne doit pas être recréée à partir du même ensemble de preuves.

6.6 Contradicted

Une preuve fiable entre en conflit avec la relation actuelle.

Le système :

* conserve la relation ;
* conserve chaque preuve ;
* crée une entrée d’historique ;
* exclut la relation du graphe principal ;
* l’affiche dans une surface de revue ;
* ne choisit pas automatiquement une interprétation.

6.7 Outdated

La relation était vraie dans le passé mais n’est plus considérée comme actuelle.

Elle conserve ses dates, ses preuves et son historique.

Elle est exclue par défaut du graphe courant mais reste accessible depuis les détails des entités.

6.8 Archived

La relation est retirée des surfaces actives sans suppression physique.

Une relation contredite ne peut pas être archivée pour dissimuler une contradiction non résolue.

⸻

7. Confidence Model

7.1 Stored confidence

La relation utilise le vocabulaire existant de Living Memory :

low
medium
high
confirmed

Le score est interne.

Le frontend principal n’affiche jamais une valeur numérique.

7.2 Initial confidence

À l’insertion :

Preuve	Confiance initiale	Statut initial
Cooccurrence non explicite	low	suggested
Relation IA plausible avec preuve indirecte	low	suggested
Déclaration explicite mais non décisive	medium	supported
Déclaration utilisateur directe, claire et factuelle	high	supported
Confirmation utilisateur via action dédiée	confirmed	confirmed

7.3 Deterministic promotion

Une source indépendante correspond :

1. à une capture distincte lorsqu’un capture_id existe ;
2. sinon à une observation distincte ;
3. sinon à une mémoire distincte ;
4. sinon à une décision utilisateur distincte.

Plusieurs copies, observations ou mémoires issues d’une même capture ne constituent qu’une seule source indépendante.

Promotion automatique autorisée :

low → medium

Conditions cumulatives :

* au moins deux sources indépendantes de support ;
* relation non sensible ;
* toutes les sources utilisées sont non sensibles ;
* aucune contradiction non résolue ;
* statut suggested ou supported.

Promotion automatique autorisée :

medium → high

Conditions cumulatives :

* au moins trois sources indépendantes de support ;
* mêmes restrictions que ci-dessus.

Interdictions :

* aucune promotion automatique vers confirmed ;
* aucune baisse automatique de confiance ;
* aucune promotion en présence d’une contradiction ;
* aucune promotion automatique d’une relation sensible ;
* aucune promotion fondée uniquement sur des répétitions d’une même source.

Le statut devient supported lorsque la confiance atteint medium ou high, sauf statut utilisateur plus fort ou état contradictoire.

⸻

8. Sensitivity Policy

La relation utilise :

normal
sensitive
highly_sensitive

8.1 Normal

Relations ordinaires ne révélant pas directement une information protégée ou intime.

8.2 Sensitive

Relations pouvant exposer notamment :

* santé ;
* religion ;
* politique ;
* sexualité ;
* relation romantique ;
* conflit familial ;
* situation juridique ;
* dépendance financière ;
* addiction ;
* traumatisme ;
* localisation privée récurrente ;
* caractéristique personnelle protégée.

8.3 Highly sensitive

Relations contenant explicitement une information intime, médicale, sexuelle, religieuse, politique, juridique ou de sécurité dont une exposition incorrecte pourrait causer un préjudice important.

8.4 Determination

L’IA peut signaler une sensibilité potentielle.

La valeur finale est calculée côté serveur comme le maximum entre :

* la sensibilité suggérée par l’IA ;
* la sensibilité des preuves ;
* la sensibilité des entités ;
* les règles fixes liées au type ou au contenu détecté.

Le client ne peut pas réduire la sensibilité.

8.5 Visibility

Une relation sensible ou hautement sensible :

* n’est jamais automatiquement promue ;
* n’apparaît pas comme suggestion dans le graphe principal ;
* n’est jamais utilisée comme fait dans le Briefing sans règle explicite et état confirmé ;
* reste accessible uniquement dans une surface privée et volontaire de revue ou de détail ;
* ne peut jamais être inférée depuis une cooccurrence ambiguë.

⸻

9. Data Model

Trois nouvelles tables canoniques sont ajoutées :

relationships
relationship_evidence
relationship_history

Aucune base graphe externe n’est introduite en v0.3.

PostgreSQL reste la source de vérité.

⸻

10. Table relationships

10.1 Columns

id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
source_entity_id uuid not null references entities(id) on delete restrict,
target_entity_id uuid not null references entities(id) on delete restrict,
relationship_type text not null,
status text not null default 'suggested',
confidence text not null default 'low',
sensitivity text not null default 'normal',
is_directional boolean not null,
is_visible boolean not null default true,
start_date date null,
end_date date null,
date_precision text not null default 'unknown',
first_observed_at timestamptz null,
last_observed_at timestamptz null,
last_confirmed_at timestamptz null,
explanation text null,
candidate_fingerprint text not null,
evidence_set_hash text null,
created_by text not null,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
archived_at timestamptz null

10.2 Allowed values

relationship_type :

participates_in
affiliated_with
located_at
temporally_associated_with
concerns
contributes_to
created
contextually_associated_with

status :

suggested
supported
confirmed
rejected
contradicted
outdated
archived

confidence :

low
medium
high
confirmed

sensitivity :

normal
sensitive
highly_sensitive

date_precision :

unknown
approximate
exact

created_by :

ai
deterministic
user
migration

10.3 Constraints

check (source_entity_id <> target_entity_id)
check (
  end_date is null
  or start_date is null
  or end_date >= start_date
)
check (
  relationship_type <> 'contextually_associated_with'
  or is_directional = false
)
check (
  relationship_type = 'contextually_associated_with'
  or is_directional = true
)
check (
  status <> 'confirmed'
  or confidence = 'confirmed'
)
check (
  confidence <> 'confirmed'
  or status = 'confirmed'
)
check (
  status <> 'archived'
  or archived_at is not null
)

Une fonction trigger serveur doit vérifier que :

* les deux entités existent ;
* elles appartiennent à user_id ;
* elles ne sont pas supprimées ;
* la normalisation des relations non directionnelles est respectée.

10.4 Fingerprint

candidate_fingerprint est calculé côté serveur.

Pour une relation directionnelle :

sha256(
  user_id
  + source_entity_id
  + target_entity_id
  + relationship_type
  + normalized_start_date
  + normalized_end_date
)

Pour une relation non directionnelle, les identifiants sont triés avant calcul.

Ce fingerprint sert à :

* empêcher les doublons actifs ;
* reconnaître une suggestion précédemment rejetée ;
* appliquer l’idempotence ;
* éviter qu’un retry crée plusieurs relations.

10.5 Unique index

Un seul enregistrement canonique non archivé est permis pour un fingerprint :

create unique index relationships_active_fingerprint_uidx
on relationships (user_id, candidate_fingerprint)
where status <> 'archived';

Une relation rejetée reste canonique et bloque donc sa recréation identique.

Une preuve matériellement différente peut rouvrir la relation existante pour revue, mais ne crée pas un doublon.

⸻

11. Table relationship_evidence

11.1 Purpose

Cette table associe des preuves immuables aux relations.

Elle ne duplique pas le contenu canonique des captures, observations ou mémoires.

11.2 Columns

id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
relationship_id uuid not null references relationships(id) on delete cascade,
evidence_kind text not null,
capture_id uuid null references captures(id) on delete restrict,
observation_id uuid null references observations(id) on delete restrict,
memory_id uuid null references memories(id) on delete restrict,
relation_to_claim text not null,
source_strength text not null,
source_sensitivity text not null,
source_fingerprint text not null,
excerpt text null,
observed_at timestamptz null,
created_at timestamptz not null default now()

11.3 Allowed values

evidence_kind :

capture
observation
memory
user_declaration
user_decision
deterministic

relation_to_claim :

supporting
contradicting
contextual

source_strength :

weak
moderate
strong
explicit

source_sensitivity :

normal
sensitive
highly_sensitive

11.4 Constraints

Une ligne doit référencer au moins une source canonique, sauf :

user_decision
deterministic

Une preuve ne peut référencer plusieurs sources primaires incompatibles.

Le serveur vérifie que :

* chaque source appartient au même utilisateur ;
* la relation appartient au même utilisateur ;
* une observation appartient à la capture indiquée lorsqu’elles sont toutes deux présentes ;
* une source supprimée ou inaccessible ne peut être ajoutée ;
* excerpt ne contient qu’un extrait utile et non une copie complète inutile.

11.5 Idempotence

create unique index relationship_evidence_source_uidx
on relationship_evidence (
  relationship_id,
  source_fingerprint,
  relation_to_claim
);

source_fingerprint identifie la source indépendante canonique.

Pour plusieurs observations provenant d’une même capture, il utilise le capture_id.

⸻

12. Table relationship_history

12.1 Purpose

Cette table conserve un journal immuable de toute évolution significative.

12.2 Columns

id uuid primary key default gen_random_uuid(),
user_id uuid not null references auth.users(id) on delete cascade,
relationship_id uuid not null references relationships(id) on delete cascade,
action text not null,
actor_type text not null,
actor_user_id uuid null references auth.users(id) on delete set null,
before_state jsonb null,
after_state jsonb null,
reason text null,
evidence_ids uuid[] not null default '{}',
created_at timestamptz not null default now()

12.3 Allowed actions

created
evidence_added
promoted
confirmed
corrected
rejected
contradicted
contradiction_cleared
marked_outdated
visibility_changed
archived
restored
temporal_context_changed

actor_type :

user
ai
system
migration
service_role

12.4 Immutability

Les opérations suivantes sont interdites :

UPDATE relationship_history
DELETE relationship_history

Elles sont refusées :

* au client ;
* aux utilisateurs authentifiés ;
* aux Edge Functions ordinaires ;
* aux migrations applicatives après insertion.

Seuls les mécanismes de suppression globale du compte ou les obligations légales peuvent supprimer physiquement cet historique.

⸻

13. Existing Tables

Aucune table existante n’est remplacée.

Les tables suivantes restent canoniques :

captures
observations
entities
memories
briefings
memory_evidence
memory_history

Aucune colonne relationnelle dénormalisée ne doit être ajoutée à entities ou memories pour représenter le graphe.

Les compteurs de relations ne sont pas persistés en v0.3.

Ils sont calculés par requête ou vue serveur.

⸻

14. SQL Indexes

14.1 Relationships

create index relationships_user_source_idx
on relationships (user_id, source_entity_id, status);
create index relationships_user_target_idx
on relationships (user_id, target_entity_id, status);
create index relationships_user_status_idx
on relationships (user_id, status, updated_at desc);
create index relationships_user_visibility_idx
on relationships (user_id, is_visible, status)
where is_visible = true;
create index relationships_temporal_idx
on relationships (user_id, start_date, end_date);
create index relationships_review_idx
on relationships (user_id, updated_at desc)
where status in ('suggested', 'contradicted');
create index relationships_current_graph_idx
on relationships (user_id, updated_at desc)
where status in ('supported', 'confirmed')
  and is_visible = true;

14.2 Evidence

create index relationship_evidence_relationship_idx
on relationship_evidence (relationship_id, created_at);
create index relationship_evidence_capture_idx
on relationship_evidence (user_id, capture_id)
where capture_id is not null;
create index relationship_evidence_observation_idx
on relationship_evidence (user_id, observation_id)
where observation_id is not null;
create index relationship_evidence_memory_idx
on relationship_evidence (user_id, memory_id)
where memory_id is not null;

14.3 History

create index relationship_history_relationship_idx
on relationship_history (relationship_id, created_at desc);
create index relationship_history_user_idx
on relationship_history (user_id, created_at desc);

⸻

15. RLS Policy

RLS est activée sur les trois nouvelles tables.

Aucune policy permissive générique n’est autorisée.

15.1 relationships

SELECT

Un utilisateur authentifié peut lire une relation uniquement si :

auth.uid() = user_id

et si les deux entités appartiennent également à cet utilisateur.

INSERT

Aucun INSERT direct depuis le client authentifié.

Les créations passent uniquement par :

* Edge Function autorisée ;
* fonction SQL sécurisée ;
* migration contrôlée.

UPDATE

Aucun UPDATE direct depuis le client.

Les modifications passent par les RPC dédiées.

DELETE

Aucun DELETE applicatif.

Les suppressions physiques normales sont interdites.

Service role

Le service role peut opérer uniquement dans les Edge Functions documentées.

Chaque opération doit recevoir ou résoudre un utilisateur authentifié et filtrer explicitement par son user_id.

Le service role ne transforme jamais l’absence de filtre utilisateur en accès global implicite.

15.2 relationship_evidence

SELECT

L’utilisateur peut lire les preuves lorsque :

auth.uid() = user_id

et que la relation liée lui appartient.

INSERT

Aucun INSERT client.

Insertion uniquement par le pipeline serveur.

UPDATE

Interdit.

DELETE

Interdit hors suppression globale du compte.

15.3 relationship_history

SELECT

L’utilisateur peut lire son propre historique.

INSERT

Aucun INSERT client.

Insertion uniquement par les fonctions serveur et triggers autorisés.

UPDATE

Toujours interdit.

DELETE

Toujours interdit hors suppression globale légale.

15.4 Edge Functions

Toute Edge Function doit :

1. exiger un JWT valide ;
2. résoudre l’utilisateur depuis le JWT ;
3. ignorer tout user_id fourni dans le body ;
4. vérifier l’appartenance des objets ;
5. valider les entrées avant mutation ;
6. utiliser des requêtes idempotentes ;
7. retourner des erreurs sans détails internes sensibles.

⸻

16. Secure Database Functions

Les décisions utilisateur sont exécutées par des fonctions PostgreSQL security definer avec :

* search_path fixé explicitement ;
* vérification auth.uid();
* validation de propriété ;
* permissions execute limitées à authenticated;
* révocation explicite pour anon et public.

Fonctions requises :

confirm_relationship
reject_relationship
correct_relationship
mark_relationship_outdated
set_relationship_visibility
archive_relationship
restore_relationship
get_focused_graph
get_relationship_detail

16.1 confirm_relationship

Entrée :

p_relationship_id uuid

Règles :

* relation appartenant à l’utilisateur ;
* statut actuel parmi suggested, supported, contradicted ;
* une relation contredite ne peut être confirmée qu’après action volontaire explicite ;
* confiance devient confirmed ;
* statut devient confirmed ;
* last_confirmed_at = now() ;
* ajout d’une preuve user_decision ;
* ajout d’une entrée d’historique.

16.2 reject_relationship

Entrée :

p_relationship_id uuid
p_reason text nullable

Règles :

* relation appartenant à l’utilisateur ;
* statut différent de archived ;
* statut devient rejected ;
* aucune preuve n’est supprimée ;
* le fingerprint reste bloquant ;
* entrée d’historique obligatoire.

16.3 correct_relationship

Entrée structurée :

p_relationship_id uuid
p_relationship_type text
p_source_entity_id uuid
p_target_entity_id uuid
p_start_date date nullable
p_end_date date nullable
p_date_precision text
p_reason text nullable

Règles :

* entités appartenant à l’utilisateur ;
* type canonique ;
* direction valide ;
* dates valides ;
* absence de collision avec une autre relation canonique ;
* état précédent écrit dans l’historique ;
* nouvel état canonique confirmé ;
* preuve user_decision ajoutée ;
* aucune preuve antérieure supprimée.

16.4 mark_relationship_outdated

Entrées :

p_relationship_id uuid
p_end_date date nullable
p_date_precision text

Règles :

* statut devient outdated ;
* end_date est conservée si fournie ;
* l’absence de date est acceptée ;
* historique obligatoire.

16.5 set_relationship_visibility

Entrées :

p_relationship_id uuid
p_is_visible boolean

Cette opération ne modifie ni le statut ni les preuves.

Masquer n’est pas supprimer.

16.6 archive_relationship

Interdit lorsque :

status = contradicted

sauf après résolution explicite.

La fonction :

* définit status = archived ;
* définit archived_at = now() ;
* conserve toutes les données.

16.7 restore_relationship

Restaure le dernier statut non archivé connu depuis l’historique.

La restauration ne peut pas créer de collision de fingerprint.

⸻

17. AI Pipeline

17.1 Principle

L’IA extrait et suggère.

Le serveur valide et décide.

L’IA ne mute jamais directement une relation fiable.

17.2 Canonical orchestration

Le pipeline process-observations reste l’orchestrateur principal de Living Memory.

Son unique analyse structurante peut être étendue pour retourner :

{
  "entities": [],
  "memories": [],
  "relationships": []
}

Cette extension évite un appel IA systématique supplémentaire pour une même capture.

Une relation ne peut être traitée qu’après résolution des entités candidates vers des entités canoniques existantes ou nouvellement créées.

17.3 AI relationship output

Chaque suggestion doit respecter ce contrat conceptuel :

{
  "source_entity_reference": "string",
  "target_entity_reference": "string",
  "relationship_type": "canonical enum",
  "directional": true,
  "explicitness": "implicit | explicit",
  "evidence_observation_ids": ["uuid"],
  "temporal_context": {
    "start_date": "YYYY-MM-DD | null",
    "end_date": "YYYY-MM-DD | null",
    "date_precision": "unknown | approximate | exact"
  },
  "sensitivity": "normal | sensitive | highly_sensitive",
  "explanation": "concise grounded explanation",
  "uncertainty": "concise explanation or null"
}

17.4 AI allowed responsibilities

L’IA peut :

* identifier des paires d’entités candidates ;
* extraire une déclaration relationnelle explicite ;
* proposer un type canonique ;
* proposer une direction sémantique ;
* détecter un contexte temporel ;
* signaler une contradiction potentielle ;
* résumer les preuves ;
* reconnaître que les preuves sont insuffisantes ;
* proposer une question de clarification.

17.5 AI forbidden responsibilities

L’IA ne peut jamais :

* définir status = confirmed ;
* définir confidence = confirmed ;
* créer un type libre ;
* fusionner des entités ;
* résoudre une contradiction ;
* réécrire une relation confirmée ;
* inférer une proximité émotionnelle ;
* mesurer l’importance humaine ;
* inférer une relation familiale, romantique, médicale, politique, religieuse ou sexuelle depuis un signal ambigu ;
* conclure un emploi, une propriété ou une causalité depuis une cooccurrence ;
* écrire directement dans les tables depuis une sortie non validée.

17.6 Validation sequence

Pour chaque relation retournée :

1. validation JSON stricte ;
2. validation du type canonique ;
3. résolution des deux entités ;
4. validation de propriété ;
5. rejet des auto-relations ;
6. normalisation directionnelle ;
7. validation temporelle ;
8. calcul de sensibilité serveur ;
9. construction du fingerprint ;
10. recherche d’une relation existante ;
11. recherche d’un rejet antérieur ;
12. insertion idempotente des preuves ;
13. détection de contradiction ;
14. calcul déterministe de confiance ;
15. écriture de l’historique ;
16. construction de la réponse.

17.7 Rejected candidate handling

Lorsqu’un fingerprint correspond à une relation rejetée :

* la même preuve ne la réactive pas ;
* une nouvelle preuve est enregistrée si elle est matériellement différente ;
* la relation reste rejetée par défaut ;
* elle peut revenir dans la file de revue uniquement si la nouvelle preuve est forte, indépendante et contradictoire avec le rejet ;
* elle ne redevient jamais automatiquement visible dans le graphe principal.

⸻

18. Contradiction Detection

Une contradiction potentielle existe notamment lorsque :

* même paire, même type, temporalité incompatible ;
* même paire, types sémantiquement incompatibles ;
* preuve fiable indiquant qu’une relation actuelle est terminée ;
* déclaration utilisateur opposée à l’état courant ;
* nouvelle direction incompatible pour un type directionnel ;
* relation rejetée soutenue par une preuve matériellement nouvelle.

Le modèle IA peut signaler une contradiction sémantique.

La mutation finale est déterministe.

Lorsqu’une contradiction est validée :

status → contradicted

La confiance existante n’est pas diminuée.

La relation n’est pas supprimée.

Une preuve contradicting et une entrée d’historique sont ajoutées.

⸻

19. Edge Functions

19.1 Existing function: process-observations

Elle est étendue pour :

* recevoir les observations suggérées d’une capture ;
* produire les entités, mémoires et relations candidates dans une sortie structurée unique ;
* conserver le comportement Living Memory existant ;
* persister les relations après résolution des entités ;
* exécuter les règles déterministes ;
* ne jamais confirmer une relation.

Réponse étendue :

{
  "entities": {
    "created": 0,
    "updated": 0,
    "duplicates": 0
  },
  "memories": {
    "created": 0,
    "updated": 0
  },
  "relationships": {
    "created": 0,
    "evidence_added": 0,
    "promoted": 0,
    "contradicted": 0,
    "skipped": 0
  }
}

19.2 New function: rebuild-relationship-candidates

Usage :

* backfill contrôlé des captures déjà traitées ;
* récupération après migration ;
* tests administratifs.

Elle n’est pas exposée comme action utilisateur normale.

Entrée :

{
  "cursor": "string | null",
  "limit": 50,
  "dry_run": true
}

Sécurité :

* service role uniquement ;
* invocation explicitement protégée ;
* limite maximale fixe ;
* idempotence ;
* journalisation des résultats ;
* aucun passage automatique à confirmed.

19.3 New function: generate-briefing

La fonction existante est adaptée pour charger un contexte relationnel filtré.

Elle reçoit uniquement :

* relations supported ou confirmed pour les affirmations factuelles ;
* suggestions explicitement marquées comme possibilités ;
* aucune relation contredite ;
* aucune relation archivée ;
* aucune relation sensible non autorisée.

19.4 No mutation Edge Function for user decisions

Les actions simples de confirmation, correction, rejet, visibilité, obsolescence et archivage utilisent les RPC sécurisées.

Cela évite :

* des fonctions réseau inutiles ;
* des règles dupliquées ;
* des mutations client directes ;
* des divergences entre frontend et serveur.

⸻

20. Error Contract

Les opérations serveur utilisent des codes stables :

AUTH_REQUIRED
FORBIDDEN
NOT_FOUND
INVALID_INPUT
INVALID_RELATIONSHIP_TYPE
INVALID_DIRECTION
INVALID_TEMPORAL_RANGE
ENTITY_OWNERSHIP_MISMATCH
RELATIONSHIP_CONFLICT
RELATIONSHIP_ARCHIVED
UNRESOLVED_CONTRADICTION
DUPLICATE_RELATIONSHIP
REJECTED_CANDIDATE
RATE_LIMITED
AI_OUTPUT_INVALID
AI_UNAVAILABLE
INTERNAL_ERROR

Le frontend affiche un message compréhensible.

Les détails SQL, stack traces, prompts et réponses brutes du modèle ne sont jamais exposés.

Les retries automatiques ne sont permis que pour :

* indisponibilité réseau ;
* erreur temporaire OpenAI ;
* erreur temporaire Supabase ;
* timeout avant confirmation de commit.

Les mutations utilisent des clés idempotentes afin qu’un retry ne crée pas de doublon.

⸻

21. Graph Query Contract

21.1 Focused graph

La fonction get_focused_graph reçoit :

p_focus_entity_id uuid
p_depth integer default 1
p_cursor text nullable
p_limit integer default 12
p_include_suggestions boolean default true
p_include_historical boolean default false

Limites :

depth minimum = 1
depth maximum = 2
limit minimum = 1
limit maximum = 30

Le graphe principal mobile charge initialement une profondeur de 1.

La profondeur 2 est chargée uniquement après exploration explicite.

21.2 Response

{
  "focus_entity": {},
  "nodes": [],
  "edges": [],
  "page_info": {
    "next_cursor": null,
    "has_more": false
  },
  "counts": {
    "visible": 0,
    "suggested": 0,
    "contradicted": 0,
    "historical": 0
  }
}

Chaque edge contient uniquement les informations nécessaires :

{
  "id": "uuid",
  "source_entity_id": "uuid",
  "target_entity_id": "uuid",
  "relationship_type": "contributes_to",
  "status": "supported",
  "display_state": "supported",
  "sensitivity": "normal",
  "is_directional": true,
  "start_date": null,
  "end_date": null,
  "date_precision": "unknown",
  "explanation": "Mentioned explicitly in two independent captures",
  "updated_at": "timestamp"
}

Aucune preuve complète n’est incluse dans la réponse initiale.

21.3 Relationship detail

get_relationship_detail retourne :

* relation canonique ;
* deux entités ;
* résumé des preuves ;
* preuves paginées ;
* historique paginé ;
* contradictions ;
* actions actuellement autorisées.

⸻

22. Graph Visibility Rules

22.1 Primary graph

Inclus par défaut :

* relations confirmées ;
* relations supportées normales ;
* au maximum deux suggestions normales clairement étiquetées par chargement initial ;
* relations visibles ;
* relations non historiques ;
* relations non contredites.

Exclus par défaut :

* rejetées ;
* archivées ;
* contredites ;
* obsolètes ;
* sensibles suggérées ;
* masquées ;
* entités archivées ;
* relations dont une entité n’est plus accessible.

22.2 Review surface

Inclut :

* suggestions ;
* contradictions ;
* relations sensibles nécessitant une décision ;
* nouveaux éléments de preuve sur une relation rejetée ;
* corrections en attente d’action humaine.

22.3 Entity detail

Peut inclure, dans des sections distinctes :

* relations actuelles ;
* relations historiques ;
* suggestions ;
* contradictions ;
* relations masquées.

⸻

23. Relevance Ordering

La pertinence n’est pas une mesure de valeur humaine.

Elle sert uniquement à limiter l’affichage.

L’ordre est déterministe :

1. relation confirmée ;
2. relation supportée ;
3. relation suggérée ;
4. relation mise à jour récemment ;
5. relation disposant de preuves indépendantes plus nombreuses ;
6. relation avec contexte temporel actuel ;
7. ordre stable par id.

Aucun score de centralité, d’influence ou d’importance personnelle n’est calculé.

Aucun classement de personnes n’est produit.

⸻

24. Pagination and Density

24.1 Initial mobile load

Maximum :

1 focus node
8 connected nodes
10 visible edges
2 suggested edges

24.2 Expanded mobile load

Maximum par page :

12 new nodes
20 new edges

24.3 Desktop

Le desktop peut présenter davantage d’espace, mais utilise les mêmes limites de données initiales.

Il ne charge jamais le graphe complet automatiquement.

24.4 Cursor

La pagination utilise un curseur stable construit sur :

status priority
updated_at
id

Aucune pagination par offset sur les grandes listes relationnelles.

⸻

25. Visualization Architecture

La SPEC ne choisit pas une bibliothèque par préférence.

L’implémentation doit sélectionner la solution la plus légère satisfaisant les critères suivants :

* support React et TypeScript ;
* rendu fluide sur mobile ;
* contrôle du layout ;
* accessibilité des nœuds ;
* interactions tactiles stables ;
* possibilité de désactiver les interactions inutiles ;
* taille de bundle acceptable ;
* maintenance active ;
* aucun besoin de serveur externe ;
* aucun verrouillage du modèle de données.

Le composant de visualisation doit être placé derrière un adaptateur interne :

GraphRenderer

Contrat minimal :

type GraphRendererProps = {
  focusNodeId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string;
  selectedEdgeId?: string;
  onNodeSelect: (nodeId: string) => void;
  onEdgeSelect: (edgeId: string) => void;
  onExpandNode: (nodeId: string) => void;
};

Le domaine Life Graph ne doit dépendre d’aucun type propriétaire de bibliothèque.

Le positionnement visuel n’est jamais sauvegardé comme donnée produit.

⸻

26. Mobile Representation

La visualisation mobile utilise deux représentations synchronisées :

1. un graphe focalisé de faible densité ;
2. une liste structurée de relations.

La liste structurée constitue également :

* l’alternative accessible ;
* le fallback en cas de performances insuffisantes ;
* la surface principale pour les labels longs ;
* la navigation compatible lecteur d’écran.

Interactions :

* toucher un nœud sélectionne l’entité ;
* toucher une relation ouvre son détail ;
* « Explorer depuis cette entité » change le focus ;
* aucun drag-and-drop persistant ;
* aucun geste obligatoire sans bouton alternatif ;
* aucun zoom précis nécessaire pour comprendre le contenu.

⸻

27. Frontend Routes

Routes requises :

/graph
/graph/:entityId
/entities/:entityId
/relationships/review

27.1 /graph

Surface dédiée Life Graph.

Elle commence par :

* le dernier focus local valide ;
* sinon une entité pertinente proposée par les données existantes ;
* sinon un état vide avec recherche d’entité.

Elle n’affiche pas une vue globale exhaustive.

27.2 /graph/:entityId

Charge un graphe focalisé sur l’entité.

L’URL permet :

* navigation directe ;
* retour navigateur ;
* partage interne futur ;
* restauration du focus.

27.3 /entities/:entityId

La page existante reçoit une section Life Graph comprenant :

* relations actuelles ;
* accès « Explorer le graphe » ;
* relations historiques ;
* suggestions ou contradictions nécessitant une revue.

27.4 /relationships/review

Surface de validation humaine.

Filtres :

Suggestions
Contradictions
Sensitive
Rejected with new evidence

⸻

28. Frontend Components

Composants requis :

LifeGraphPage
FocusedGraph
GraphRenderer
GraphNodeCard
GraphRelationshipLabel
GraphRelationshipList
GraphFilters
GraphLegend
GraphEmptyState
GraphLoadingState
GraphErrorState
RelationshipDetailSheet
RelationshipEvidenceList
RelationshipHistoryTimeline
RelationshipStatusBadge
RelationshipSensitivityNotice
RelationshipReviewCard
ConfirmRelationshipButton
RejectRelationshipDialog
CorrectRelationshipForm
MarkOutdatedDialog
RelationshipVisibilityButton
ExploreFromEntityButton

Les composants de décision utilisateur ne modifient jamais le cache comme vérité finale avant la réponse serveur.

Une mise à jour optimiste est autorisée uniquement pour is_visible, avec rollback automatique en cas d’erreur.

⸻

29. Frontend Hooks

Hooks requis :

useFocusedGraph
useRelationshipDetail
useRelationshipReviewQueue
useConfirmRelationship
useRejectRelationship
useCorrectRelationship
useMarkRelationshipOutdated
useSetRelationshipVisibility
useArchiveRelationship
useRestoreRelationship

Clés React Query :

["graph", "focused", entityId, filters]
["relationships", "detail", relationshipId]
["relationships", "review", filter, cursor]
["entities", entityId, "relationships"]

Après mutation, invalider précisément :

* détail de la relation ;
* graphe du source ;
* graphe de la cible ;
* file de revue ;
* détail des deux entités ;
* Briefing uniquement si la mutation peut modifier son contexte.

⸻

30. Frontend Services

Fichiers de service attendus :

src/services/relationships.ts
src/services/graph.ts

Responsabilités de relationships.ts :

* RPC de confirmation ;
* rejet ;
* correction ;
* obsolescence ;
* visibilité ;
* archivage ;
* restauration ;
* détail et revue.

Responsabilités de graph.ts :

* chargement du graphe focalisé ;
* validation de la réponse ;
* conversion vers les types frontend ;
* gestion du curseur.

Aucune règle de transition d’état ne doit exister dans ces services.

⸻

31. Frontend States

Chaque surface gère explicitement :

idle
loading
success
empty
error
auth-required
permission-denied
offline
refreshing
mutation-pending

La perte de réseau ne doit jamais faire croire qu’une décision a été enregistrée.

Les actions sensibles restent désactivées durant une mutation.

Les erreurs conservent le contenu déjà chargé lorsque cela est possible.

⸻

32. Relationship Detail UX

La feuille ou page de détail présente dans cet ordre :

1. type de relation lisible ;
2. entités concernées ;
3. état qualitatif ;
4. temporalité ;
5. explication courte ;
6. présence éventuelle de contradiction ;
7. résumé des preuves ;
8. actions utilisateur ;
9. historique détaillé sous divulgation progressive.

Les libellés utilisateur sont :

Suggested
Supported
Confirmed
Needs review
Past
Archived

La confiance brute low, medium, high, confirmed n’est pas affichée dans l’interface principale.

⸻

33. Briefing Integration

Le chargement du contexte de Briefing applique :

Fact statements allowed

status = confirmed

ou :

status = supported
and sensitivity = normal
and no unresolved contradiction
and is_visible = true

Possibility statements allowed

status = suggested
and sensitivity = normal
and explicit wording marks uncertainty

Always excluded

rejected
contradicted
outdated
archived
is_visible = false
sensitive suggestion
highly_sensitive suggestion

Le prompt reçoit un champ explicite :

{
  "relationship_facts": [],
  "relationship_possibilities": []
}

Le modèle ne doit jamais convertir une possibilité en fait.

⸻

34. Cache Strategy

React Query constitue le cache frontend.

Paramètres recommandés :

* graphe focalisé : staleTime court ;
* détail relation : staleTime moyen ;
* historique : cache paginé ;
* file de revue : invalidation après chaque décision ;
* aucune persistance durable des preuves sensibles dans le stockage local.

Le dernier focusEntityId peut être conservé localement.

Les relations, preuves et extraits sensibles ne sont pas persistés dans localStorage.

Aucun cache serveur distribué n’est requis en v0.3.

⸻

35. SQL Performance Strategy

Les requêtes du graphe doivent :

* partir d’une entité focalisée ;
* utiliser les index source et target ;
* appliquer les filtres de statut avant les jointures lourdes ;
* sélectionner uniquement les colonnes nécessaires ;
* charger les preuves séparément ;
* éviter les CTE récursifs non bornés ;
* limiter la profondeur à deux ;
* éviter les requêtes N+1 ;
* agréger les entités des deux côtés dans une seule requête.

Le graphe complet d’un utilisateur ne doit jamais être chargé dans le navigateur.

Aucune extension graph PostgreSQL n’est requise.

Une technologie de graphe distincte ne pourra être envisagée qu’après mesure démontrant que PostgreSQL ne satisfait plus les contraintes réelles.

⸻

36. Operational Limits

Limites applicatives :

30 relations maximum par page serveur
2 niveaux maximum par exploration
100 preuves maximum consultables par relation via pagination
100 entrées d’historique maximum par page
50 captures maximum par batch de backfill

Limites IA :

nombre maximal d’observations par analyse borné
taille des contenus tronquée côté serveur
sortie JSON structurée obligatoire
aucune relance récursive automatique

Une capture trop grande doit être refusée ou traitée selon les limites existantes de Living Memory, sans introduire un nouveau comportement silencieux.

⸻

37. Audit and Observability

Chaque opération serveur journalise :

* nom de l’opération ;
* identifiant de requête ;
* identifiant utilisateur haché ou pseudonymisé ;
* identifiant de relation ;
* résultat ;
* durée ;
* nombre de preuves traitées ;
* code d’erreur ;
* version du prompt pour les opérations IA.

Ne jamais journaliser :

* capture complète ;
* contenu médical ou intime complet ;
* clé API ;
* JWT ;
* réponse brute contenant des données personnelles ;
* preuve sensible complète.

Métriques minimales :

relationship_candidates_generated
relationships_created
relationship_evidence_added
relationships_promoted
relationships_confirmed
relationships_rejected
relationships_contradicted
graph_query_duration
graph_query_node_count
graph_query_edge_count
ai_relationship_validation_failures

⸻

38. Database Types

Les types Supabase générés doivent être régénérés après migration.

Aucun cast large de type :

as any

ne doit être introduit pour contourner les types.

Les enums SQL peuvent être implémentés par contraintes CHECK si cela correspond au modèle actuel du dépôt.

Codex doit préserver la convention déjà utilisée par Living Memory plutôt que mélanger plusieurs styles sans nécessité.

⸻

39. Unit Tests

Tests unitaires requis pour :

* normalisation des relations non directionnelles ;
* génération du fingerprint ;
* validation des types ;
* validation de direction ;
* validation des dates ;
* calcul de source indépendante ;
* promotion low → medium ;
* promotion medium → high ;
* blocage en cas de contradiction ;
* blocage des promotions sensibles ;
* calcul de sensibilité maximale ;
* sélection des relations du Briefing ;
* ordre de pertinence ;
* conversion des réponses serveur en types frontend ;
* affichage qualitatif des statuts.

⸻

40. Database Integration Tests

Tests requis :

* création idempotente d’une relation ;
* blocage d’une auto-relation ;
* blocage d’entités appartenant à deux utilisateurs différents ;
* prévention des doublons non directionnels inversés ;
* ajout idempotent de preuve ;
* préservation du rejet ;
* nouvelle preuve sur relation rejetée ;
* confirmation serveur ;
* correction avec historique avant/après ;
* passage à outdated ;
* archivage ;
* blocage de l’archivage contradictoire ;
* restauration ;
* immutabilité de l’historique ;
* impossibilité de suppression normale.

⸻

41. RLS Tests

Créer deux utilisateurs isolés :

User A
User B

Vérifier que User A ne peut jamais :

* lire les relations de B ;
* lire leurs preuves ;
* lire leur historique ;
* créer une relation avec une entité de B ;
* modifier une relation de B ;
* appeler une RPC sur une relation de B ;
* découvrir l’existence d’un identifiant appartenant à B par une différence de message exploitable.

Les mêmes tests sont exécutés dans les deux directions.

Tester aussi :

* utilisateur anonyme ;
* JWT expiré ;
* service role avec filtre utilisateur ;
* appel direct aux tables ;
* tentative de passage direct à confirmed.

⸻

42. Edge Function Tests

process-observations doit être testé avec :

* relation explicite ;
* cooccurrence simple ;
* causalité non prouvée ;
* type IA hors vocabulaire ;
* entité introuvable ;
* entités dupliquées ;
* sortie JSON invalide ;
* preuve sensible ;
* contradiction ;
* retry identique ;
* erreur OpenAI ;
* timeout ;
* capture déjà traitée.

rebuild-relationship-candidates doit être testé avec :

* dry run ;
* pagination ;
* reprise par curseur ;
* idempotence ;
* limite de batch ;
* interruption partielle ;
* données historiques déjà migrées.

⸻

43. Canonical Scenario Tests

Scenario A — Explicit collaboration

Entrée :

Sarah is helping me build Life OS.

Résultat :

* paire Sarah / Life OS ;
* type contributes_to ;
* preuve explicite ;
* statut au minimum supported ;
* jamais confirmed par IA seule ;
* preuve consultable.

Scenario B — Repeated cooccurrence

Sarah apparaît dans plusieurs captures Life OS sans rôle explicite.

Résultat maximal automatique :

contextually_associated_with

Le système ne doit pas produire :

cofounder
employee
investor
owner

Scenario C — Past employment

Entrée :

I left Company A in June.

Résultat :

* relation existante conservée ;
* statut outdated après règle déterministe ou revue appropriée ;
* période de fin conservée ;
* historique présent.

Scenario D — Role evolution

Entrées :

Marc is my client.
Marc is now my business partner.

Résultat :

* preuves préservées ;
* aucune réécriture silencieuse ;
* contradiction ou évolution temporelle proposée ;
* clarification humaine disponible.

Scenario E — Rejection

L’utilisateur rejette une suggestion.

Résultat :

* statut rejected ;
* même preuve incapable de recréer la suggestion ;
* fingerprint conservé.

Scenario F — Sensitive inference

Une personne et un lieu médical apparaissent ensemble.

Résultat :

* aucune relation médicale ou diagnostic ;
* aucune apparition dans le graphe principal ;
* cooccurrence insuffisante.

Scenario G — Historical contradiction

Une relation confirmée possède une preuve récente indiquant qu’elle est terminée.

Résultat :

* preuve contradictoire conservée ;
* relation contradicted ou proposée comme évolution selon le contenu ;
* aucune résolution autonome ;
* ancienne confirmation préservée dans l’historique.

⸻

44. Frontend Tests

Tests de composants :

* graphe vide ;
* graphe chargé ;
* suggestion clairement distinguée ;
* relation supportée ;
* relation confirmée ;
* contradiction ;
* relation historique ;
* erreur réseau ;
* navigation entre foyers ;
* ouverture du détail ;
* pagination ;
* confirmation ;
* rejet ;
* correction ;
* affichage d’une preuve ;
* accessibilité clavier ;
* accessibilité lecteur d’écran ;
* targets tactiles mobiles ;
* fallback liste sans renderer graphique.

Tests end-to-end :

1. capture d’une relation explicite ;
2. analyse ;
3. apparition en revue ;
4. ouverture des preuves ;
5. confirmation ;
6. apparition dans le graphe ;
7. utilisation autorisée dans le Briefing ;
8. correction ;
9. vérification de l’historique.

⸻

45. Migration Plan

Ordre obligatoire :

Migration 1 — Schema

Créer :

relationships
relationship_evidence
relationship_history

Ajouter les contraintes et index non concurrents nécessaires au démarrage.

Migration 2 — RLS

Activer RLS et créer les policies de lecture.

Aucune policy d’écriture client générique.

Migration 3 — Secure functions

Créer les triggers et RPC sécurisées.

Révoquer les permissions non nécessaires.

Migration 4 — Generated types

Régénérer les types Supabase.

Mettre à jour les types frontend et Edge Functions.

Migration 5 — Pipeline

Déployer l’extension de process-observations.

Migration 6 — Frontend read surfaces

Déployer d’abord :

* lecture du graphe ;
* détails ;
* file de revue.

Migration 7 — User actions

Activer :

* confirmation ;
* rejet ;
* correction ;
* obsolescence ;
* visibilité ;
* archivage.

Migration 8 — Backfill

Exécuter le backfill en dry run.

Vérifier :

* volumes ;
* coûts IA ;
* erreurs ;
* suggestions sensibles ;
* duplications ;
* durée.

Exécuter ensuite par petits lots.

Migration 9 — Briefing integration

Activer l’utilisation des relations uniquement après validation des données produites.

⸻

46. Rollback Strategy

Le rollback doit préserver les données.

Application rollback

Le frontend peut revenir à la version v0.2 sans supprimer les nouvelles tables.

Les routes Life Graph sont désactivées.

Pipeline rollback

L’extraction relationnelle peut être désactivée par configuration serveur.

Les entités et mémoires continuent de fonctionner.

Briefing rollback

Le chargement du contexte relationnel peut être désactivé indépendamment.

Database rollback

Les tables ne doivent pas être supprimées après utilisation réelle.

Un rollback structurel destructif n’est autorisé que :

* avant production ;
* sans donnée utilisateur ;
* après vérification explicite.

Les migrations de rollback en production doivent désactiver les usages, non effacer l’historique.

⸻

47. Validation Before Release

La release est bloquée si l’un des points suivants échoue :

* typecheck ;
* lint ;
* build ;
* tests unitaires ;
* tests d’intégration ;
* tests RLS A/B ;
* tests Edge Functions ;
* tests de migration sur base vide ;
* tests de migration sur snapshot v0.2 ;
* scénario de rollback ;
* vérification mobile ;
* accessibilité essentielle ;
* absence de relation cross-user ;
* absence de confirmation IA ;
* absence d’inférence sensible ambiguë ;
* absence de suppression d’historique ;
* absence de régression Living Memory ;
* absence de relation suggérée présentée comme fait dans Briefing.

⸻

48. Cleanup

Après validation :

* supprimer les flags temporaires inutiles ;
* supprimer les logs de debug ;
* supprimer les fixtures contenant des données personnelles ;
* vérifier les permissions SQL ;
* vérifier les secrets Supabase ;
* vérifier que le service role n’est jamais importé dans le frontend ;
* vérifier que les prompts ne sont pas exposés au client ;
* vérifier l’absence de migrations concurrentes non ordonnées ;
* documenter les limites connues ;
* mettre à jour le README v0.3 ;
* produire un rapport de readiness.

⸻

49. Required Implementation Structure

L’organisation exacte doit respecter le dépôt existant.

Les ajouts attendus sont au minimum :

supabase/
  migrations/
    <timestamp>_life_graph_schema.sql
    <timestamp>_life_graph_rls.sql
    <timestamp>_life_graph_functions.sql
  functions/
    process-observations/
    rebuild-relationship-candidates/
    generate-briefing/
src/
  components/
    graph/
    relationships/
  hooks/
    useFocusedGraph.ts
    useRelationships.ts
  pages/
    LifeGraph.tsx
    RelationshipReview.tsx
  services/
    graph.ts
    relationships.ts
  types/
    graph.ts
    relationships.ts

Codex doit adapter cette structure aux conventions réellement présentes sans créer de couche abstraite inutile.

⸻

50. Codex Execution Boundaries

Codex peut décider :

* organisation interne mineure des fichiers ;
* noms de fonctions privées ;
* extraction de helpers ;
* choix d’une bibliothèque de rendu satisfaisant tous les critères ;
* stratégie exacte de tests dans l’outillage existant ;
* détails non produits des styles visuels.

Codex ne peut pas décider :

* nouveaux types de relation ;
* nouveaux statuts ;
* nouveaux niveaux de sensibilité ;
* nouvelles transitions ;
* nouvelle autonomie IA ;
* nouvelle politique de confirmation ;
* nouveau comportement de suppression ;
* nouveau comportement de Briefing ;
* nouvelle inférence sensible ;
* nouveau modèle de confiance ;
* fusion automatique d’entités ;
* extension des non-goals v0.3.

Toute incompatibilité entre l’existant et cette SPEC doit être signalée et arrêtée avant modification du comportement produit.

⸻

51. Definition of Done

Life Graph v0.3 est terminé lorsque :

1. les relations connectent uniquement des entités canoniques du même utilisateur ;
2. chaque relation affichée possède une explication et des preuves consultables ;
3. les preuves et l’historique sont immuables ;
4. les promotions sont déterministes ;
5. aucune IA ne peut confirmer une relation ;
6. les contradictions sont préservées ;
7. les rejets empêchent la résurgence depuis les mêmes preuves ;
8. les relations historiques restent accessibles ;
9. les relations sensibles sont traitées conservativement ;
10. le graphe principal est focalisé et mobile-first ;
11. l’utilisateur peut confirmer, rejeter, corriger, masquer, rendre obsolète ou archiver selon les règles ;
12. le Briefing respecte les niveaux de fiabilité ;
13. RLS isole complètement les utilisateurs ;
14. le pipeline reste compatible avec Living Memory ;
15. aucune fonction v0.2 ne régresse ;
16. le déploiement et le rollback ont été validés ;
17. les scénarios canoniques passent ;
18. la v0.3 ne contient aucun des non-goals de RFC-002.

⸻

52. Final Engineering Position

Life Graph v0.3 doit être implémenté comme une couche relationnelle prudente au-dessus de Living Memory.

Sa qualité ne dépend pas du nombre de relations découvertes.

Elle dépend de quatre propriétés :

Evidence
Determinism
Explainability
Human control

PostgreSQL demeure la source de vérité.

L’IA demeure une couche d’extraction.

Les transitions fiables demeurent serveur et déterministes.

Le frontend demeure une projection simple, focalisée et mobile-first.

Lorsque l’information est insuffisante, l’implémentation doit préférer :

no relationship

à :

a plausible but misleading relationship

La v0.3 est réussie lorsque le graphe paraît incomplet mais digne de confiance, plutôt que complet mais spéculatif.
