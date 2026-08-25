# Ed-Vantage

**Ed-Vantage** (EduFit Nepal) is a decision intelligence platform that helps Nepali schools avoid failed EdTech investments by analyzing their environment, student accessibility, and readiness before recommending educational technologies. Built for the BNKS hackathon.

Primary users are NGOs, municipalities, and school networks doing due diligence before EdTech spend — not individual schools acting alone.

---

## Features

### Compatibility engine + AI layer
- **Deterministic scoring engine** (`src/lib/scoring.ts`) — pure, rule-based compatibility scoring across five assessment types: infrastructure, teacher readiness, school management, learning requirements, plus student surveys. No AI in the math.
- **AI explanation layer** (`/api/explain`, `src/lib/ai.ts`) — NVIDIA NIM llama-3.3-70b-instruct turns computed scores into plain-language explanations and 90-day action plans. It explains; it never calculates.

### Gated authentication
- Login (`/login`) requires **all four**: email + password + school code (`SCH-*`) + personal code (`TCH-*`/`STU-*`), validated server-side against preloaded `school_members`.
- Establishes a real Supabase session on success so DB-backed pages work.
- Seeded demo accounts with one-click fill buttons — see [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md).

### Student portal
- `/survey` — confidential monthly survey (device access, internet, study environment). Confirmed DB write before any success state.
- Monthly survey gate before the student dashboard unlocks.
- `/student` — personal dashboard including events & opportunities.

### Teacher portal
- `/teacher` — aggregate survey analytics only (device/internet distributions, reported challenges, monthly completion). Individual responses stay confidential.
- **Student records management** — teachers add students (name, email, grade, temp password) to **their own school only**. School scoping is resolved server-side from the teacher's session JWT, never from client input. Auto-generates `STU-*` login codes.
- `/dashboard` — full school readiness assessment workflow with scored results and AI action plans.

### Community hub
- `/community` — moderated feed, direct messages, and admin moderation tools.

### Live events finder
- `/events` — discovers hackathons, competitions, workshops and more for Nepali students:
  - **Real web scrapers** (`src/lib/scrapers/`) against Kata Jaam (schema.org JSON-LD), GDG Kathmandu, Kathmandu University Computer Club, and KU Robotics Club.
  - Results cached per source in `scraped_events_cache` with a 6-hour TTL; "Refresh live events" button forces an on-demand run.
  - Scraped listings carry a **LIVE** badge and link straight to the organizer's page.
  - District-aware matching: the finder prefills your district from your school's profile and scores every event against your level, interests, and preferences.

### Resource hub
- `GET /api/resources` — curated scholarships, competitions, learning resources and digital materials.

### Admin console
- `/hq-control` — restricted administration page (access controlled by a server-side key): cross-school stats, all schools and members, and teacher account creation with auto-generated `TCH-*` codes.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3.2 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Backend | Supabase (Postgres, Auth, RLS) |
| Scraping | cheerio |
| Icons | lucide-react |
| AI | NVIDIA NIM llama-3.3-70b-instruct |

---

## Getting started

```bash
npm install
```

1. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `NVIDIA_NIM_API_KEY` (server-only)
   - `ADMIN_SECRET_KEY` (server-only — required by the admin console APIs)

2. Database schema lives in [`supabase/migrations/`](supabase/migrations/) — apply them to your Supabase project in filename order. For demo data:

```bash
# seed two schools + test teacher/student accounts (idempotent)
psql "$DATABASE_URL" -f supabase/seed_test_accounts.sql
```

3. Run it:

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production build
npm run lint     # typecheck
```

Demo logins are documented in [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) (shared password: `Test@2026`).

---

## Project structure

```
src/
├── app/
│   ├── api/            # Route handlers (auth, surveys, events, explain,
│   │                   #   community feed, resources, admin/*, teacher/*)
│   ├── community/      # Moderated community hub
│   ├── dashboard/      # Readiness assessment workflow
│   ├── events/         # Events finder (+ [id] detail pages)
│   ├── hq-control/     # Restricted admin console
│   ├── login/          # Gated login
│   ├── student/        # Student dashboard (survey-gated)
│   ├── survey/         # Student monthly survey
│   └── teacher/        # Teacher analytics + roster management
├── components/         # AuthGuard, UserBadge, community components
└── lib/
    ├── scoring.ts      # Deterministic compatibility engine
    ├── ai.ts           # AI explanation layer (explanation-only)
    ├── auth.ts         # Client-side session snapshots
    ├── server-auth.ts  # Server-side identity resolution + admin guard
    ├── supabase.ts     # Browser/server client factories
    ├── types.ts        # Single source of truth for all shapes
    ├── events.ts       # Curated dataset + filters/matching
    ├── resources.ts    # Curated resource hub content
    └── scrapers/       # Live event scrapers (one adapter per source)
supabase/
├── migrations/         # Schema history, apply in filename order
└── seed_test_accounts.sql
```

---

## Notes

- The compatibility engine is deterministic by design — see CLAUDE.md for the architecture rules this repo follows.
- The demo-credentials box on `/login` is a development convenience; remove before production launch.
