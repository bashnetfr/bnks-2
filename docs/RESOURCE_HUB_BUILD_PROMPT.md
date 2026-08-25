# Task: Build the Resource Hub

Read `MASTER_PROMPT.md` and `CLAUDE.md` first.

## What this is

A curated, secondary feature: scholarships, competitions, school-approved learning resources, and digital learning materials — the participation incentive that gives students a reason to complete the digital-access survey, and the eventual distribution channel that gives NGOs/municipalities a second reason to adopt EduFit beyond the compatibility data.

## Build it API-first, even though the content is static right now

Structure this as its own endpoint — e.g. `GET /api/resources?school=X` — rather than hardcoding curated content directly into the student survey UI. The content is static for MVP, but this is the piece explicitly planned to integrate into other schools' existing apps later; building the interface cleanly now avoids a rebuild when that integration happens.

## MVP scope

A static, hand-curated list. No submission workflow, no approval pipeline — pick real content yourself for the demo. Do not build multi-source submission/approval logic (who approves what, does a municipality's content auto-apply to every school under it) — that's a genuine post-MVP design decision, not a quick addition.

## What this explicitly is not

Not a browsable catalog, not a discount/deal marketplace. Keep it a short, tightly curated list — the doc this product is built from is explicit that turning this into a generic marketplace defeats its purpose.

## Done criteria

- A working `GET /api/resources` (or equivalent) endpoint returning real, hand-picked content — not placeholder/lorem-ipsum text.
- Rendered in the student flow *before* the survey questions (see STUDENT_SURVEY_BUILD_PROMPT.md).
- No submission or approval UI built for MVP.
