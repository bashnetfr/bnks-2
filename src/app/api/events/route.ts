// GET /api/events — serves live scraped events when a scrape run has
// populated the cache, falling back to the curated dataset otherwise.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { EVENTS, applyFilters } from '@/lib/events'
import type { Event } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function loadLiveEvents(): Promise<Event[]> {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('scraped_events_cache')
      .select('payload')
    if (error || !data || data.length === 0) return []

    const merged: Event[] = []
    const seen = new Set<string>()
    for (const row of data as Array<{ payload: Event[] }>) {
      for (const event of row.payload ?? []) {
        const key = `${event.title.toLowerCase()}|${event.startDatetime.slice(0, 10)}`
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(event)
      }
    }
    return merged.sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))
  } catch {
    // Service-role key missing or DB unreachable — curated fallback applies
    return []
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const liveEvents = await loadLiveEvents()
  const source = liveEvents.length > 0 ? 'live' : 'curated'

  const events = applyFilters(liveEvents.length > 0 ? liveEvents : EVENTS, {
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
    source,
    data: events,
    count: events.length,
  })
}
