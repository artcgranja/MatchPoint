# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MatchPoint** is an AI-powered corporate-startup matching platform with a chat-first experience. A Discovery agent (Haiku) conducts a natural conversation to understand the user's business needs, then an Analysis agent (Opus) defines search criteria, and a Scout agent (Haiku) finds matching startups — all within a single chat interface.

**Future roadmap**: An orchestrator agent to develop projects end-to-end when no suitable startup exists or the user prefers a custom build.

## Commands

```bash
pnpm dev              # Start Next.js dev server (Turbopack)
pnpm build            # Production build
pnpm lint             # ESLint (flat config, v9)
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to PostgreSQL
pnpm db:seed          # Seed database with 12 startups
pnpm db:studio        # Open Prisma Studio GUI
```

**Required env vars** (`.env.local`): `DATABASE_URL`, `ANTHROPIC_API_KEY`, `JWT_SECRET` (min 32 chars).

## Tech Stack

Next.js 16 (React Compiler + View Transitions) | TypeScript | Tailwind v4 | shadcn/ui canary | Zustand 5 | motion 12 (Framer Motion 11) | Prisma 7 + PostgreSQL | Anthropic SDK | Zod 4 | pnpm

## Architecture

### Route Groups
- `(marketing)` — Landing pages, no sidebar
- `(dashboard)` — Sidebar + topbar layout. Pages: search (main chat), settings

### Chat-First Flow

Everything lives in a single chat interface (`/search`). The flow has 3 stages:

```
User ↔ Chat Interface (single page)
         │
         ├── Stage 1: Discovery (Haiku) — natural conversation, extracts NeedSummary
         │
         ├── Stage 2: Analysis (Opus 4.6) — analyzes the problem, defines SearchCriteria
         │
         └── Stage 3: Scout (Haiku) — searches startups, returns cards in chat
```

A **StageIndicator** at the top shows the 3 stages with state (pending/active/complete).

### AI Agent Pipeline

Three agents in `/src/lib/agents/`:

| Agent | Model | File | Purpose |
|-------|-------|------|---------|
| Discovery | Haiku 4.5 | `navigator.ts` | Natural conversation, extracts `NeedSummary` |
| Analysis | Opus 4.6 | `analyst.ts` | Analyzes NeedSummary → produces `SearchCriteria` |
| Scout | Haiku 4.5 | `scout.ts` | Searches DB → returns startup cards with `whyRelevant` |

Model config in `/src/lib/anthropic.ts`. All agents extend `BaseAgent` (`/src/lib/agents/base.ts`) which provides:
- `invoke()` — text-to-text with prompt caching
- `invokeStructured<T>()` — typed JSON via Zod schema + tool use
- `stream()` — AsyncGenerator for real-time SSE

### Discovery Flow

The Discovery agent conducts a natural conversation (no rigid phases). When it has enough information, it emits `[DISCOVERY_COMPLETE]` marker (stripped from UI). On completion, the conversation is synthesized into a structured `NeedSummary` (5 fields: companyContext, coreProblem, desiredOutcome, constraints[], preferences[]).

**API flow**: `POST /discovery` → session created → `POST /discovery/[id]/message` (SSE stream) → `[DISCOVERY_COMPLETE]` → extract NeedSummary → `POST /searches` with `discoverySessionId` → pipeline streams via `GET /searches/[id]/stream` → startup cards appear in chat.

### State Management

Zustand stores in `/src/stores/`:
- `discovery-store` (persisted: sessionId) — chat state, messages, current stage
- `search-store` — pipeline status tracking
- `settings-store` (persisted) — theme, preferences

### Schemas (`/src/lib/agents/schemas.ts`)

- `NeedSummarySchema` — Discovery output (5 fields)
- `SearchCriteriaSchema` — Analysis output (industries, technologies, fundingStages, keywords, analysisNarrative)
- `StartupCardSchema` — Card with whyRelevant explanation
- `ScoutResultSchema` — Array of cards + summary

### SSE Streaming

Two SSE endpoints:
1. **Pipeline**: `GET /api/v1/searches/[id]/stream` — yields `stage_update`, `stage_complete`, `pipeline_complete` events (pipeline_complete includes startup cards data)
2. **Discovery**: `POST /api/v1/discovery/[id]/message` — yields `{text: chunk}` and `{done: true}` data lines

Both use `ReadableStream` with proper SSE headers. Frontend consumes via `fetch` + `ReadableStream` reader (not `EventSource`).

### Message Types in Chat

`DiscoveryMessage.type` controls rendering:
- `"text"` (default) — Regular chat bubble
- `"cards"` — Summary text + grid of StartupCard components
- `"stage-update"` — Centered system message (e.g., "Analisando suas necessidades...")

## Key Conventions

### Anthropic SDK — Claude Opus 4.6

- **Adaptive thinking**: Use `thinking: { type: "adaptive" }` (not `type: "enabled"` with `budget_tokens`, which is deprecated on Opus 4.6). Claude decides when to think based on complexity.
- **Effort control**: Use `output_config: { effort: "high" }` for Analysis (complex reasoning), `effort: "medium"` for Discovery/Scout (speed-critical).
- **Structured outputs**: Prefer `output_config: { format: zodOutputFormat(schema) }` from `@anthropic-ai/sdk/helpers/zod` over the `tool_choice + structured_output` pattern. Native constrained decoding is more reliable.
- **Tool schemas**: Use `strict: true` on tool definitions for guaranteed schema-compliant inputs. Cast with `as Anthropic.Messages.Tool.InputSchema`.
- **Prompt caching**: Place `cache_control: { type: "ephemeral" }` on the last item in each group (last tool, last system block). Use `ttl: "1h"` for long-running pipelines. Min cacheable: 4096 tokens (Opus), 1024 tokens (Sonnet/Haiku).
- **Streaming thinking**: When streaming, handle both `thinking_delta` and `text_delta` event types. Include `signature` field unmodified when passing thinking blocks back in multi-turn.

