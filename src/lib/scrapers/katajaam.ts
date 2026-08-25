// ================================================================
// Ed-Vantage — Source adapter: katajaam.com (Kathmandu events aggregator)
//
// The listing page embeds a schema.org ItemList of Event objects as
// JSON-LD. We filter that feed down to tech/education-relevant events
// since the site also lists theatre, music and lifestyle happenings.
// ================================================================

import * as cheerio from 'cheerio'
import { cleanText, fetchText } from './fetch-utils'
import type { RawScrapedEvent, RegisteredScraper, ScrapeOutcome } from './types'

const SOURCE_URL = 'https://katajaam.com/events/tech-meetups'

const META = {
  id: 'katajaam',
  label: 'Kata Jaam',
  sourceUrl: SOURCE_URL,
  defaultDistrict: 'Kathmandu',
  defaultProvince: 'Bagmati',
}

/** Keep only listings plausibly relevant to students of tech/school competitions */
const INCLUDE =
  /\b(hackathon|hack\s?fest|coding|code\s?(contest|challenge|sprint)|programming|programmer|developer|devfest|pycon|technology|\btech\b|artificial\s+intelligence|\bAI\b|machine\s+learning|robotics|startup|entrepreneur|innovation|cybersecurity|\bcyber\b|\bcloud\b|\bctf\b|\biot\b|engineering|\bscience\b|\bstem\b|olympiad|bootcamp|game\s?dev|quiz|\bdebate\b|model\s+united\s+nations|digital\s+literacy)\b/i

/** Non-tech happenings that often mention tech words in passing */
const EXCLUDE =
  /\b(auto\s?show|concert|reggae|bhajan|kathak|theatre|theater|embroidery|fashion|\bmusic\b|\bdance\b|comedy|food\s?festival|club\s?night|party|yoga|trekking|animal\s+rights)\b/i

function isTechRelevant(title: string, description: string | undefined): boolean {
  const haystack = `${title} ${description ?? ''}`
  return INCLUDE.test(haystack) && !EXCLUDE.test(haystack)
}

interface JsonLdEvent {
  name?: string
  url?: string
  description?: string
  startDate?: string
  endDate?: string
  isAccessibleForFree?: boolean
  location?: {
    name?: string
    address?: { addressLocality?: string; streetAddress?: string }
  }
  organizer?: { name?: string }
}

function collectJsonLdEvents(html: string): JsonLdEvent[] {
  const $ = cheerio.load(html)
  const found: JsonLdEvent[] = []

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text()
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }

    const visit = (node: unknown): void => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        node.forEach(visit)
        return
      }
      const obj = node as Record<string, unknown>
      if (obj['@type'] === 'Event') {
        found.push(obj as JsonLdEvent)
      } else if (obj['@type'] === 'ItemList' && Array.isArray(obj['itemListElement'])) {
        for (const entry of obj['itemListElement'] as Array<Record<string, unknown>>) {
          const item = entry?.item
          if (item && typeof item === 'object') visit(item)
        }
      }
    }
    visit(parsed)
  })

  return found
}

export const scrapeKataJaam = async (): Promise<ScrapeOutcome> => {
  const errors: string[] = []
  try {
    const html = await fetchText(SOURCE_URL)
    const jsonLdEvents = collectJsonLdEvents(html)

    const raw: RawScrapedEvent[] = []
    for (const ev of jsonLdEvents) {
      const title = cleanText(ev.name)
      if (!title || !isTechRelevant(title, ev.description)) continue

      const locParts = [ev.location?.name, ev.location?.address?.addressLocality]
        .map((part) => cleanText(part))
        .filter(Boolean)

      raw.push({
        title,
        description: cleanText(ev.description)?.slice(0, 600),
        url: ev.url,
        registrationUrl: ev.url,
        locationText: locParts.join(', ') || undefined,
        startsAt: ev.startDate,
        endsAt: ev.endDate,
        priceText: ev.isAccessibleForFree ? 'Free' : undefined,
        organizerName: cleanText(ev.organizer?.name),
      })
    }

    return { events: raw, errors }
  } catch (err) {
    errors.push(`katajaam: ${err instanceof Error ? err.message : String(err)}`)
    return { events: [], errors }
  }
}

export const katajaamScraper: RegisteredScraper = { meta: META, run: scrapeKataJaam }
