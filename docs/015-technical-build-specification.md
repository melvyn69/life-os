015 — Technical Build Specification

Spécification technique de construction de la v0.1

⸻

1. Objectif

Ce document transforme Life OS en plan de construction technique immédiat.

La v0.1 doit permettre un cycle complet :

capture → inbox → analyse IA → entités → mémoire → briefing

L’objectif n’est pas de construire une plateforme complète.

L’objectif est de construire une première version mobile-first, simple, robuste et extensible.

⸻

2. Stack recommandée

Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide icons
* React Router
* TanStack Query

Backend

* Supabase
    * Auth
    * Postgres
    * Row Level Security
    * Edge Functions
    * Storage plus tard si besoin

IA

* OpenAI API
* Appels IA via Supabase Edge Functions
* Aucun appel direct OpenAI depuis le client

Déploiement

* Vercel pour le frontend
* Supabase pour backend, base, auth, edge functions

⸻

3. Principes techniques

La v0.1 doit respecter cinq principes :

1. Simple avant intelligent
2. Déterministe avant génératif
3. Validation utilisateur avant mémoire durable
4. Mobile-first
5. Architecture extensible sans sur-ingénierie

L’IA ne doit jamais modifier directement la mémoire finale sans validation explicite.

⸻

4. Arborescence projet

src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  pages/
    Home.tsx
    Capture.tsx
    Inbox.tsx
    ObservationDetail.tsx
    Entities.tsx
    EntityDetail.tsx
    Memory.tsx
    Briefing.tsx
    Settings.tsx
  components/
    layout/
      AppShell.tsx
      BottomNav.tsx
      MobileHeader.tsx
    capture/
      CaptureInput.tsx
      CaptureActions.tsx
    inbox/
      InboxItemCard.tsx
      InboxFilters.tsx
    observations/
      ObservationCard.tsx
      ObservationStatusBadge.tsx
      ObservationReviewPanel.tsx
    entities/
      EntityCard.tsx
      EntityTypeBadge.tsx
      EntityRelationList.tsx
    memory/
      MemoryCard.tsx
      MemoryConfidenceBadge.tsx
      MemorySensitivityBadge.tsx
    briefing/
      BriefingCard.tsx
      BriefingSection.tsx
    common/
      EmptyState.tsx
      LoadingState.tsx
      ErrorState.tsx
      ConfirmDialog.tsx
  hooks/
    useCaptures.ts
    useObservations.ts
    useEntities.ts
    useMemories.ts
    useBriefing.ts
    useAuthUser.ts
  services/
    supabaseClient.ts
    captureService.ts
    observationService.ts
    entityService.ts
    memoryService.ts
    briefingService.ts
    aiService.ts
  types/
    capture.ts
    observation.ts
    entity.ts
    memory.ts
    briefing.ts
    ai.ts
    common.ts
  lib/
    date.ts
    confidence.ts
    sensitivity.ts
    validators.ts

⸻

5. Pages v0.1

5.1 Home

Rôle : point d’entrée simple.

Contient :

* bouton capture rapide ;
* résumé inbox ;
* dernier briefing ;
* entités récentes ;
* mémoires récentes.

⸻

5.2 Capture

Rôle : permettre à l’utilisateur de déposer un fragment de vie.

Types supportés en v0.1 :

* texte ;
* note rapide ;
* lien collé manuellement ;
* photo plus tard.

Sortie :

* création d’un capture_item.

⸻

5.3 Inbox

Rôle : afficher les captures non traitées ou en attente de validation.

L’utilisateur peut :

* ouvrir une capture ;
* lancer l’analyse IA ;
* valider ou rejeter une observation ;
* corriger le résultat IA.

⸻

5.4 Observation Detail

Rôle : relire une observation proposée par l’IA.

Actions :

* valider ;
* modifier ;
* rejeter ;
* transformer en entité ;
* transformer en mémoire.

⸻

5.5 Entities

Rôle : afficher les entités vivantes.

Types initiaux :

* person ;
* project ;
* place ;
* habit ;
* passion ;
* event ;
* object ;
* value ;
* company ;
* other.

⸻

5.6 Entity Detail

Rôle : afficher une entité et son contexte.

