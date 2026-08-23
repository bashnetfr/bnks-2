// ================================================================
// EduFit Nepal — AI Explanation Layer
//
// MASTER_PROMPT.md §"Non-negotiable architecture" rule #2:
//   This layer EXPLAINS. It never calculates, overrides, or
//   contradicts a score. All numbers come from scoring.ts.
//
// AI_INTEGRATION_BUILD_PROMPT.md: NVIDIA NIM API, server-side only.
// ================================================================

import type { CompatibilityResult, ExplanationResult } from './types'

// The fallback shape returned on any API failure.
// DASHBOARD_BUILD_PROMPT.md: results screen must render the engine's
// raw score and problems even if this call fails entirely.
const FALLBACK: ExplanationResult = {
  explanation: null,
  actionPlan: [],
  fallback: true,
}

/**
 * Generate a plain-language explanation and 90-day action plan for a
 * compatibility result. Called AFTER scoring.ts has computed the result.
 *
 * SERVER-SIDE ONLY. NVIDIA_NIM_API_KEY must never reach the client.
 */
export async function generateExplanation(
  result: CompatibilityResult
): Promise<ExplanationResult> {
  const systemPrompt = `You are an EdTech implementation advisor working with schools in Nepal. 
You are given a school's compatibility result, already computed by a deterministic rules engine.
Explain it in plain language a school principal or NGO program officer can understand.
Produce a 90-day action plan targeting the specific problems listed — month 1, 2, and 3.

Rules (non-negotiable):
- Never alter, recompute, or contradict any score or problem in the input.
- Only reference data provided in the input. Do not invent facts.
- Keep explanation under 200 words.
- Each action plan month: one clear, concrete focus area.
- Respond ONLY as valid JSON — no markdown, no fences, no preamble.

JSON schema: {"explanation": string, "actionPlan": [{"month": 1, "focus": string}, {"month": 2, "focus": string}, {"month": 3, "focus": string}]}`

  try {
    const apiKey = process.env.NVIDIA_NIM_API_KEY
    if (!apiKey) {
      console.warn('[ai.ts] NVIDIA_NIM_API_KEY not set — returning fallback')
      return FALLBACK
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(result) },
        ],
        temperature: 0.3,   // faithful narration of fixed facts, not creative variation
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(15_000),  // 15s hard limit — demo must not hang
    })

    if (!response.ok) {
      console.error('[ai.ts] API error:', response.status, await response.text())
      return FALLBACK
    }

    const data = await response.json()
    const raw: string = data.choices?.[0]?.message?.content ?? ''

    // Strip markdown fences — models sometimes wrap JSON in ```json blocks
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    return JSON.parse(cleaned) as ExplanationResult
  } catch (err) {
    console.error('[ai.ts] generateExplanation failed:', err)
    return FALLBACK
  }
}
