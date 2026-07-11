# Life OS

Life OS is an AI-powered personal life companion designed to transform life fragments into structured, trustworthy, and useful personal memory.

Unlike note-taking apps or productivity tools, Life OS progressively understands the people, projects, places, habits, and memories that matter to its user.

## Documentation

The complete product specification lives in the `/docs` directory.

Documents must be read in numerical order.

They define:

- product vision;
- human model;
- memory model;
- architecture;
- MVP;
- technical specification;
- implementation roadmap.

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI (Edge Functions only)

## Development Philosophy

Life OS is built around one principle:

Capture → Observe → Understand → Remember → Help

Every implementation should reinforce this loop while keeping the user in control.

## Life Graph v0.3

Life Graph is implemented as a bounded relational projection of Living Memory:

Capture → Observation → Entity → Memory → Relationship → Briefing

PostgreSQL remains the canonical store. Relationship evidence and history are immutable through normal application paths, user decisions use secured RPCs, and the frontend loads only focused subgraphs with server-enforced density limits. The graph renderer is an internal React/TypeScript adapter backed by native SVG plus a synchronized accessible list; no separate graph database or rendering dependency is required.

The server supports the non-destructive rollback controls defined by SPEC-002:

- `LIFE_GRAPH_RELATIONSHIP_EXTRACTION_ENABLED=false` keeps Living Memory processing active while omitting relationship extraction and persistence.
- `LIFE_GRAPH_BRIEFING_ENABLED=false` keeps Briefing generation active without loading relationship context.

Neither control deletes relationship data, evidence, or history.

## Validation

Use Node.js 22 or newer, with Docker and the Supabase CLI available locally.

Run the v0.3 validation surfaces against the local Supabase stack:

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run test:db
npm run test:edge
npm run test:migration
npm run test:e2e
```

Edge Functions additionally support type validation with a Supabase-compatible Deno 2 runtime.
