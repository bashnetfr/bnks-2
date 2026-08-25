# Task: Build the Student Digital-Access Survey

Read `MASTER_PROMPT.md` and `CLAUDE.md` first.

## Step 0 — Ground yourself first

Read `src/lib/types.ts` — use the existing `StudentSurvey` interface as the source of truth for field names. This is a responsive web form, not a native app — no Capacitor wrapper for MVP.

## Auth

School-issued student email as the primary login. School code as a fallback for students without one set up. Don't add personal-email signup or new auth providers without confirming with the maintainer first.

## Survey content

Device ownership, internet access, learning preferences, digital confidence, access limitations — matching the fields already defined on `StudentSurvey`.

## Delivery model — read this carefully, it resolves a real tension

Primary path: students complete this at home, away from a teacher, so answers about limited access aren't given under social pressure from an authority figure in the room.

But home-only completion has a real failure mode: the student with the *least* access is the least able to complete a take-home digital survey unprompted — you'd systematically lose exactly the data you most need. So also support completing it in class on a shared/school device, as an explicit fallback for students without home access — not the default, but available.

Whichever path a student uses, **responses must be private and confidential**: no reading answers aloud, no teacher looking over a shoulder. If there's any teacher-facing view of survey status, it shows only an aggregate completion count ("18 of 24 submitted"), never individual answers. Say this to students explicitly before they answer — a plain line like "your teacher won't see your individual answers, only the school sees combined results" does real work here.

## Submission handling — do not use optimistic rendering here

Confirm the write actually succeeded before showing a success state. This is the one place in the app where optimistic UI is the wrong call: if a low-connectivity student's submission silently fails after the UI already told them it worked, you've recorded false confidence in exactly the data the compatibility engine depends on being accurate. A slightly slower, confirmed success beats a fast, unconfirmed one here.

## Resource Hub placement

Surface the Resource Hub's content *before* the survey questions, not after — framed as "here's what's available to you." This is the participation incentive for a population with no independent reason to fill out a survey otherwise; see RESOURCE_HUB_BUILD_PROMPT.md for what it contains.

## For whoever wires this to the engine

Aggregated student responses per school need to reach `scoring.ts`'s reality-gap blending logic (school-reported vs. student-reported, student data weighted higher, flagged when they diverge) — not just stored raw and left disconnected from the engine.

## Done criteria

- A student can complete the survey on either a personal device at home or a shared/school device in class.
- Submission is confirmed, not assumed, before showing success.
- The Resource Hub is visible before the survey questions, not after.
- No teacher-facing view exposes individual student answers.
