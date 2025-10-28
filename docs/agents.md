# AGENTS.md

Authoritative guidance for AI coding agents working in this repository. Defines scope, workflows, commands, and guardrails that align with Cursor rules in `.cursor/rules/*.mdc`.

---

## Project overview (for agents)

- Stack: React Router 7 (SSR) on Cloudflare Workers + D1 (SQLite) with Drizzle ORM, shadcn/ui + Radix UI.
- State model: URL-driven (path + query). Loaders are the single data entry point.
- Services: All DB access via `app/services/*` extending `BaseService` and `dbClient`.

---

## Operating principles

- Prefer small, composable, deterministic changes.
- Do not bypass SSR loaders; do not introduce client-side data libraries.
- Keep edits minimal; avoid reformatting unrelated code; preserve existing whitespace and indentation.
- Propose changes consistent with `docs/ROUTING-ARCHITECTURE.md` and `docs/FRONTEND-ARCHITECTURE.md`.

---

## Environments and commands

- Dev server: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`
- Type safety: `pnpm typecheck`
- Database (local): `pnpm db:generate && pnpm db:migrate`
- D1 (remote migrations): `pnpm db:migrate:remote`
- Regions seed (local): `pnpm data:import-regions:local`
- Deploy (Workers): `pnpm deploy`

---

## Agent responsibilities

### DocsAgent

- Maintain developer docs in `docs/` and in-repo READMEs.
- Sync architecture docs when routes/services change.
- Outputs: updated docs + concise changelog for PRs.

### SchemaAgent

- Track Drizzle schema and migrations; suggest indexes for hot filters.
- Outputs: migration summaries and safety notes; never auto-apply prod migrations.

### RoutingAgent

- Verify route patterns and loader contracts match docs and code.
- Outputs: route tables and param validations. No behavioral edits.

### UIConsistencyAgent

- Check shadcn/Radix usage, accessibility, and variant consistency.
- Outputs: checklist comments; do not rewrite styles.

---

## Source of truth and boundaries

- Data flow: Loader → Service → Drizzle → D1. Do not add alternative data layers.
- Cloudflare: Access D1 via `context.cloudflare.env.rental_monitor` only.
- No global state managers (Redux/Zustand). No `useEffect(...fetch)` for primary data.

---

## Proposing changes (I/O contract)

- Use minimal diffs; include file paths and line-focused context in PR descriptions.
- Add code references or short fenced snippets when necessary (avoid large dumps).
- Label findings: `info`, `warn`, or `blocker`.

---

## PR review checklist (for agents)

- Routes: URL patterns correct; loaders validate params; 404/500 handled.
- Services: Extend `BaseService`; queries via Drizzle; types explicit.
- UI: shadcn/Radix patterns; accessible labels and roles; variants consistent.
- Docs: Updated when APIs/routes change; Mermaid diagrams preferred.

---

## Security and compliance

- Do not commit secrets. Do not modify Cloudflare bindings.
- Keep exports explicit; avoid `any`. Do not catch and swallow errors.

---

## When not to act

- Scraping/runtime automation is out of scope here.
- Deployment changes beyond docs are out of scope unless requested.

---

## Escalation

- If a change would alter architecture (routing, data flow, or deployment), open an issue with a short proposal instead of editing code.
