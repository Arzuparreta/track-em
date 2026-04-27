# Build Plan — Music Manager Communications CRM
> Paste this entire document into your IDE LLM as project context before starting any session.

---

## What This Is

A self-hosted, single-user web app for a music industry manager to track calls, emails, and negotiations with contacts. The UI is structured and purposeful — no chat interface as primary UX. AI runs entirely under the hood: auto-populating fields, surfacing follow-ups, drafting emails, enabling semantic search. A side-panel agent chat is available but secondary.

---

## Guiding Constraints

- Self-hosted on a small VPS (1–2 GB RAM)
- Single user (no multi-tenancy needed now, but `user_id` on tables for future)
- No Redis — job queue runs on Postgres via pgBoss
- No separate vector DB — pgvector extension on the same Postgres instance
- No microservices — one deployable app process
- AI is invisible to the user in primary flows
- Contact data mirrored from Google/iCloud, never replaced

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one process. API routes + frontend. You already know it from Aquila. |
| Language | TypeScript | Type safety across DB, API, and UI. Zod for runtime validation. |
| ORM | Prisma | Schema-first, Postgres-native, great migration story |
| Database | PostgreSQL 16 | Relational core + pgvector for embeddings + pgBoss for jobs |
| Job queue | pgBoss | Postgres-backed, no Redis, exactly-once delivery, retry logic built in |
| Embeddings | pgvector (pg extension) | Semantic search without a separate vector DB |
| AI | Anthropic Claude API (claude-sonnet-4) | Enrichment, drafts, semantic extraction |
| Transcription | Whisper API (OpenAI) or Deepgram | Voice memo → structured call log |
| Auth | NextAuth.js (single user, credentials) | Simple, no external provider needed |
| Reverse proxy | Caddy | Auto HTTPS, zero config, tiny footprint |
| Deploy | Docker Compose (2 containers: app + db) | Simple, restartable, no orchestration needed |

---

## Simplified Architecture

```
VPS
├── Caddy (HTTPS termination)
│     └── → localhost:3000
│
├── Next.js App (single process)
│     ├── /app/api/*          → REST endpoints
│     ├── /app/(ui)/*         → Frontend pages
│     ├── lib/jobs/*          → pgBoss workers (started at app boot)
│     ├── lib/ai/*            → Claude enrichment functions
│     ├── lib/sync/*          → Contact sync (Google / CardDAV)
│     └── lib/gmail/*         → Gmail thread index
│
└── PostgreSQL 16
      ├── Core tables (contacts, calls, mail_threads, notes)
      ├── pgBoss tables (job queue, managed internally)
      └── pgvector (embeddings on contacts + calls)
```

No Redis. No separate worker dyno. pgBoss runs inside the Next.js process and manages all background work using Postgres's `SKIP LOCKED`.

---

## Data Model (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model Contact {
  id            String   @id @default(cuid())
  name          String
  emails        String[]
  phones        String[]
  role          String?  // "label", "booking_agent", "venue", "press", "promoter" etc.
  artistContext String?  // which artist this contact relates to
  source        ContactSource @default(MANUAL)
  externalId    String?  // ID in source system (Google, iCloud)
  lastSyncedAt  DateTime?
  raw           Json?    // full payload from sync source
  embedding     Unsupported("vector(1536)")?  // for semantic search
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  calls         Call[]
  mailThreads   MailThread[]
  followUps     FollowUp[]

  @@index([externalId, source])
}

enum ContactSource {
  MANUAL
  GOOGLE
  ICLOUD
  OUTLOOK
}

model Call {
  id              String    @id @default(cuid())
  contactId       String
  contact         Contact   @relation(fields: [contactId], references: [id])
  direction       Direction
  startedAt       DateTime
  durationSeconds Int?
  reason          String?   // AI-extracted or manually entered
  conclusion      String?   // AI-extracted or manually entered
  sentiment       String?   // AI-inferred: "positive", "neutral", "difficult"
  rawTranscript   String?   // if voice memo was used
  embedding       Unsupported("vector(1536)")?
  enrichedAt      DateTime? // null = pending AI enrichment
  createdAt       DateTime  @default(now())

  followUp        FollowUp?

  @@index([contactId, startedAt])
}

