# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MatchPoint** is an AI-powered corporate-startup matching platform with a chat-first experience. A Discovery agent (Sonnet) conducts a natural conversation to understand the user's business needs, then an Analysis agent (Opus) produces a product document, and a Scout agent (Haiku) finds matching startups — all within a single chat interface, orchestrated by a unified state machine.

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
         ├── Stage 1: Discovery (Sonnet 4.5) — natural conversation, extracts NeedSummary
         │
         ├── Stage 2: Analysis (Opus 4.6) — produces product document from conversation
         │
         └── Stage 3: Scout (Haiku 4.5) — searches startups, returns cards in chat
```

A **StageIndicator** at the top shows the 3 stages with state (pending/active/complete).

All stages are orchestrated by a **unified state machine** (`/src/lib/agents/state-machine.ts`) through a single endpoint (`POST /sessions/[sessionId]/message`). Discovery and Analysis run inline in the same SSE response — no separate endpoint calls needed. The state machine resolves the current stage from DB state and routes messages to the appropriate handler.

### AI Agent Pipeline

Four agents in `/src/lib/agents/`:

| Agent | Model | File | Purpose |
|-------|-------|------|---------|
| Discovery | Sonnet 4.5 | `navigator.ts` | Natural conversation, extracts `NeedSummary` |
| Analysis | Opus 4.6 | `bizdev.ts` | Produces product document from conversation transcript |
| Scout | Haiku 4.5 | `scout.ts` | Searches DB with tools → returns startup cards with `whyRelevant` |
| Advisor | Haiku 4.5 | `advisor.ts` | Post-pipeline Q&A with tool access to startup data |

Model config in `/src/lib/anthropic.ts`. All agents extend `BaseAgent` (`/src/lib/agents/base.ts`) which provides:
- `invoke()` — text-to-text with prompt caching
- `invokeStructured<T>()` — typed JSON via `zodOutputFormat` (native structured decoding)
- `stream()` — AsyncGenerator for real-time SSE
- `runWithTools()` — agentic loop via SDK `toolRunner` (non-streaming)
- `streamWithToolEvents()` — agentic loop via SDK `toolRunner` (streaming, yields `ToolStreamEvent`)
- `streamWithThinking()` — adaptive thinking with streaming

Tools are defined using `betaZodTool()` from `@anthropic-ai/sdk/helpers/beta/zod` — provides type-safe Zod-based input schemas with auto-execution.

### Discovery Flow

The Discovery agent conducts a natural conversation (no rigid phases). When it has enough information, it emits `[DISCOVERY_COMPLETE]` marker (stripped from UI). On completion, the conversation is synthesized into a structured `NeedSummary` (5 fields: companyContext, coreProblem, desiredOutcome, constraints[], preferences[]).

**API flow**: `POST /discovery` → session created → `POST /sessions/[id]/message` (SSE stream) → Discovery conversation → `[DISCOVERY_COMPLETE]` → extract NeedSummary → Analysis runs inline (same SSE) → product document → user confirms → Scout runs → startup cards appear in chat.

All stages flow through the unified `POST /sessions/[sessionId]/message` endpoint.

### State Management

Zustand stores in `/src/stores/`:
- `discovery-store` (persisted: sessionId) — chat state, messages, current stage
- `search-store` — pipeline status tracking
- `settings-store` (persisted) — theme, preferences

### Schemas (`/src/lib/agents/schemas.ts`)

- `NeedSummarySchema` — Discovery output (5 fields)
- `StartupCardSchema` — Card with whyRelevant explanation
- `ScoutResultSchema` — Array of cards + summary

### SSE Streaming

Single unified SSE endpoint: `POST /api/v1/sessions/[sessionId]/message`

The response contains both **unnamed data lines** and **named SSE events**:

- **Unnamed** (`data: {...}`): `text` chunks, `done` markers, `status` messages, `error` messages
- **Named** (`event: X\ndata: {...}`): `analysis_thinking`, `analysis_text`, `analysis_complete` (analysis stage), `stage_update`, `scout_tool_call`, `scout_tool_result`, `pipeline_complete` (scout stage)

Uses `ReadableStream` with proper SSE headers. Frontend consumes via `fetch` + `ReadableStream` reader (not `EventSource`).

### Message Types in Chat

`DiscoveryMessage.type` controls rendering:
- `"text"` (default) — Regular chat bubble
- `"cards"` — Summary text + grid of StartupCard components
- `"stage-update"` — Centered system message (e.g., "Analisando suas necessidades...")

## Key Conventions

### Anthropic SDK — Claude Opus 4.6

- **Adaptive thinking**: Use `thinking: { type: "adaptive" }` (not `type: "enabled"` with `budget_tokens`, which is deprecated on Opus 4.6). Claude decides when to think based on complexity.
- **Effort control**: Use `output_config: { effort: "high" }` for Analysis (complex reasoning), `effort: "medium"` for Discovery/Scout (speed-critical).
- **Structured outputs**: Use `output_config: { format: zodOutputFormat(schema) }` from `@anthropic-ai/sdk/helpers/zod`. Native constrained decoding is more reliable than the old `tool_choice` pattern.
- **Tool definitions**: Use `betaZodTool()` from `@anthropic-ai/sdk/helpers/beta/zod` — provides type-safe Zod schemas with auto-execution via `toolRunner`.
- **Agentic loops**: Use `client.beta.messages.toolRunner()` instead of manual request-response loops. Supports streaming (`stream: true`) and iteration limits (`max_iterations`).
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

1. **Extend `BaseAgent`** — provides `invoke()`, `invokeStructured()`, `stream()`, `runWithTools()`, `streamWithToolEvents()`, and `streamWithThinking()` with automatic model selection and prompt caching
2. **Define tools with `betaZodTool()`** — from `@anthropic-ai/sdk/helpers/beta/zod`, provides type-safe Zod schemas with auto-execution
3. **Prompts go in `/src/lib/agents/prompts/`** — one file per agent, export named constants for each system prompt variant
4. **Schemas go in `/src/lib/agents/schemas.ts`** — all Zod schemas for structured agent outputs, centralized
5. **Analysis is the only Opus agent** — Discovery uses Sonnet, Scout and Advisor use Haiku. Only promote to Opus if the task requires complex reasoning
6. **Discovery is natural conversation** — no rigid phases. The agent emits `[DISCOVERY_COMPLETE]` when it has enough info
7. **NeedSummary drives everything downstream** — Analysis and Scout both receive the NeedSummary. Changes to the schema affect the entire pipeline
8. **Pipeline stages log to `PipelineStageLog`** — every stage records input/output data, token usage, and duration for observability
9. **Startup cards render in chat** — Scout results are sent as `pipeline_complete` event data and rendered as cards inline in the chat
10. **State machine is the single orchestrator** — all stages flow through `handleMessage()` in `state-machine.ts`, dispatched by the unified endpoint

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
| POST | `/sessions/[sessionId]/message` | **Unified endpoint** — routes through state machine (SSE) |
| GET | `/searches/[id]` | Get results as startup cards |
| GET | `/startups` | List with filters + pagination |
| GET | `/startups/[id]` | Startup details |
| POST | `/auth/register` | Create user + set JWT cookie |
| POST | `/auth/login` | Authenticate + set JWT cookie |
| GET/PUT | `/settings` | User preferences (requires auth) |

The unified `/sessions/[sessionId]/message` endpoint handles all stages: discovery chat, analysis (auto-triggered after discovery), scout (triggered by user confirmation), and advisor Q&A. SearchExecution is created automatically by the state machine when discovery completes.

Auth is JWT-based (jose + bcryptjs), stored in httpOnly cookie. MVP uses a default user for unauthenticated requests.
