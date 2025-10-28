# AGENTS.md

Authoritative guidance for coding agents working in this repository. Based on the open AGENTS.md format.

## Project overview

- Framework: React Router 7 (SSR) on Cloudflare Workers
- Database: Cloudflare D1 (SQLite) with Drizzle ORM
- UI: shadcn/ui + Radix UI, Tailwind
- State model: URL-driven (path + query). All data comes from SSR loaders
- Service layer: `app/services/*` extends `BaseService`, queries via Drizzle only

## Setup commands

- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Build: `pnpm build`
- Preview build: `pnpm preview`
- Typecheck (routes + TS): `pnpm typecheck`
- CF types (Wrangler): `pnpm cf-typegen`
- Deploy (Workers): `pnpm deploy`

## Database & data

- Generate region SQL: `pnpm data:generate-regions`
- Import regions (local D1): `pnpm data:import-regions:local`
- Import regions (remote D1): `pnpm data:import-regions:remote`
- Drizzle migrations (local): `pnpm db:generate && pnpm db:migrate`
- Drizzle migrations (remote): `pnpm db:migrate:remote`

## Routing and data flow

- Allowed routes:
  - `/`, `/:state`, `/:state/:district`
  - `/inserate`, `/:state/inserate`, `/:state/:district/inserate`
- Pattern: Loader → Service → Drizzle → D1. No client-side data libraries
- Access D1 via `context.cloudflare.env.rental_monitor` only

## Code style

- TypeScript strict; exported/public APIs require explicit types; no `any`
- Prefer descriptive names; avoid 1–2 character identifiers
- Use early returns; avoid deep nesting; avoid broad try/catch that swallows errors
- Preserve existing indentation/whitespace; keep edits minimal and localized

## UI patterns

- Prefer shadcn/ui and Radix; respect existing variants/props
- Ensure accessible labels, roles, and keyboard interaction
- Follow `docs/FRONTEND-ARCHITECTURE.md` for sidebar, tabs, drawers

## Docs and diagrams

- Keep `docs/INDEX.md`, routing, and frontend docs synchronized with code
- Prefer Mermaid diagrams for flows; do not embed binary assets in docs

## Security & environments

- Do not introduce new global state managers (Redux, Zustand)
- Do not bypass loaders with `useEffect(...fetch)` for primary data
- Do not modify Cloudflare bindings; secrets/config live in Wrangler env

## PR checklist (agents)

- Routes: params validated in loaders; 404/500 paths handled; cache headers set where needed
- Services: extend `BaseService`; Drizzle queries only; types explicit
- UI: shadcn/Radix patterns; accessibility checks
- Docs: update when APIs/routes change; include code references/paths

## Helpful files

- `app/routes/_app.tsx`, `app/routes/_app._index.tsx`, `app/routes/_app.inserate.tsx`
- `app/services/base.ts`, `app/services/region-service.ts`
- `app/db/schema.ts`, `app/db/client.ts`
- `docs/ROUTING-ARCHITECTURE.md`, `docs/FRONTEND-ARCHITECTURE.md`
