// ================================================================
// GET /api/events/scrape — run all source adapters and cache results
//
// - Skips scraping when every cached source is fresher than TTL
//   (pass ?force=1 to override).
// - Only replaces cached snapshots when the combined run yields at
//   least MIN_LIVE_EVENTS valid upcoming events, so a partial scrape
//   failure never wipes good data (curated fallback stays intact).
// ================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SCRAPERS, normalizeRawEvents } from '@/lib/scrapers'
import type { Event } from '@/lib/types'

const CACHE_TTL_HOURS = 6
const MIN_LIVE_EVENTS = 5

interface CacheRow {
  source_id: string
  source_url: string
  payload: Event[]
  event_count: number
  fetched_at: string
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function readCache(): Promise<CacheRow[]> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('scraped_events_cache')
    .select('source_id, source_url, payload, event_count, fetched_at')
  if (error) throw new Error(`cache read failed: ${error.message}`)
  return (data ?? []) as CacheRow[]
}

function isFresh(row: CacheRow): boolean {
  const ageMs = Date.now() - new Date(row.fetched_at).getTime()
  return ageMs < CACHE_TTL_HOURS * 60 * 60 * 1000
}

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get('force') === '1'

  let previous: CacheRow[] = []
  try {
    previous = await readCache()
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }

  // TTL short-circuit — everything fresh and caller didn't force
  const staleSources = SCRAPERS.filter((scraper) => {
    const row = previous.find((r) => r.source_id === scraper.meta.id)
    return !row || !isFresh(row)
  })
  if (!force && staleSources.length === 0) {
    const total = previous.reduce((sum, row) => sum + row.event_count, 0)
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: `all sources fresher than ${CACHE_TTL_HOURS}h`,
      totalLiveEvents: total,
      sources: previous.map((row) => ({ id: row.source_id, events: row.event_count, fetchedAt: row.fetched_at })),
    })
  }

  // Run all adapters in parallel; normalize per source
  const results = await Promise.all(
    SCRAPERS.map(async (scraper) => {
      const startedAt = Date.now()
      try {
        const outcome = await scraper.run()
        const normalized = normalizeRawEvents(outcome.events, scraper.meta)
        return {
          meta: scraper.meta,
          events: normalized,
          errors: outcome.errors,
          durationMs: Date.now() - startedAt,
        }
      } catch (err) {
        return {
          meta: scraper.meta,
          events: [] as Event[],
          errors: [err instanceof Error ? err.message : String(err)],
          durationMs: Date.now() - startedAt,
        }
      }
    })
  )

  const totalEvents = results.reduce((sum, result) => sum + result.events.length, 0)

  let replaced = false
  let writeError: string | null = null

  // Replace the live dataset only when this run stands on its own
  if (totalEvents >= MIN_LIVE_EVENTS) {
    const supabase = createServerSupabaseClient()
    const rows = results.map((result) => ({
      source_id: result.meta.id,
      source_url: result.meta.sourceUrl,
      payload: result.events,
      event_count: result.events.length,
      fetched_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('scraped_events_cache')
      .upsert(rows, { onConflict: 'source_id' })

    if (error) {
      writeError = error.message
    } else {
      replaced = true
    }
  }

  return NextResponse.json({
    success: true,
    replaced,
    writeError,
    minRequired: MIN_LIVE_EVENTS,
    totalLiveEvents: totalEvents,
    sources: results.map((result) => ({
      id: result.meta.id,
      label: result.meta.label,
      scraped: result.events.length,
      errors: result.errors,
      durationMs: result.durationMs,
    })),
  })
}