Contient :

* nom ;
* type ;
* importance ;
* confiance ;
* résumé ;
* observations liées ;
* mémoires liées ;
* relations simples.

⸻

5.7 Memory

Rôle : afficher les mémoires validées.

Filtres :

* récentes ;
* importantes ;
* sensibles ;
* faible confiance.

⸻

5.8 Briefing

Rôle : générer une synthèse utile du moment.

Sections v0.1 :

* ce qui est nouveau ;
* ce qui mérite ton attention ;
* personnes / projets importants ;
* suggestions douces ;
* questions ouvertes.

⸻

5.9 Settings

Rôle : contrôle utilisateur.

Contient :

* profil ;
* gestion mémoire ;
* suppression données ;
* niveau de personnalisation ;
* export plus tard.

⸻

6. Routes

/                     -> Home
/capture              -> Capture
/inbox                -> Inbox
/observations/:id     -> ObservationDetail
/entities             -> Entities
/entities/:id         -> EntityDetail
/memory               -> Memory
/briefing             -> Briefing
/settings             -> Settings

⸻

7. Types TypeScript

CaptureItem

export type CaptureItem = {
  id: string;
  user_id: string;
  content: string;
  source_type: "text" | "link" | "voice" | "image" | "document";
  status: "new" | "processing" | "processed" | "archived" | "rejected";
  created_at: string;
  updated_at: string;
};

Observation

export type Observation = {
  id: string;
  user_id: string;
  capture_id: string | null;
  content: string;
  observation_type: "fact" | "preference" | "event" | "emotion" | "goal" | "relationship" | "other";
  confidence: "low" | "medium" | "high";
  sensitivity: "low" | "medium" | "high";
  status: "proposed" | "validated" | "rejected" | "edited";
  created_at: string;
  updated_at: string;
};

Entity

export type Entity = {
  id: string;
  user_id: string;
  name: string;
  entity_type: "person" | "project" | "place" | "habit" | "passion" | "event" | "object" | "value" | "company" | "other";
  summary: string | null;
  importance: "low" | "medium" | "high";
  confidence: "low" | "medium" | "high";
  status: "active" | "archived" | "hidden";
  created_at: string;
  updated_at: string;
};

Memory

export type Memory = {
  id: string;
  user_id: string;
  entity_id: string | null;
  observation_id: string | null;
  content: string;
  memory_type: "fact" | "preference" | "habit" | "relationship" | "project" | "event" | "insight" | "other";
  confidence: "low" | "medium" | "high";
  sensitivity: "low" | "medium" | "high";
  status: "active" | "archived" | "deleted";
  created_at: string;
  updated_at: string;
};

Briefing

export type Briefing = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  generated_from: string[];
  created_at: string;
};

⸻

8. Tables Supabase

capture_items

create table capture_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  source_type text not null default 'text',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

observations

create table observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  capture_id uuid references capture_items(id) on delete set null,
  content text not null,
  observation_type text not null default 'other',
  confidence text not null default 'low',
  sensitivity text not null default 'low',
  status text not null default 'proposed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

entities

create table entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  entity_type text not null default 'other',
  summary text,
  importance text not null default 'medium',
  confidence text not null default 'low',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

memories

create table memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid references entities(id) on delete set null,
  observation_id uuid references observations(id) on delete set null,
  content text not null,
  memory_type text not null default 'other',
  confidence text not null default 'low',
  sensitivity text not null default 'low',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

briefings

create table briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  generated_from uuid[] default '{}',
  created_at timestamptz not null default now()
);

entity_relations

create table entity_relations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_entity_id uuid not null references entities(id) on delete cascade,
  target_entity_id uuid not null references entities(id) on delete cascade,
  relation_type text not null default 'related_to',
  confidence text not null default 'low',
  created_at timestamptz not null default now()
);

⸻

9. Row Level Security

Toutes les tables doivent activer RLS.

Règle simple :

user_id = auth.uid()

Policies nécessaires :

* select own rows ;
* insert own rows ;
* update own rows ;
* delete own rows.

Aucune donnée utilisateur ne doit être accessible entre comptes.

⸻

10. Services frontend

captureService

Responsabilités :

