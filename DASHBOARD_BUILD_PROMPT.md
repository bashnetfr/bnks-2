# Task: Build the School Admin Dashboard

Read `MASTER_PROMPT.md` and `CLAUDE.md` first — the positioning and architecture rules there govern this.

## Step 0 — Ground yourself first

Read `src/lib/types.ts` in full before building any form or view. Use its existing interfaces (`SchoolProfile`, the four assessment interfaces, `CompatibilityResult`) as the source of truth for field names. If a field you need isn't there, flag it — don't invent a shape that conflicts with what the engine and AI layer expect.

## What this feature covers

1. **School profile creation form** — name, location, school type, student count, grade levels, teacher count, current technology usage.
2. **Digital Readiness Assessment form** — structured inputs across the four dimensions (Infrastructure, Teacher Readiness, School Management, Learning Requirements). Use dropdowns/scaled inputs that map directly to `SchoolProfile` fields — no free-text feeding the score.
3. **Results/recommendation screen.**

## Two details that matter more than they look

**No dead end after submission.** When the assessment is submitted, swap the form view for the results view in place — same page, same component tree, no redirect message telling the user to navigate elsewhere. This is the single most important UX fix in this feature:

```tsx
const [result, setResult] = useState<CompatibilityResult | null>(null);

async function handleSubmit(data) {
  const res = await submitAssessment(data);
  setResult(res); // conditionally render <ResultsView result={result} /> instead of the form
}
```

**An "Other/additional context" free-text field on the assessment**, stored but never fed into scoring. This handles the case where a school's real situation doesn't fit the fixed categories — it's there for a human reviewer later, and it can flow into the AI explanation layer as qualitative color (since that layer produces prose, not numbers, it's safe to reference free text there without it ever touching the deterministic score).

**Missing/skipped fields**: don't default to zero or full marks. Use an explicit neutral default (suggest 50) and add "incomplete data" to the problems list, so the UI stays honest that the score is a partial picture.

## Results screen requirements

- Overall score, per-dimension subscores shown as progress bars (not just a single number), flagged problems, recommended tool(s).
- Tooltips on each score component explaining *why* it's what it is — this is the transparency principle the whole product depends on; a black-box score undermines the pitch.
- Call `generateExplanation()` from `src/lib/ai.ts` after the engine result is available, and render its output alongside the raw score — wrap this call so that if it fails, the raw engine output (score + problems) still renders on its own. See AI_INTEGRATION_BUILD_PROMPT.md for the fallback contract.

## Done criteria

- Full flow works: school profile → assessment → inline results, with no manual-navigation step anywhere.
- A missing/skipped assessment field produces a flagged "incomplete data" problem, not a silently wrong score.
- If the AI explanation call is simulated to fail, the results screen still shows the engine's score and problems.