### Zod 4

- Import as `import { z } from "zod"` (not `zod/v4`)
- Use `toJSONSchema()` for converting to JSON Schema (built-in, no external lib)
- Always add `.describe()` to fields — these become tool parameter descriptions for Claude
- Use `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` for structured responses

### Prisma 7

- Config lives in `prisma.config.ts` (not `schema.prisma`) — requires `import "dotenv/config"` for env vars
- Uses `@prisma/adapter-pg` (native PostgreSQL adapter), NOT the default driver
- DON'T set custom `output` in generator — Turbopack can't resolve Prisma runtime deps from non-default locations
- JSON fields: use `JSON.parse(JSON.stringify(obj))` or cast `as never` for type-safe writes

### Next.js 16

- Dynamic route params are Promises: `const { id } = await props.params`
- React Compiler enabled (`reactCompiler: true`) — requires `babel-plugin-react-compiler`
- View Transitions enabled (`experimental: { viewTransition: true }`)
- Server external packages: `@prisma/client`, `@prisma/adapter-pg`

### Tailwind v4

- Custom utilities use `@utility` directive (e.g., `@utility glass`)
- Custom variants use `@custom-variant` (e.g., `@custom-variant dark (&:is(.dark *))`)
- Theme tokens defined inline via `@theme` block in `globals.css`

### Motion (Framer Motion 11)

- Import from `motion/react`, **NOT** `framer-motion`
- Ease arrays need explicit `[number, number, number, number]` type annotation
- Preset variants in `/src/lib/motion.ts`: `fadeIn`, `slideUp`, `scaleIn`, `staggerContainer`

### shadcn/ui (Canary)

- No `--style` flag for `init`, use `-d` for defaults
- Components live in `/src/components/ui/`

## Design System — Astro Intelligence

- **Fonts**: Space Grotesk (headings/body), Fira Code (code/data)
- **Colors**: Highlight `#3b82f6` (blue), Sage `#6B8E6B` (green), dark-first theme
- **Glass morphism**: `.glass` utility (backdrop-blur + border + semi-transparent bg)
- **Radius**: 0.625rem base with sm/md/lg/xl modifiers
- **Dark mode**: Class-based via next-themes, `attribute="class"`, default dark

## Agent Development Guidelines

When creating or modifying agents:

1. **Extend `BaseAgent`** — provides `invoke()`, `invokeStructured()`, and `stream()` with automatic model selection and prompt caching
2. **Prompts go in `/src/lib/agents/prompts/`** — one file per agent, export named constants for each system prompt variant
3. **Schemas go in `/src/lib/agents/schemas.ts`** — all Zod schemas for structured agent outputs, centralized
4. **Analysis is the only Opus agent** — Discovery and Scout use Haiku for speed. Only promote to Opus if the task requires complex reasoning
5. **Discovery is natural conversation** — no rigid phases. The agent emits `[DISCOVERY_COMPLETE]` when it has enough info
6. **NeedSummary drives everything downstream** — Analysis and Scout both receive the NeedSummary. Changes to the schema affect the entire pipeline
7. **Pipeline stages log to `PipelineStageLog`** — every stage records input/output data, token usage, and duration for observability
8. **Startup cards render in chat** — Scout results are sent as `pipeline_complete` event data and rendered as cards inline in the chat

## Database Schema

Core models in `prisma/schema.prisma`:
- `User` → `DiscoverySession` (1:N), `SearchExecution` (1:N)
- `DiscoverySession` → `DiscoveryMessage` (1:N, cascade), `SearchExecution` (1:N)
- `SearchExecution` → `PipelineStageLog` (1:N, cascade), `SearchResult` (1:N, cascade)
- `SearchResult` → `Startup` (N:1), contains `aiAnalysis` JSON (stores `whyRelevant`)
- `Startup` → `TeamMember` (1:N, cascade), `StartupMetrics` (1:1, cascade)

Enums: `PipelineStatus` (idle/running/complete/error), `ScopePhase` (kept for DB compatibility)

## API Routes (`/src/app/api/v1/`)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/discovery` | Create discovery session |
| GET | `/discovery/[id]` | Get session + messages + needSummary |
| POST | `/discovery/[id]/message` | Stream Discovery agent response (SSE) |
| POST | `/searches` | Create search (requires `discoverySessionId`) |
| GET | `/searches/[id]` | Get results as startup cards |
| GET | `/searches/[id]/stream` | Stream pipeline progress (SSE) |
| GET | `/startups` | List with filters + pagination |
| GET | `/startups/[id]` | Startup details |
| POST | `/auth/register` | Create user + set JWT cookie |
| POST | `/auth/login` | Authenticate + set JWT cookie |
| GET/PUT | `/settings` | User preferences (requires auth) |

Auth is JWT-based (jose + bcryptjs), stored in httpOnly cookie. MVP uses a default user for unauthenticated requests.
