# EduFit Nepal — Master Project Prompt

Read this in full before starting any task in this repo. This is the shared context every 
feature-specific prompt file assumes — DASHBOARD_BUILD_PROMPT.md, STUDENT_SURVEY_BUILD_PROMPT.md, 
RESOURCE_HUB_BUILD_PROMPT.md, AI_INTEGRATION_BUILD_PROMPT.md, WEBSITE_POLISH_BUILD_PROMPT.md, 
and ENGINE_BUILD_PROMPT.md. Also read CLAUDE.md for repo-level technical conventions — this 
file covers the *why*, CLAUDE.md covers the *how*.

## What EduFit Nepal actually is

A decision-intelligence platform, not an EdTech product itself. It analyzes a school's 
environment, student accessibility, and readiness, then tells an institution whether — and 
how — a given EdTech tool should be deployed there. It's built on the World Bank's Education 
and Technology Readiness Index (ETRI) framework, which was piloted in Nepal in 2022 and 
specifically found Nepal's Teacher Readiness pillar weak due to absent standards and limited 
ICT curriculum integration — that finding is the real, locally-evidenced problem this exists 
to address, not a hypothetical one.

## Who this is for — get this right, it's the difference between passing and failing the pitch

Not individual schools acting alone — they have no forcing function to run a formal readiness 
assessment before buying, and pitching it that way reopens the exact "why would anyone use 
this" objection a mentor already raised. The real buyer is NGOs, municipalities, and school 
networks accountable for EdTech budgets, with a long-term direction toward being 
government-provided — a ministry funds or mandates it and distributes access to schools/NGOs 
under them for free, mirroring how ETRI itself is normally deployed. Pitch this as a phased 
path: a pilot with one real organization first, ministry-level adoption as the destination, 
never claimed as an existing relationship you don't have.

**Hackathon theme:** Education Advancement. **Marking weights:** Theme Relevance 25%, 
Technical Complexity 20%, Practicality/Feasibility 25%, Uniqueness/Innovation 20%, Clarity 
of Presentation 10%. The causal chain from "better tech decisions" to "actual educational 
advancement" should be stated explicitly in the pitch, not left for a judge to infer.

## Non-negotiable architecture

1. **The compatibility engine is deterministic.** Rules and weighted arithmetic only, never 
   AI — this is what makes recommendations transparent and auditable, which is the entire 
   point of the product.
2. **The AI layer explains, never calculates.** It takes an already-computed result and 
   produces prose. It never recalculates, overrides, or contradicts a score.
3. **Two independent data sources feed the engine** — school-reported and student-reported — 
   blended with student data weighted higher (it's ground truth), never one silently 
   overwriting the other, with a `realityGapFlag` when they diverge meaningfully.
4. **`src/lib/types.ts` is the single source of truth** for data shape across engine, AI 
   layer, and UI.

## Feature set in scope — nothing beyond this list

- Compatibility/readiness engine — ENGINE_BUILD_PROMPT.md
- School admin dashboard: profile creation, four-dimension readiness assessment, results 
  shown inline immediately on submission (no manual navigation step) — 
  DASHBOARD_BUILD_PROMPT.md
- Student digital-access survey: responsive web form, no native app for MVP. Completed 
  primarily at home (for answer honesty, away from a teacher), with an in-class/shared-device 
  fallback option so students without home access aren't excluded from the data. Auth: 
  school-issued email primary, school code fallback — STUDENT_SURVEY_BUILD_PROMPT.md
- Resource Hub: static curated list (scholarships, competitions, learning resources), 
  API-first for future integration into other schools' apps, surfaced before the survey as 
  the participation incentive — RESOURCE_HUB_BUILD_PROMPT.md
- AI explanation layer: NVIDIA NIM hosted API, explanation-only — AI_INTEGRATION_BUILD_PROMPT.md
- Website/technical hygiene — WEBSITE_POLISH_BUILD_PROMPT.md

## Explicitly out of scope — do not build, do not suggest adding

- Capacitor native app. A thin WebView wrapper is fine if you want something app-shaped for 
  the demo (under a day). The real offline-capable native port is 1–3+ weeks of separate 
  engineering plus app-store review time — post-hackathon only.
- Bandwidth-adaptive lesson delivery as a built feature. This is a scoring criterion on the 
  engine's tool profiles ("does this tool support low-bandwidth delivery"), not something 
  EduFit hosts or produces lesson content for.
- Presenting World Bank ETRI research as a "case study" of EduFit. It validates the problem, 
  not the product — keep a "Grounded in Research" section separate from "Case Studies," and 
  leave the latter empty rather than filled with borrowed validation.
- Fabricated customer reviews, maps/directions, local business schema — wrong pattern for 
  remote B2B/B2G software with no physical location.
- Portfolio/multi-school organization dashboards, Resource Hub submission/approval workflows, 
  actual subscription billing — real, deliberately post-MVP. If a task seems to gesture 
  toward these, don't build them now.

## Tech stack

Next.js 16.3.2 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (auth/db/backend), 
NVIDIA NIM hosted API for the AI layer. Visual direction is a calm, institutional, 
teal-leaning palette — the actual tokens are already defined in this project's Tailwind 
config/globals.css; follow what's there rather than introducing new colors.

**Read `AGENTS.md` before writing any Next.js-specific code.** Next.js 16 has real breaking 
changes from what most training data assumes. That file is auto-generated and re-added by 
`next dev` itself — don't hand-edit it, just commit it when it appears, and follow what it 
points you to.
