import { NextRequest, NextResponse } from 'next/server'
import { generateExplanation } from '@/lib/ai'
import type { CompatibilityResult } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CompatibilityResult
    if (!body || !body.overallScore === undefined) {
      return NextResponse.json(
        { explanation: null, actionPlan: [], fallback: true },
        { status: 400 }
      )
    }

    const explanationResult = await generateExplanation(body)
    return NextResponse.json(explanationResult)
  } catch (error) {
    console.error('API /api/explain error:', error)
    return NextResponse.json({
      explanation: null,
      actionPlan: [],
      fallback: true,
    })
  }
}