* créer une capture ;
* lister les captures ;
* modifier le statut ;
* archiver une capture.

observationService

Responsabilités :

* lister les observations ;
* créer une observation ;
* valider ;
* rejeter ;
* modifier.

entityService

Responsabilités :

* lister les entités ;
* créer une entité ;
* modifier une entité ;
* lier une observation à une entité ;
* gérer les relations simples.

memoryService

Responsabilités :

* lister les mémoires ;
* créer une mémoire depuis une observation validée ;
* archiver ;
* supprimer logiquement.

briefingService

Responsabilités :

* récupérer le dernier briefing ;
* déclencher une génération ;
* sauvegarder le briefing généré.

aiService

Responsabilités :

* appeler les Edge Functions ;
* ne jamais appeler OpenAI depuis le client ;
* normaliser les réponses IA.

⸻

11. Hooks

useCaptures

Expose :

* captures ;
* loading ;
* createCapture ;
* updateCaptureStatus.

useObservations

Expose :

* observations ;
* validateObservation ;
* rejectObservation ;
* editObservation.

useEntities

Expose :

* entities ;
* createEntity ;
* updateEntity ;
* getEntityById.

useMemories

Expose :

* memories ;
* createMemory ;
* archiveMemory.

useBriefing

Expose :

* latestBriefing ;
* generateBriefing ;
* loading.

⸻

12. Edge Functions

analyze-capture

Entrée :

{
  captureId: string;
}

Rôle :

* lire la capture ;
* appeler OpenAI ;
* proposer une ou plusieurs observations ;
* sauvegarder les observations en statut proposed.

Sortie :

{
  observations: Observation[];
}

⸻

generate-briefing

Entrée :

{
  userId: string;
}

Rôle :

* récupérer observations validées récentes ;
* récupérer entités actives ;
* récupérer mémoires actives ;
* générer un briefing court ;
* sauvegarder en base.

Sortie :

{
  briefing: Briefing;
}

⸻

13. Prompts IA v0.1

Prompt analyse capture

Objectif : transformer une capture en observations proposées.

Règles :

* ne pas conclure trop vite ;
* ne pas inventer ;
* distinguer fait, préférence, émotion, projet, relation ;
* signaler la sensibilité ;
* attribuer un niveau de confiance ;
* produire un JSON strict.

Format attendu :

{
  "observations": [
    {
      "content": "string",
      "observation_type": "fact | preference | event | emotion | goal | relationship | other",
      "confidence": "low | medium | high",
      "sensitivity": "low | medium | high",
      "reason": "string"
    }
  ]
}

⸻

Prompt briefing

Objectif : produire un briefing utile, court et humain.

Règles :

* ne pas être intrusif ;
* ne pas donner d’ordre ;
* ne pas dramatiser ;
* distinguer faits et suggestions ;
* poser une question utile maximum ;
* rester mobile-first.

Structure :

1. Ce qui est nouveau
2. Ce qui mérite ton attention
3. Personnes ou projets importants
4. Suggestion douce
5. Question ouverte

⸻

14. Ce qui doit être déterministe

Doit être codé sans IA :

* authentification ;
* droits d’accès ;
* création capture ;
* statuts ;
* validation utilisateur ;
* suppression ;
* archivage ;
* filtres ;
* routes ;
* affichage ;
* RLS ;
* sauvegarde base.

⸻

15. Ce qui peut être génératif

Peut utiliser l’IA :

* extraction d’observations ;
* résumé d’entité ;
* proposition de mémoire ;
* briefing ;
* détection de relations faibles ;
* reformulation douce.

Mais l’IA ne décide jamais seule de la mémoire finale.

⸻

16. Exclusions techniques v0.1

Ne pas construire maintenant :

* synchronisation Gmail ;
* synchronisation Calendar ;
* Apple Health ;
* voice recording natif ;
* OCR avancé ;
* upload massif de fichiers ;
* graph visuel complexe ;
* notifications push ;
* agents autonomes ;
* automatisations invisibles ;
* recommandation proactive non validée ;
* app mobile native ;
* vector database ;
* embeddings ;
* recherche sémantique avancée.

Ces éléments pourront venir après validation de la boucle centrale.

⸻

17. Étapes de développement

