// ================================================================
// Ed-Vantage — Source adapter: GDG Kathmandu (gdg.community.dev)
//
// The chapter page server-renders links to /events/details/... pages.
// Each detail page embeds a full schema.org Event JSON-LD block with
// structured dates, venue and registration offer URL.
// ================================================================

import * as cheerio from 'cheerio'
import { absoluteUrl, fetchText } from './fetch-utils'
import type { RawScrapedEvent, RegisteredScraper, ScrapeOutcome } from './types'

const CHAPTER_URL = 'https://gdg.community.dev/gdg-kathmandu/'
const MAX_DETAIL_PAGES = 8
const DETAIL_DELAY_MS = 400

const META = {
  id: 'gdg-kathmandu',
  label: 'GDG Kathmandu',
  sourceUrl: CHAPTER_URL,
  defaultDistrict: 'Kathmandu',
  defaultProvince: 'Bagmati',
}

interface JsonLdEvent {
  name?: string
  url?: string
  description?: string
  startDate?: string
  endDate?: string
  location?: { name?: string; address?: { addressLocality?: string; streetAddress?: string } }
  offers?: { url?: string }
}

function extractDetailLinks(html: string): string[] {
  const $ = cheerio.load(html)
  const links = new Set<string>()
  $('a[href*="/events/details/google-gdg-kathmandu-presents-"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      const resolved = absoluteUrl(href, CHAPTER_URL)
      if (resolved) links.add(resolved.split('?')[0])
    }
  })
  return [...links]
}

function extractJsonLdEvent(html: string): JsonLdEvent | null {
  const $ = cheerio.load(html)
  let result: JsonLdEvent | null = null
  $('script[type="application/ld+json"]').each((_, el) => {
    if (result) return
    try {
      const parsed = JSON.parse($(el).contents().text()) as Record<string, unknown>
      if (parsed['@type'] === 'Event') result = parsed as unknown as JsonLdEvent
    } catch {
      // ignore malformed blocks
    }
  })
  return result
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const scrapeGdgKathmandu = async (): Promise<ScrapeOutcome> => {
  const errors: string[] = []
  try {
    const chapterHtml = await fetchText(CHAPTER_URL)
    const detailLinks = extractDetailLinks(chapterHtml).slice(0, MAX_DETAIL_PAGES)
    if (detailLinks.length === 0) {
      errors.push('gdg-kathmandu: no event detail links found on chapter page')
      return { events: [], errors }
    }

    const raw: RawScrapedEvent[] = []
    for (const link of detailLinks) {
      try {
        await sleep(DETAIL_DELAY_MS)
        const detailHtml = await fetchText(link)
        const ev = extractJsonLdEvent(detailHtml)
        if (!ev?.name) continue

        const locParts = [ev.location?.name, ev.location?.address?.addressLocality]
          .map((part) => part?.trim())
          .filter(Boolean)

        raw.push({
          title: ev.name,
          description: ev.description?.replace(/\s+/g, ' ').slice(0, 600),
          url: link,
          registrationUrl: ev.offers?.url ?? undefined,
          locationText: locParts.join(', ') || undefined,
          venue: ev.location?.name || undefined,
          startsAt: ev.startDate,
          endsAt: ev.endDate,
          organizerName: 'Google Developer Groups Kathmandu',
        })
      } catch (err) {
        errors.push(`gdg-kathmandu detail ${link}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    return { events: raw, errors }
  } catch (err) {
    errors.push(`gdg-kathmandu: ${err instanceof Error ? err.message : String(err)}`)
    return { events: [], errors }
  }
}

export const gdgKathmanduScraper: RegisteredScraper = { meta: META, run: scrapeGdgKathmandu }
