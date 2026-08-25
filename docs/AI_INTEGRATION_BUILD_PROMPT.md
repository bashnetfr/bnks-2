# Task: Wire the AI Explanation Layer (src/lib/ai.ts)

Read `MASTER_PROMPT.md` and `CLAUDE.md` first — especially the rule that this layer explains, never calculates.

## Step 0 — Ground yourself first

Read `src/lib/types.ts` (`CompatibilityResult`, `ExplanationResult`) and whatever currently exists in `src/lib/ai.ts` before writing new code.

## What to build

`generateExplanation(result: CompatibilityResult): Promise<ExplanationResult>` — called *after* `scoring.ts` has already produced a result. This function takes already-computed numbers and produces prose. It never touches a score.

```typescript
export async function generateExplanation(
  result: CompatibilityResult
): Promise<ExplanationResult> {
  const systemPrompt = `You are an EdTech implementation advisor. You are given a
school's compatibility result, already computed by a deterministic rules engine.
Explain it in plain language a principal can understand, and produce a 90-day
action plan targeting the specific problems listed.
Rules: never alter, recompute, or contradict any score or problem in the input.
Only reference the data provided. Respond as JSON: {"explanation": string,
"actionPlan": [{"month": number, "focus": string}]}`;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NVIDIA_NIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct', // swap for your chosen Nemotron model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(result) },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    const data = await response.json();
    const raw = data.choices[0].message.content.replace(/```json|```/g, '').trim();
    return JSON.parse(raw) as ExplanationResult;
  } catch (err) {
    return { explanation: null, actionPlan: [], fallback: true };
  }
}
```

## Non-negotiables

- **Server-side only.** `NVIDIA_NIM_API_KEY` must never reach the client — same principle as the Supabase service role key.
- **Low temperature (~0.3).** You want faithful narration of fixed facts, not creative variation on real numbers.
- **The try/catch fallback is required, not optional.** If this API is slow or down during the actual demo, the results page must still render the engine's score and problems on their own — see DASHBOARD_BUILD_PROMPT.md's error-boundary requirement. A wrapped failure here should never take down the whole results screen.
- **Strip markdown fences before parsing** — models sometimes wrap JSON responses in ` ```json ` blocks; parsing will throw if you don't strip them first.

## Done criteria

- Given a real sample `CompatibilityResult`, produces a plain-language explanation and a 90-day action plan.
- A simulated API failure (wrong key, timeout) returns the fallback shape without throwing, and the calling dashboard code renders the raw engine output instead of breaking.