Phase 1 — Base projet

* installer stack ;
* configurer Supabase ;
* configurer Auth ;
* créer AppShell mobile ;
* créer routing ;
* créer navigation basse.

Phase 2 — Données

* créer migrations Supabase ;
* activer RLS ;
* créer types TypeScript ;
* créer services ;
* créer hooks.

Phase 3 — Capture + Inbox

* page Capture ;
* création capture ;
* page Inbox ;
* affichage captures ;
* statuts.

Phase 4 — Analyse IA

* Edge Function analyze-capture ;
* prompt analyse ;
* sauvegarde observations proposées ;
* UI de validation.

Phase 5 — Entités + Mémoire

* création entité depuis observation ;
* création mémoire depuis observation ;
* pages Entities, EntityDetail, Memory.

Phase 6 — Briefing

* Edge Function generate-briefing ;
* page Briefing ;
* sauvegarde briefing ;
* affichage mobile premium.

Phase 7 — Polish

* empty states ;
* loading states ;
* erreurs ;
* sécurité ;
* responsive mobile ;
* tests essentiels.

⸻

18. Premières PR recommandées

PR 1 — Project foundation

Contenu :

* Vite React TypeScript ;
* Tailwind ;
* shadcn/ui ;
* React Router ;
* Supabase client ;
* AppShell ;
* BottomNav.

PR 2 — Database schema

Contenu :

* migrations ;
* tables ;
* RLS ;
* policies ;
* types générés ou manuels.

PR 3 — Capture and Inbox

Contenu :

* Capture page ;
* Inbox page ;
* captureService ;
* useCaptures ;
* statuts.

PR 4 — AI observation pipeline

Contenu :

* Edge Function analyze-capture ;
* aiService ;
* observationService ;
* ObservationDetail ;
* validation / rejet.

PR 5 — Entities and Memory

Contenu :

* Entities page ;
* EntityDetail ;
* Memory page ;
* création entité ;
* création mémoire.

PR 6 — Briefing

Contenu :

* Edge Function generate-briefing ;
* Briefing page ;
* dernier briefing ;
* génération manuelle.

PR 7 — v0.1 readiness

Contenu :

* polish UX ;
* tests ;
* sécurité ;
* corrections ;
* critères de ready.

⸻

19. Tests essentiels

Tests fonctionnels

* créer une capture ;
* voir la capture dans l’inbox ;
* analyser une capture ;
* générer une observation ;
* valider une observation ;
* créer une entité ;
* créer une mémoire ;
* générer un briefing.

Tests sécurité

* un utilisateur ne voit que ses données ;
* impossible de lire les données d’un autre user ;
* impossible d’insérer une ligne avec un autre user_id.

Tests IA

* l’IA retourne un JSON valide ;
* une capture ambiguë produit une confiance faible ;
* une donnée sensible est marquée sensible ;
* l’IA n’invente pas d’entité absente ;
* l’IA ne sauvegarde pas directement une mémoire active.

Tests UX

* mobile lisible ;
* actions principales accessibles au pouce ;
* aucun écran vide sans explication ;
* erreurs compréhensibles ;
* temps de chargement visibles.

⸻

20. Critères de v0.1 prête

La v0.1 est prête si un utilisateur peut :

1. se connecter ;
2. capturer une information ;
3. retrouver cette capture dans l’inbox ;
4. demander une analyse IA ;
5. valider ou rejeter l’observation ;
6. créer une entité ;
7. créer une mémoire ;
8. générer un briefing ;
9. comprendre ce qui a été mémorisé ;
10. supprimer ou archiver une information.

Le produit est prêt si la boucle complète fonctionne sans magie cachée.

⸻

21. Règle finale pour Codex

Codex doit construire petit.

Pas de système complexe.
Pas d’abstraction prématurée.
Pas d’agent autonome.
Pas de mémoire automatique non validée.
Pas de graph sophistiqué.

La priorité absolue est de rendre la boucle centrale réelle, fiable et agréable sur mobile.

La v0.1 ne doit pas impressionner par sa complexité.

Elle doit donner une sensation simple :

“Je pose un fragment de ma vie. Life OS le comprend doucement. Je garde le contrôle.”