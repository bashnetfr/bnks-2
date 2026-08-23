import { NextRequest, NextResponse } from 'next/server'
import { filterEvents } from '@/lib/events'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const events = filterEvents({
    q: searchParams.get('q') ?? undefined,
    eventType: searchParams.get('type') ?? undefined,
    district: searchParams.get('district') ?? undefined,
    format: searchParams.get('format') ?? undefined,
    freeOnly: searchParams.get('free') === 'true',
    educationLevel: searchParams.get('education') ?? undefined,
    teamOnly: searchParams.get('team') === 'true',
    verifiedOnly: searchParams.get('verified') === 'true',
  })

  return NextResponse.json({
    success: true,
    data: events,
    count: events.length,
  })
}
