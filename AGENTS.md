# Life OS — Engineering Guide

## Purpose

Life OS is an AI-powered personal life companion.

Its mission is to transform fragments of a user's life into a trustworthy, living personal memory.

Every engineering decision must reinforce this mission.

---

## Source of Truth

The `/docs` directory contains the official specification of Life OS.

If implementation and documentation conflict, documentation always wins.

Do not invent features that are not described in the documentation.

---

## Product Principles

- Mobile-first.
- Simplicity before completeness.
- User trust before automation.
- AI suggests. The user decides.
- The user always owns their memory.
- Build only what is necessary for v0.1.

---

## Technical Principles

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI only through Supabase Edge Functions

Never expose API keys.

Never call OpenAI directly from the frontend.

Prefer deterministic logic whenever possible.

---

## Coding Principles

- Keep components small.
- Prefer readability over abstraction.
- Avoid premature optimization.
- Avoid unnecessary dependencies.
- Every feature must remain easy to remove or extend.

---

## Workflow

Implement one PR at a time.

Each PR must:

- compile;
- remain reviewable;
- stay inside scope;
- avoid unrelated changes.

Never start the next PR before the current one is reviewed.

---

## Forbidden

Do not redesign the product.

Do not increase the MVP scope.

Do not create autonomous agents.

Do not introduce hidden automations.

Do not implement features that are not explicitly described inside `/docs`.