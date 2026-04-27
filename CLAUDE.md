
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Music Manager CRM** — A self-hosted Next.js communications CRM for music industry managers to track calls, emails, and negotiations with contacts.

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Database:** PostgreSQL + Prisma ORM (with pgvector for vector embeddings)
- **Auth:** NextAuth.js with Credentials provider + bcrypt hashing
- **Testing:** Vitest (unit), React Testing Library, Playwright (E2E)
- **Integrations:** Google OAuth (Gmail), iCloud CardDAV, Anthropic Claude API, OpenAI Whisper
- **Deployment:** Docker Compose, PM2, Render.com/VPS

## 🚀 Development Workflow

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see .env.example)
cp .env.example .env
# Edit .env with your values

# 3. Start PostgreSQL via Docker
npm run db:push    # or: docker-compose up -d

# 4. Generate Prisma client & run migrations
npm run db:generate
npm run db:migrate

# 5. Start dev server
npm run dev
```

Open **http://localhost:3000** in your browser.

### Development Server
- `npm run dev` — Start Next.js dev server (port 3000)
- `npm run build` — Build for production
- `npm start` — Start production server
- `npm run lint` — Run ESLint

### Testing
```bash
# Unit tests (Vitest)
npm run test              # Run all tests once
npm run test:watch        # Watch mode

# E2E tests (Playwright)
npm run test:e2e

# Generate coverage
npm run test -- --coverage
```

**Expected test output:**
```
Test Files  3 passed (3)
      Tests  18 passed (18)
   Start at  16:28:36
   Duration  877ms
```

### Database Operations
```bash
# Generate Prisma client from schema
npm run db:generate

# Run migrations (dev mode, prompts for new migration)
npm run db:migrate

# Push schema directly to database (dev only)
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio

# Raw SQL queries via Prisma Studio:
# - Overdue follow-ups: SELECT * FROM "FollowUp" WHERE "completed" = false AND "scheduledAt" < NOW();
```

## 📁 Project Structure

```
src/
├── app/                        # Next.js app routes (App Router)
│   ├── (ui)/
│   │   ├── page.tsx           # Today Dashboard (default route)
│   │   ├── contacts/          # Contact management pages
│   │   ├── calls/             # Call logging pages
│   │   └── follow-ups/        # Follow-up pages
│   ├── api/                   # API routes (tRPC-like endpoints)
│   │   ├── contacts/          # Contact CRUD (GET, POST, PUT, DELETE)
│   │   ├── calls/             # Call endpoints
│   │   ├── follow-ups/        # Follow-up endpoints
│   │   └── auth/[...nextauth] # NextAuth handlers
│   ├── layout.tsx             # Root layout with auth providers
│   └── globals.css            # Global styles
├── components/                # React components
│   ├── ui/                    # shadcn/ui components
│   └── auth/                  # Auth forms (SignInForm, etc.)
├── lib/
│   ├── db.ts                  # Prisma client singleton
│   ├── auth.ts                # NextAuth configuration
│   └── utils/
│       ├── formatters.ts      # Date, phone, text formatting
│       └── formatters.test.ts # Formatter unit tests
├── types/                     # TypeScript type definitions
└── test/
    └── setup.ts              # Test setup (jsdom, matchers)

prisma/
├── schema.prisma              # Database schema (PostgreSQL + pgvector)
└── migrations/                # Database migrations

scripts/
└── generate-hash.js          # bcrypt password hash generator
```

## 🗄️ Database Schema

### Core Models
- **Contact** — Contacts with name, emails[], phones[], role, artistContext, source, embedding (vector for semantic search)
- **Call** — Call logs with direction (INBOUND/OUTBOUND), duration, reason, sentiment, embedding
- **FollowUp** — Scheduled follow-ups linked to contacts (optionally to calls)
- **MailThread** — Synced Gmail threads with needsReply flag
- **User/Account/Session** — NextAuth.js auth models

### Key Relations
- Contact → Call (1:N, cascade delete)
- Contact → FollowUp (1:N, cascade delete)
- Contact → MailThread (1:N, set null)
- Call → FollowUp (1:1, set null)

### Indexes
- Contact: `[externalId, source]`, `[updatedAt]`
- Call: `[contactId, startedAt]`
- FollowUp: `[scheduledAt, completed]`

## 🔐 Authentication & Authorization

### Auth Flow
- **Provider:** NextAuth.js Credentials provider (single-user MVP)
- **Strategy:** JWT sessions (HttpOnly cookies)
- **Hashing:** bcrypt (10 rounds)

### Environment Variables
```bash
# Required
APP_USER_EMAIL=admin@dorantes.es
APP_USER_PASSWORD_HASH=<bcrypt-hash>
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<strong-secret>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/music_manager_crm

# Optional integrations
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ICLOUD_USERNAME=...
ICLOUD_APP_PASSWORD=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

**Generate password hash:**
```bash
node scripts/generate-hash.js
```

### Protected Routes
All routes except `/auth/signin` require authentication (via `src/middleware.ts`).

## 🧪 Testing Strategy

### Test Files
- `src/lib/auth.test.ts` — Auth configuration (providers, strategy, secrets)
- `src/lib/utils/formatters.test.ts` — Date/phone/text formatting utilities
- `src/app/page.test.tsx` — Home page rendering (RTL + jsdom)

