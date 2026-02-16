<div align="center">

# MatchPoint

**AI-powered corporate-startup matching platform**

Discover the right Y Combinator startups for your business needs through a conversational AI pipeline — all within a single chat interface.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Anthropic](https://img.shields.io/badge/Claude-Opus%204.6-orange)](https://www.anthropic.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## Overview

MatchPoint is a **chat-first** platform that uses a multi-agent AI pipeline to match enterprises with Y Combinator startups. Instead of browsing catalogs or filling out forms, users have a natural conversation with an AI agent that understands their needs, analyzes requirements, and finds the best startup matches — complete with AI-generated explanations of why each startup is relevant.

### How It Works

```
User <-> Chat Interface (single page)
         |
         |-- Stage 1: Discovery (Sonnet 4.5) -- understands your needs via conversation
         |
         |-- Stage 2: Analysis (Opus 4.6) -- produces a detailed product document
         |
         +-- Stage 3: Scout (Haiku 4.5) -- searches 5,600+ YC startups, returns ranked matches
```

All three stages run through a **unified state machine** and a single SSE endpoint — no page reloads, no separate steps.

## Key Features

- **Conversational Discovery** — AI conducts a natural interview to deeply understand business requirements, extracting a structured needs summary
- **Multi-Agent Pipeline** — Three specialized Claude models (Sonnet, Opus, Haiku) each optimized for their task: speed, reasoning depth, or lightweight search
- **Real-Time Streaming** — Server-Sent Events stream agent thinking, tool calls, and results to the chat interface as they happen
- **Startup Matching with Explanations** — Scout searches the YC database and generates per-card `whyRelevant` justifications connecting each startup to user needs
- **Post-Pipeline Advisor** — After results, users can ask follow-up questions with full pipeline context
- **Builder Workspace** — AI-powered full-stack development environment with E2B sandboxes for building custom solutions
- **GitHub OAuth & Magic Link Auth** — Multiple authentication methods with JWT-based sessions
- **Seeker-Builder Connections** — Connect with startup founders via in-app messaging and email outreach
- **Product Demand Tracking** — Automatic extraction of product concepts from searches to surface market trends
- **Internationalization** — English and Portuguese (BR) with auto-language detection in AI responses

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (React 19, React Compiler, View Transitions) |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) |
| **AI** | [Anthropic SDK](https://docs.anthropic.com/) (Claude Opus 4.6, Sonnet 4.5, Haiku 4.5) |
| **Database** | [Prisma 7](https://www.prisma.io/) + PostgreSQL |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (canary) |
| **State** | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| **Animation** | [Motion 12](https://motion.dev/) (Framer Motion 11) |
| **Validation** | [Zod 4](https://zod.dev/) |
| **Auth** | JWT ([jose](https://github.com/panva/jose)) + GitHub OAuth + Magic Links ([Resend](https://resend.com/)) |
| **Sandbox** | [E2B](https://e2b.dev/) (code execution for Builder) |
| **i18n** | [next-intl](https://next-intl.dev/) |
| **Package Manager** | [pnpm](https://pnpm.io/) |

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9
- **PostgreSQL** >= 15
- **Anthropic API key** ([get one here](https://console.anthropic.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/matchpoint.git
cd matchpoint

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate
```

### Environment Setup

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env.local
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key |
| `JWT_SECRET` | Min 32 characters for JWT signing |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g., `http://localhost:3000`) |

**Optional variables:**

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth credentials |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Email service for magic links |
| `E2B_API_KEY` | E2B sandbox for Builder workspace |

### Database Setup

```bash
# Push schema to PostgreSQL
pnpm db:push

# (Optional) Sync YC company data
pnpm db:sync-yc

# (Optional) Open Prisma Studio
pnpm db:studio
```

### Run

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                              # Next.js App Router
│   ├── [locale]/                     # i18n routing (en, pt-BR)
│   │   ├── (app)/                    # Dashboard layout (sidebar + topbar)
│   │   │   ├── page.tsx              # Main chat — Discovery pipeline
│   │   │   ├── builder/              # AI-powered project workspace
│   │   │   ├── descubra/             # Browse startups
│   │   │   ├── settings/             # User preferences
│   │   │   └── ...                   # Other app pages
│   │   └── (auth)/                   # Auth layout (login)
│   └── api/v1/                       # REST API + SSE endpoints
│       ├── sessions/[sessionId]/     # Unified pipeline endpoint (SSE)
│       ├── discovery/                # Session management
│       ├── auth/                     # JWT, OAuth, Magic Link
│       ├── builder/                  # Builder project CRUD
│       ├── startups/                 # YC company data
│       └── ...                       # Other API routes
├── components/                       # React components
│   ├── discovery/                    # Chat UI (messages, input, wizard)
│   ├── agent-panel/                  # Analysis + Scout visualization
│   ├── builder/                      # Builder workspace
│   ├── layout/                       # Sidebar, navbar, shell
│   ├── shared/                       # Reusable components
│   └── ui/                           # shadcn/ui primitives
├── lib/
│   ├── agents/                       # AI agent pipeline
│   │   ├── base.ts                   # BaseAgent (invoke, stream, tools)
│   │   ├── navigator.ts             # Discovery agent (Sonnet)
│   │   ├── bizdev.ts                # Analysis agent (Opus)
│   │   ├── scout.ts                 # Scout agent (Haiku)
│   │   ├── advisor.ts               # Advisor agent (Haiku)
│   │   ├── state-machine.ts         # Unified pipeline orchestrator
│   │   ├── schemas.ts               # Zod schemas (NeedSummary, ScoutResult)
│   │   ├── prompts/                  # System prompts per agent
│   │   └── skills/                   # Tool modules (Skills architecture)
│   │       ├── registry.ts           # Tool composition & routing
│   │       ├── discovery-control/    # complete_discovery tool
│   │       ├── startup-data/         # search_companies, get_company_details
│   │       └── builder-sandbox/      # E2B sandbox tools
│   ├── anthropic.ts                  # Client config + model routing
│   ├── db.ts                         # Prisma client setup
│   ├── auth.ts                       # JWT + auth utilities
│   └── sse/                          # SSE event types + parser
├── stores/                           # Zustand state management
├── hooks/                            # Custom React hooks
├── types/                            # TypeScript definitions
└── i18n/                             # Internationalization config
```

## Architecture

### AI Agent Pipeline

MatchPoint uses four specialized Claude agents, each chosen for the optimal balance of speed, cost, and capability:

| Agent | Model | Purpose | Method |
|-------|-------|---------|--------|
| **Discovery** | Sonnet 4.5 | Natural conversation to understand needs | `streamWithToolEvents()` |
| **Analysis** | Opus 4.6 | Product document from conversation transcript | `streamWithThinking()` |
| **Scout** | Haiku 4.5 | Search YC database, return ranked matches | `streamWithToolEvents()` |
| **Advisor** | Haiku 4.5 | Post-pipeline Q&A with tool access | `streamWithToolEvents()` |

All agents extend `BaseAgent`, which provides:
- **Prompt caching** with configurable TTL for cost optimization
- **Structured outputs** via native `zodOutputFormat` (not the legacy tool_choice pattern)
- **Agentic tool loops** via the Anthropic SDK's `toolRunner`
- **Adaptive thinking** (Opus) — Claude decides when to reason deeply

### Skills Architecture

Agent tools are organized as **skills** — self-contained modules that bundle tool definitions, usage instructions, and database queries:

```
skills/
├── registry.ts              # composeToolsForAgent(), composeInstructionsForAgent()
├── discovery-control/       # complete_discovery — signals end of discovery
├── startup-data/            # search_companies, get_company_details
└── builder-sandbox/         # E2B sandbox operations
```

Each skill exports a `SkillModule` with metadata that the registry uses to auto-route tools and instructions to the correct agents.

### State Machine

The unified state machine (`state-machine.ts`) orchestrates the entire pipeline through a single SSE endpoint:

```
discovery --> analysis --> awaiting_confirmation --> scouting --> complete
```

State is resolved **deterministically from the database** — no LLM calls needed for routing. The state machine handles:
- Stage transitions and error recovery
- NeedSummary extraction after discovery completion
- Automatic analysis trigger after discovery
- Scout execution on user confirmation
- Advisor routing for post-pipeline questions

### SSE Streaming

A single endpoint (`POST /api/v1/sessions/[sessionId]/message`) streams all pipeline events:

```typescript
type SsePayload =
  | { type: "text"; agent: string; text: string }
  | { type: "thinking"; agent: string; text: string }
  | { type: "tool_call"; agent: string; toolName: string; input: object }
  | { type: "tool_result"; agent: string; toolName: string; resultSummary: string }
  | { type: "stage_update"; agent: string; progress: number; message: string }
  | { type: "pipeline_complete"; agent: string; data: object }
  | { type: "done"; agent: string; transition?: string }
  | { type: "error"; agent: string; message: string }
```

The frontend consumes via `fetch` + `ReadableStream` (not `EventSource`), enabling POST requests with request bodies.

## Database Schema

Core models managed by Prisma 7:

```
User ──────────┬── DiscoverySession ──── DiscoveryMessage[]
               │         │
               ├── SearchExecution ────┬── PipelineStageLog[]
               │                      ├── SearchResult[] ── Company
               │                      └── OrchestratorMessage[]
               │
               ├── Connection[] ── Company
               ├── SavedStartup[] ── Company
               ├── BuilderProject ──── BuilderMessage[]
               └── Notification[]

Company (YC startups: 5,600+)
  ├── name, slug, oneLiner, longDescription
  ├── industries[], tags[], regions[], batch
  └── teamSize, stage, status, isHiring

ProductConcept ── ProductConceptExtraction[]
```

## API Reference

### Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/discovery` | Create a new discovery session |
| `GET` | `/api/v1/discovery/:id` | Get session with messages and NeedSummary |
| `POST` | `/api/v1/sessions/:id/message` | **Unified pipeline endpoint** (SSE stream) |
| `GET` | `/api/v1/searches/:id` | Get search results as startup cards |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Email/password authentication |
| `POST` | `/api/v1/auth/logout` | Clear session |
| `GET` | `/api/v1/auth/me` | Current user info |
| `GET` | `/api/v1/auth/github` | GitHub OAuth flow |
| `POST` | `/api/v1/auth/magic-link` | Send magic link email |

### Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/startups` | List YC companies (filters + pagination) |
| `GET` | `/api/v1/startups/:id` | Company details |
| `GET/POST` | `/api/v1/saved-startups` | Manage saved startups |
| `GET/POST` | `/api/v1/connections` | Seeker-builder connections |
| `GET/PUT` | `/api/v1/settings` | User preferences |

## Scripts

```bash
pnpm dev              # Start dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm test             # Run tests (Vitest)
pnpm test:watch       # Run tests in watch mode
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to PostgreSQL
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:sync-yc       # Sync YC company data from API
```

## Design System

MatchPoint uses the **Astro Intelligence** design system:

- **Fonts** — Space Grotesk (headings/body) + Fira Code (code/data)
- **Colors** — Blue highlight (`#3b82f6`), Sage green (`#6B8E6B`), dark-first theme
- **Glass morphism** — Backdrop-blur cards with semi-transparent backgrounds
- **Dark mode** — Class-based via `next-themes`, default dark

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

Please follow the existing code conventions:
- Tools are defined as **skills**, never inline in agent classes
- Prompts live in `src/lib/agents/prompts/`
- Schemas are centralized in `src/lib/agents/schemas.ts`
- Use `motion/react` for animations (not `framer-motion`)
- Import Zod as `import { z } from "zod"` (not `zod/v4`)

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with [Next.js](https://nextjs.org/), [Claude](https://www.anthropic.com/), and [Prisma](https://www.prisma.io/)

</div>
