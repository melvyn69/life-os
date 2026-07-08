016 — Implementation Prompts for Codex

Prompts de construction PR par PR pour Life OS v0.1

⸻

1. Objectif du document

Ce document fournit les prompts exacts à donner à Codex pour construire Life OS v0.1 étape par étape.

Chaque PR doit être courte, vérifiable et limitée.

La v0.1 doit permettre le cycle complet :

capture → inbox → analyse IA → observations → entités → mémoire → briefing

⸻

PR 1 — Project foundation

Objectif

Créer la base technique frontend de Life OS v0.1.

Fichiers à créer/modifier

* package.json
* vite.config.ts
* src/main.tsx
* src/App.tsx
* src/index.css
* src/lib/supabase.ts
* src/routes/*
* src/components/layout/*

Contraintes

* React + Vite + TypeScript.
* Tailwind CSS.
* Mobile-first.
* Supabase client côté frontend.
* Aucun appel OpenAI côté client.
* Interface simple, sobre, premium.
* Pas de dashboard complexe.

Critères d’acceptation

* L’app démarre localement.
* Les routes principales existent.
* Le layout mobile fonctionne.
* Supabase est initialisé via variables d’environnement.
* Aucun code IA n’est présent.

Prompt Codex exact

Build the project foundation for Life OS v0.1.
Use React, Vite, TypeScript, Tailwind CSS, React Router, shadcn/ui-ready structure, and Supabase client.
Create a mobile-first app with these routes:
- /
- /capture
- /inbox
- /entities
- /memory
- /briefing
- /settings
Create a simple AppShell with bottom mobile navigation.
Create a Supabase client in src/lib/supabase.ts using VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
Do not add authentication UI yet unless required for Supabase setup.
Do not add AI logic.
Do not add features outside v0.1.
Keep the code simple, typed, and readable.

⸻

PR 2 — Database schema

Objectif

Créer le schéma Supabase minimal pour Life OS v0.1.

Fichiers à créer/modifier

* supabase/migrations/*
* src/types/database.ts

Contraintes

* Tables minimales uniquement.
* Row Level Security activée.
* Toutes les données appartiennent à un utilisateur.
* Pas de modèle trop complexe.
* Pas de graph avancé en v0.1.

Tables

* captures
* observations
* entities
* memories
* briefings

Critères d’acceptation

* Les migrations s’exécutent.
* Les tables existent.
* RLS est activée.
* Les policies protègent les données utilisateur.
* Les types TypeScript existent.

Prompt Codex exact

Create the Supabase database schema for Life OS v0.1.
Add migrations for these tables:
captures:
- id uuid primary key
- user_id uuid not null
- content text not null
- source text default 'manual'
- status text default 'inbox'
- created_at timestamptz default now()
observations:
- id uuid primary key
- user_id uuid not null
- capture_id uuid references captures(id)
- content text not null
- type text
- confidence numeric default 0.5
- sensitivity text default 'normal'
- created_at timestamptz default now()
entities:
- id uuid primary key
- user_id uuid not null
- name text not null
- type text not null
- description text
- importance integer default 1
- confidence numeric default 0.5
- created_at timestamptz default now()
- updated_at timestamptz default now()
memories:
- id uuid primary key
- user_id uuid not null
- entity_id uuid references entities(id)
- content text not null
- confidence numeric default 0.5
- sensitivity text default 'normal'
- status text default 'active'
- created_at timestamptz default now()
briefings:
- id uuid primary key
- user_id uuid not null
- title text not null
- content text not null
- created_at timestamptz default now()
Enable Row Level Security on all tables.
Add policies so users can only select, insert, update, and delete their own rows.
Generate or update TypeScript database types in src/types/database.ts.
Do not add unnecessary tables.
Do not implement advanced graph relationships yet.

⸻

PR 3 — Capture and Inbox

Objectif

Permettre à l’utilisateur de capturer une information et de la retrouver dans l’inbox.

Fichiers à créer/modifier

* src/routes/CapturePage.tsx
* src/routes/InboxPage.tsx
* src/services/captures.ts
* src/hooks/useCaptures.ts

Contraintes

* Capture texte uniquement.
* Interface mobile très simple.
* Pas d’analyse IA dans cette PR.
* Pas de pièces jointes.
* Pas de voix.
* Pas de photo.

Critères d’acceptation

* L’utilisateur peut créer une capture.
* La capture apparaît dans l’inbox.
* L’inbox affiche les captures récentes.
* Les états loading / empty / error existent.

Prompt Codex exact

Implement Capture and Inbox for Life OS v0.1.
Create a Capture page with:
- one textarea
- one primary submit button
- minimal mobile-first layout
On submit, insert a row into captures with:
- content
- source = 'manual'
- status = 'inbox'
Create an Inbox page that lists recent captures ordered by created_at desc.
Create:
- src/services/captures.ts
- src/hooks/useCaptures.ts
Handle loading, empty, and error states.
Do not add AI analysis yet.
Do not add files, voice, images, tags, filters, or search.
Keep the UX extremely simple.

⸻

PR 4 — AI observation pipeline

Objectif

Transformer une capture en observations via une Supabase Edge Function utilisant OpenAI.

Fichiers à créer/modifier

* supabase/functions/analyze-capture/index.ts
* src/services/ai.ts
* src/components/inbox/AnalyzeCaptureButton.tsx
* src/routes/InboxPage.tsx

Contraintes

* OpenAI uniquement dans Edge Function.
* Aucun secret OpenAI côté client.
* Prompt IA court et déterministe.
* Sortie JSON stricte.
* Observations prudentes.
* Ne jamais inventer.

Critères d’acceptation

* Une capture peut être analysée.
* L’Edge Function appelle OpenAI.
* Les observations sont créées en base.
* La capture passe à status = analyzed.
* En cas d’erreur, rien n’est cassé côté UI.

Prompt Codex exact

Implement the AI observation pipeline for Life OS v0.1.
Create a Supabase Edge Function:
supabase/functions/analyze-capture/index.ts
The function receives:
- capture_id
It must:
1. Load the capture from Supabase.
2. Call OpenAI using OPENAI_API_KEY server-side only.
3. Ask the model to extract cautious observations from the capture.
4. Return strict JSON.
5. Insert observations into the observations table.
6. Update captures.status to 'analyzed'.
Use this AI instruction:
"You are the observation layer of a personal life companion.
Extract only factual or strongly implied observations from the user's capture.
Do not invent.
Do not diagnose.
Do not make sensitive assumptions.
Return JSON only with this shape:
{
  observations: [
    {
      content: string,
      type: string,
      confidence: number,
      sensitivity: 'normal' | 'sensitive'
    }
  ]
}"
Create frontend service src/services/ai.ts to call the Edge Function.
Add an Analyze button in the Inbox for each capture.
Do not expose OpenAI keys in the frontend.
Do not create entities or memories in this PR.
Do not add background jobs.
Do not add streaming.

⸻

PR 5 — Entities and Memory

Objectif

Créer les premières entités et mémoires à partir des observations.

Fichiers à créer/modifier

* supabase/functions/process-observations/index.ts
* src/routes/EntitiesPage.tsx
* src/routes/MemoryPage.tsx
* src/services/entities.ts
* src/services/memories.ts
* src/hooks/useEntities.ts
* src/hooks/useMemories.ts

Contraintes

* Création simple.
* Pas de déduplication avancée.
* Pas de Life Graph visuel.
* Pas de relations complexes.
* La mémoire doit rester lisible et corrigeable plus tard.

Critères d’acceptation

* Des observations peuvent générer des entités.
* Des mémoires peuvent être créées.
* Les pages Entities et Memory affichent les données.
* Le système reste prudent sur la confiance.

Prompt Codex exact

Implement Entities and Memory for Life OS v0.1.
Create a Supabase Edge Function:
supabase/functions/process-observations/index.ts
The function receives:
- capture_id
It must:
1. Load observations linked to the capture.
2. Use OpenAI server-side only.
3. Suggest simple entities and memories.
4. Insert entities when useful.
5. Insert memories linked to entities when possible.
Use this AI instruction:
"You are the memory structuring layer of a personal life companion.
From the observations, identify only clear entities and useful memories.
An entity can be a person, project, place, habit, interest, object, event, or value.
Do not create entities from weak assumptions.
Do not create sensitive memories unless explicitly stated.
Return JSON only:
{
  entities: [
    {
      name: string,
      type: string,
      description: string,
      importance: number,
      confidence: number
    }
  ],
  memories: [
    {
      entity_name: string,
      content: string,
      confidence: number,
      sensitivity: 'normal' | 'sensitive'
    }
  ]
}"
Create:
- Entities page listing entities
- Memory page listing memories
- services and hooks for entities and memories
Do not build advanced deduplication.
Do not build graph visualization.
Do not add editing yet unless extremely simple.
Do not add features outside v0.1.

⸻

PR 6 — Briefing

Objectif

Générer un briefing simple à partir des captures, observations, entités et mémoires récentes.

Fichiers à créer/modifier

* supabase/functions/generate-briefing/index.ts
* src/routes/BriefingPage.tsx
* src/services/briefings.ts
* src/hooks/useBriefings.ts

Contraintes

* Briefing manuel, pas automatique.
* Pas de notification.
* Pas de calendrier.
* Pas d’intégrations externes.
* Ton simple, utile, non intrusif.

Critères d’acceptation

* L’utilisateur peut générer un briefing.
* Le briefing est sauvegardé.
* La page briefing affiche le dernier briefing.
* Le contenu reste court et actionnable.

Prompt Codex exact

Implement Briefing for Life OS v0.1.
Create a Supabase Edge Function:
supabase/functions/generate-briefing/index.ts
The function must:
1. Load recent captures, observations, entities, and memories for the current user.
2. Call OpenAI server-side only.
3. Generate a short personal briefing.
4. Save it in the briefings table.
5. Return the briefing.
Use this AI instruction:
"You are the briefing layer of a personal life companion.
Create a short, calm, useful briefing from the user's recent life data.
Do not be motivational in an exaggerated way.
Do not invent facts.
Do not make medical, legal, or financial decisions.
Keep it concise.
Return JSON only:
{
  title: string,
  content: string
}"
Create a Briefing page with:
- latest briefing
- button to generate a new briefing
- loading, empty, and error states
Do not add scheduled briefings.
Do not add push notifications.
Do not add calendar or email integrations.
Do not add anything outside v0.1.

⸻

PR 7 — v0.1 readiness

Objectif

Stabiliser la v0.1 pour qu’elle soit utilisable de bout en bout.

Fichiers à créer/modifier

* README.md
* .env.example
* src/**/*.tsx
* src/**/*.ts
* supabase/functions/*
* supabase/migrations/*

Contraintes

* Pas de nouvelle fonctionnalité.
* Nettoyage uniquement.
* Vérification du flux complet.
* UX mobile cohérente.
* Erreurs gérées proprement.

Critères d’acceptation

* Le flux complet fonctionne :
    capture → inbox → analyse → observations → entités → mémoire → briefing
* Aucun appel OpenAI côté client.
* Les erreurs principales sont gérées.
* Le README explique comment lancer le projet.
* Les variables d’environnement sont documentées.
* Le scope v0.1 est respecté.

Prompt Codex exact

Prepare Life OS v0.1 for readiness.
Do not add new features.
Review and stabilize the full flow:
capture → inbox → analyze capture → observations → process observations → entities → memories → briefing
Tasks:
1. Fix TypeScript errors.
2. Improve loading, empty, and error states.
3. Ensure all OpenAI calls happen only in Supabase Edge Functions.
4. Ensure Supabase client uses environment variables.
5. Ensure database access respects user_id and RLS.
6. Clean unused code.
7. Add .env.example.
8. Add README.md with local setup instructions.
9. Verify mobile-first layouts.
10. Add minimal smoke tests or manual test checklist.
Do not add authentication screens unless absolutely necessary.
Do not add integrations.
Do not add search.
Do not add notifications.
Do not add advanced graph features.
Do not add settings beyond basic placeholders.
The final result must be a simple, working Life OS v0.1 MVP.

⸻

2. Règles globales pour Codex

Ces règles s’appliquent à toutes les PR.

Global rules for Life OS v0.1:
- Stay strictly inside v0.1 scope.
- Build mobile-first.
- Use React, Vite, TypeScript, Tailwind, and Supabase.
- Use OpenAI only through Supabase Edge Functions.
- Never expose API keys in the frontend.
- Prefer simple readable code over abstractions.
- Do not create premature architecture.
- Do not add features that were not requested.
- Do not build a dashboard.
- Do not build social features.
- Do not build integrations.
- Do not build advanced automation.
- Do not over-design the UI.
- Every PR must be small, reviewable, and working.

⸻

3. Définition finale de v0.1 prête

Life OS v0.1 est prête lorsque :

* une information peut être capturée ;
* elle apparaît dans l’inbox ;
* elle peut être analysée par IA ;
* des observations sont créées ;
* des entités simples sont créées ;
* des mémoires simples sont créées ;
* un briefing peut être généré ;
* l’expérience fonctionne sur mobile ;
* le code reste simple ;
* aucune fonctionnalité hors scope n’a été ajoutée.

La v0.1 ne doit pas impressionner par sa quantité de fonctionnalités.

Elle doit prouver une seule chose :

une IA personnelle peut commencer à transformer des fragments de vie en mémoire utile.