enum Direction {
  INBOUND
  OUTBOUND
}

model FollowUp {
  id            String    @id @default(cuid())
  contactId     String
  contact       Contact   @relation(fields: [contactId], references: [id])
  callId        String?   @unique
  call          Call?     @relation(fields: [callId], references: [id])
  scheduledAt   DateTime
  completed     Boolean   @default(false)
  completedAt   DateTime?
  notes         String?
  createdAt     DateTime  @default(now())

  @@index([scheduledAt, completed])
}

model MailThread {
  id            String   @id @default(cuid())
  contactId     String?
  contact       Contact? @relation(fields: [contactId], references: [id])
  gmailThreadId String   @unique
  subject       String
  snippet       String?   // last message preview
  lastMessageAt DateTime
  messageCount  Int       @default(1)
  labelIds      String[]
  needsReply    Boolean   @default(false) // AI-inferred
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Note {
  id        String   @id @default(cuid())
  contactId String
  body      String
  createdAt DateTime @default(now())
}
```

---

## Job Queue — pgBoss Workers

All AI enrichment runs async. The UI never waits for it.

### Queues

| Queue name | Trigger | What it does |
|---|---|---|
| `enrich-call` | Call saved | Extracts reason/conclusion/sentiment, generates embedding |
| `transcribe-memo` | Voice memo uploaded | Whisper → raw transcript → enqueue `enrich-call` |
| `sync-contacts` | Cron every 6h | Pulls Google/iCloud contacts, deduplicates into DB |
| `index-mail` | Cron every 15min | Pulls Gmail thread index for known contacts |
| `detect-followups` | Cron daily 8am | Scans calls with no follow-up + overdue follow-ups, creates alerts |
| `generate-draft` | User requests draft | Generates email draft based on call history + contact context |
| `embed-contact` | Contact created/updated | Generates embedding for semantic search |

### Worker bootstrap (runs at app start)

```typescript
// lib/jobs/index.ts
import PgBoss from 'pg-boss'
import { enrichCallWorker } from './enrich-call'
import { syncContactsWorker } from './sync-contacts'
// ... other workers

let boss: PgBoss

export async function startJobQueue() {
  boss = new PgBoss(process.env.DATABASE_URL!)
  boss.on('error', console.error)
  await boss.start()

  await boss.work('enrich-call', enrichCallWorker)
  await boss.work('transcribe-memo', transcribeMemoWorker)
  await boss.schedule('sync-contacts', '0 */6 * * *', {})
  await boss.schedule('index-mail', '*/15 * * * *', {})
  await boss.schedule('detect-followups', '0 8 * * *', {})
}

export function getQueue() { return boss }
```

Call `startJobQueue()` in your Next.js instrumentation file (`instrumentation.ts`) so it runs once at server start.

---

## AI Enrichment — What Claude Does

All calls go to `claude-sonnet-4`. Keep prompts in `lib/ai/prompts/`.

### Call enrichment prompt pattern

```typescript
// lib/ai/enrich-call.ts
export async function enrichCall(transcript: string, contactContext: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You are a silent assistant for a music industry manager. 
Extract structured information from call notes or transcripts.
Respond ONLY with valid JSON, no markdown, no explanation.`,
    messages: [{
      role: 'user',
      content: `Contact context: ${contactContext}
      
Call content: ${transcript}

Extract:
{
  "reason": "one sentence — why this call happened",
  "conclusion": "one sentence — what was agreed or decided",  
  "sentiment": "positive | neutral | difficult",
  "followUpSuggested": true | false,
  "followUpNote": "what the follow-up should address, if any"
}`
    }]
  })
  return JSON.parse(response.content[0].text)
}
```

### Draft engine pattern

```typescript
// lib/ai/generate-draft.ts
export async function generateDraft(contactId: string) {
  const contact = await getContactWithHistory(contactId)
  // builds context: last 3 calls + recent mail threads
  // returns: subject, body, tone suggestion
}
```

---

## Project Structure

```
/
├── app/
│   ├── (ui)/
│   │   ├── layout.tsx           # Shell: nav + side panel agent
│   │   ├── page.tsx             # Today view (default landing)
│   │   ├── contacts/
│   │   │   ├── page.tsx         # Contact list with search
│   │   │   └── [id]/page.tsx   # Contact detail + call history + mail threads
│   │   ├── calls/
│   │   │   └── new/page.tsx    # Quick call log form
│   │   └── follow-ups/
│   │       └── page.tsx        # Follow-up queue
│   │
│   └── api/
│       ├── contacts/route.ts
│       ├── contacts/[id]/route.ts
│       ├── calls/route.ts
│       ├── calls/[id]/route.ts
│       ├── follow-ups/route.ts
│       ├── drafts/route.ts      # On-demand draft generation
│       ├── search/route.ts      # Semantic search endpoint
│       ├── agent/route.ts       # Side panel agent (streaming)
│       └── webhooks/
│           └── gmail/route.ts   # Gmail push notifications (optional later)
│
├── lib/
│   ├── ai/
│   │   ├── enrich-call.ts
│   │   ├── generate-draft.ts
│   │   ├── detect-followups.ts
│   │   └── prompts/             # Prompt templates as .txt files
│   ├── jobs/
│   │   ├── index.ts             # pgBoss bootstrap
│   │   ├── enrich-call.ts
│   │   ├── sync-contacts.ts
│   │   ├── index-mail.ts
│   │   └── detect-followups.ts
│   ├── sync/
│   │   ├── google.ts            # Google People API
│   │   └── carddav.ts           # iCloud CardDAV
│   ├── gmail/
│   │   └── index.ts             # Thread index queries
│   ├── db.ts                    # Prisma client singleton
│   └── search.ts                # pgvector semantic search helpers
│
├── prisma/
│   └── schema.prisma
│
├── instrumentation.ts           # Starts pgBoss at server boot
├── docker-compose.yml
├── Caddyfile
└── .env.example
```

---

## UI — Four Screens

### 1. Today (default landing)
- Follow-ups due today and overdue (sorted by urgency)
- Calls logged in last 24h (quick review)
- Mail threads needing reply from known contacts
- No dashboards, no charts — just actionable items

### 2. Contact Detail
- Name, role, contact info
- Full chronological timeline: calls + emails interleaved
- "Log a call" button (opens inline form, pre-fills contact)
- "Write email" button (triggers draft generation, shows editable result)
- Last interaction badge ("Last contact: 3 days ago")

### 3. Quick Call Log
- Contact autocomplete
- Direction toggle (I called / They called)
- Date/time (default: now)
- Reason + conclusion (free text OR voice memo upload)
- Follow-up toggle → date picker
- Submit → saves immediately, AI enrichment runs async in background

### 4. Follow-up Queue
- Grouped: Overdue / Today / This week / Later
- One-tap "Done" or "Snooze 2 days"
- Tap to open contact

### Side Panel (always available, never primary)
- Collapsible chat panel on the right
- Full agent access: "summarise my negotiations this month", "who haven't I called in 3 weeks", "draft a reply to John"
- Streams responses, has access to all DB context

---

## Phased Build Plan

### Phase 1 — Core (Week 1–2)
**Goal: She can log a call and see her contacts.**

- [ ] Prisma schema + migrations (no pgvector yet)
- [ ] Docker Compose: Postgres + Next.js app
- [ ] NextAuth credentials auth (single user)
- [ ] Contact CRUD API + UI (manual entry only)
- [ ] Call log form + API
- [ ] Follow-up creation from call log
- [ ] Today view (static, no AI)
- [ ] Contact detail with call timeline
- [ ] Caddy config + deploy to VPS

**Milestone: Working app, zero AI, fully usable.**

---

### Phase 2 — Contact Sync (Week 3)
**Goal: She never adds a contact manually.**

- [ ] Google OAuth + People API sync job (pgBoss cron)
- [ ] iCloud CardDAV sync job
- [ ] Deduplication logic (match by email/phone)
- [ ] `raw` JSONB column populated from sync
- [ ] UI: Settings page → connect Google / iCloud
- [ ] Last synced timestamp visible in UI

**Milestone: Contacts appear automatically from her address books.**

---

### Phase 3 — AI Enrichment (Week 4)
**Goal: She logs a call in 10 seconds, AI fills the rest.**

- [ ] pgBoss fully wired (`instrumentation.ts` bootstrap)
- [ ] `enrich-call` worker: Claude extracts reason/conclusion/sentiment
- [ ] Voice memo upload → Whisper transcription → enrich pipeline
- [ ] Enrichment status indicator in UI (subtle — "processing..." → disappears)
- [ ] `detect-followups` cron: surfaces overdue contacts in Today view
- [ ] Follow-up suggestions from enriched call data

**Milestone: Logging a call is one voice memo. Everything else is automatic.**

---

### Phase 4 — Mail + Drafts (Week 5–6)
**Goal: She sees relevant emails in context, never starts from blank.**

- [ ] Gmail OAuth + thread index sync (pgBoss cron every 15min)
- [ ] Link threads to contacts by email address
- [ ] Mail threads visible in contact timeline
- [ ] `needsReply` AI classification on indexed threads
- [ ] "Write email" → `generate-draft` job → editable result in UI
- [ ] Draft sends via Gmail API (confirm before send)

**Milestone: Mail is in context alongside calls. Drafts write themselves.**

---

### Phase 5 — Semantic Search (Week 7)
**Goal: Natural language queries across all history.**

- [ ] pgvector extension enabled in Postgres
- [ ] Embedding generation on call save + contact save
- [ ] `/api/search` endpoint: embed query → cosine similarity search
- [ ] Search bar in contacts page with semantic results
- [ ] Side panel agent gets semantic search as a tool

**Milestone: "Show me everyone involved in the summer festival circuit" works.**

---

### Phase 6 — Side Panel Agent (Week 8)
**Goal: Power user escape hatch.**

- [ ] Streaming agent endpoint (`/api/agent`)
- [ ] Tool palette: search contacts, get call history, generate draft, log call, list follow-ups
- [ ] Collapsible side panel in layout
- [ ] Conversation memory scoped to session (no persistent chat history needed)

**Milestone: She can ask the agent anything. It answers from her actual data.**

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/crm

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://yourdomain.com
APP_USER_EMAIL=mum@example.com
APP_USER_PASSWORD_HASH=   # bcrypt hash

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=            # for Whisper transcription (or use Deepgram)

# Google OAuth (contacts + Gmail)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# iCloud (CardDAV)
ICLOUD_USERNAME=
ICLOUD_APP_PASSWORD=       # Apple app-specific password
```

---

## Docker Compose

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: crm
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/crm
    depends_on:
      - db
    restart: unless-stopped

volumes:
  pgdata:
```

Note: Use `pgvector/pgvector:pg16` image — it has the vector extension pre-installed. No separate image needed.

---

## Key Decisions to Communicate to LLM Sessions

When starting a new IDE session on a specific phase, prefix with:

> "This is a Next.js 14 App Router project with TypeScript, Prisma, PostgreSQL, pgvector, and pgBoss. There is no Redis. The job queue runs in-process via pgBoss started in `instrumentation.ts`. AI enrichment is async and invisible to the user. We are currently working on Phase [N]. The full context is in BUILDPLAN.md."

---

## What We Are Explicitly NOT Building

- No Redis / no Bull / no separate worker process
- No microservices
- No multi-tenancy (single user, add `user_id` to schema for future only)
- No mobile app (responsive web is enough)
- No realtime websockets (poll or server-sent events only if needed)
- No chat as primary UI
- No file storage (no email attachments stored)
- No managed cloud DB (local Postgres is the database)
