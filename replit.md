# CV & Cover Letter Builder

A professional career command center where you manage your profile, upload source materials (past CVs, publications, projects), create job applications, and generate ATS-optimized CVs and cover letters using AI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/cv-builder run dev` — run the frontend (port 22723)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI integration (auto-set)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Replit AI Integrations → OpenAI gpt-5.6-terra (streaming SSE)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/db/src/schema/` — Drizzle table definitions (profile, documents, applications, generatedDocs, conversations, messages)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/cv-builder/src/` — React frontend
- `lib/integrations-openai-ai-server/` — OpenAI server-side SDK wrapper

## Architecture decisions

- CV and cover letter generation use streaming SSE endpoints (`POST /api/applications/:id/generate-cv` and `/generate-cover-letter`). These call OpenAI with the user's profile + all source documents + the job description as context.
- AI prompts are carefully engineered for ATS keyword mirroring and shortlist optimization.
- All generated documents are saved to the DB after streaming completes (with version tracking).
- AI chat assistant at `/chat` maintains full conversation history for context.
- Body limit raised to 10MB in Express to support large CV pastes.

## Product

- **Dashboard** — stats overview, recent applications, pipeline status by stage
- **Profile** — personal info, skills, languages — feeds all AI generation
- **Source Library** — paste past CVs, publications, project descriptions
- **Applications** — create from job description; generate tailored CV + cover letter via AI
- **AI Coach** — free-form chat for CV refinement and career advice

## User preferences

_Populate as you build._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before restarting the server.
- The AI generation endpoints stream SSE — do NOT use the generated React Query hooks for them; use `fetch + ReadableStream` on the client side.
- `DATABASE_URL` must be set; the DB is pre-provisioned by Replit.