### Patterns
- **Test framework:** Vitest (Jest-compatible)
- **React testing:** @testing-library/react + jsdom
- **Global test setup:** `src/test/setup.ts`
- **Matchers:** @testing-library/jest-dom

### API Testing Pattern
```typescript
// Example test approach for API routes
describe('Contact API', () => {
  it('creates a contact with valid data', async () => {
    // Test POST /api/contacts
    // Validate Zod schema validation
    // Check Prisma create call
    // Verify response shape and status
  });
});
```

## 🎯 Adding New Features

### API Endpoint (Route Handler)
```typescript
// src/app/api/new-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({ /* validation */ });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    const result = await prisma.model.create({ data });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
```

### Component Guidelines
- Use **shadcn/ui** components from `src/components/ui/`
- Prefer `class-variance-authority` + `clsx` for variants
- Use `tailwind-merge` for className merging
- Import types from `@/types`
- Use `formatPhoneNumber`, `formatDate`, `truncate` from `@/lib/utils`

### Form Handling
- Client-side validation with **Zod** schemas
- Server-side validation in API routes
- Use `z.array(z.string().email())` for email arrays
- String enums: `z.enum(['MANUAL', 'GOOGLE', 'ICLOUD'])`

## 🔧 Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vitest config (jsdom, global APIs, coverage) |
| `tsconfig.json` | TypeScript config (strict mode, path aliases `@/*`) |
| `next.config.js` | Next.js configuration |
| `postcss.config.js` | PostCSS + Tailwind |
| `tailwind.config.ts` | Tailwind + shadcn/ui theme |
| `eslint.config.mjs` | ESLint rules (Next.js + TypeScript) |
| `.claude/settings.local.json` | Claude Code permission allowlist |

## 🚨 Troubleshooting

### Database Connection Issues
```bash
docker-compose ps            # Check if DB is running
docker-compose restart db    # Restart PostgreSQL
cat .env | grep DATABASE_URL # Verify config
```

### Prisma Issues
```bash
npm uninstall prisma @prisma/client
npm install prisma@5.16.0 @prisma/client@5.16.0
npx prisma generate
```

### Auth Failures
```bash
# Regenerate password hash
node scripts/generate-hash.js
# Update .env APP_USER_PASSWORD_HASH
```

### Port Conflicts
```bash
lsof -ti:3000    # Find process
kill -9 <PID>    # Kill it
# Or use different port: npm run dev -- -p 3001
```

### Test Failures
```bash
rm -rf node_modules/.vitest   # Clear cache
npm install                   # Reinstall
npm run test                  # Run again
```

## 📋 Conventions & Best Practices

### Code Style
- **TypeScript:** Strict mode enabled
- **Imports:** Path aliases `@/` for `src/`
- **Formatters:** Use `formatDate`, `formatTimeAgo`, `formatPhoneNumber`
- **Validation:** Zod schemas in API routes
- **Database:** Prisma for all queries (no raw SQL in app code)
- **Components:** Prefer composition over prop drilling

### Security
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT sessions (HttpOnly cookies)
- ✅ CSRF protection (NextAuth)
- ✅ Input validation (Zod)
- ✅ Auth middleware on all routes
- ✅ Environment-based secrets
- ❌ Never commit `.env` or `*.local` files

### Testing Rules
- **API routes:** Test request/response, validation, error cases
- **Components:** Test rendering with RTL, user interactions
- **Utils:** Pure functions, test edge cases
- **Auth:** Test configuration, not flow (covered by NextAuth)

### Commit Messages
```
feat: add contact search endpoint
fix: resolve phone formatting for international numbers
test: add validation tests for contact creation
docs: update API reference
refactor: extract common validation schemas
```

## 🚀 Production Deployment

### Docker (Recommended)
```bash
npm run build
docker-compose up -d
```

### Render.com
1. Create Web Service
2. Connect GitHub repo
3. Set environment variables (all from `.env`)
4. Deploy

### VPS / Cloud
```bash
npm run build
pm2 start npm --name "crm" -- start
```

### Required Prod Environment Variables
- `DATABASE_URL` — Production PostgreSQL
- `NEXTAUTH_URL` — Domain (e.g., `https://crm.example.com`)
- `NEXTAUTH_SECRET` — Generated: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `APP_USER_EMAIL` — Admin email
- `APP_USER_PASSWORD_HASH` — Strong bcrypt hash

## 🔍 Quick Reference

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| Run tests | `npm run test` |
| DB Studio | `npm run db:studio` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| New migration | `npm run db:migrate` |
| Prod start | `npm start` |
| Password hash | `node scripts/generate-hash.js` |

## 📚 Documentation Links

- **Quick Start:** See `README.md` Quick Start section
- **Full Plan:** `docs/BUILDPLAN.md`
- **Technical Details:** `IMPLEMENTATION_SUMMARY.md`
- **Version History:** `CHANGELOG.md`
- **Project Status:** `PROJECT_STATUS.md`

## ⚠️ Important Notes

- **Prisma client** is instantiated as a singleton in `src/lib/db.ts` (prevents multiple instances in dev)
- **Vector embeddings** use pgvector extension (`Unsupported("vector(1536)")` for OpenAI embeddings)
- **NextAuth** uses JWT strategy (not database sessions) for MVP simplicity
- **Environment validation** is implicit — ensure all required vars in `.env` before running
- **CORS** is handled by Next.js API routes automatically
- **Rate limiting** not implemented — consider adding for production

