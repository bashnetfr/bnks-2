// ================================================================
// Ed-Vantage — Raw scraped item → Event normalization
//
// Promotes loosely-shaped RawScrapedEvent items into full Event
// records. Anything that would require guessing a required field
// (date, title) is dropped instead of fabricated.
// ================================================================

import type {
  Event,
  EventType,
  EventFormat,
  RegistrationFee,
} from '../types'
import type { RawScrapedEvent, ScraperMeta } from './types'

// ---------------------------------------------------------------
// District inference (Nepal city/venue text → district + province)
// ---------------------------------------------------------------

const DISTRICT_HINTS: Array<{ district: string; province: string; aliases: string[] }> = [
  { district: 'Kathmandu', province: 'Bagmati', aliases: ['kathmandu', 'ktm', 'thapathali', 'pulchowk', 'naxal', 'kamalpokhari', 'baneshwar', 'budhanilkantha', 'baluwatar', 'lalitpur border'] },
  { district: 'Lalitpur', province: 'Bagmati', aliases: ['lalitpur', 'patan', 'jawlakhel', 'kupondole', 'sanepa'] },
  { district: 'Bhaktapur', province: 'Bagmati', aliases: ['bhaktapur', 'suryabinayak', 'thimi'] },
  { district: 'Kavre', province: 'Bagmati', aliases: ['kavre', 'dhulikhel', 'banepa', 'ku dhulikhel'] },
  { district: 'Kaski', province: 'Gandaki', aliases: ['kaski', 'pokhara', 'lakeside'] },
  { district: 'Chitwan', province: 'Bagmati', aliases: ['chitwan', 'bharatpur', 'narayanghat', 'sauraha'] },
  { district: 'Morang', province: 'Koshi', aliases: ['morang', 'biratnagar'] },
  { district: 'Sunsari', province: 'Koshi', aliases: ['sunsari', 'dharan', 'itahari'] },
  { district: 'Rupandehi', province: 'Lumbini', aliases: ['rupandehi', 'butwal', 'siddharthanagar', 'bhairahawa'] },
  { district: 'Parsa', province: 'Madhesh', aliases: ['parsa', 'birgunj', 'birganj'] },
  { district: 'Banke', province: 'Lumbini', aliases: ['banke', 'nepalgunj'] },
  { district: 'Makwanpur', province: 'Bagmati', aliases: ['makwanpur', 'hetauda'] },
]

export function inferDistrict(
  text: string | undefined,
  fallbackDistrict: string
): { district: string; province: string } {
  const haystack = (text ?? '').toLowerCase()
  for (const hint of DISTRICT_HINTS) {
    if (hint.aliases.some((alias) => haystack.includes(alias))) {
      return { district: hint.district, province: hint.province }
    }
  }
  return { district: fallbackDistrict, province: fallbackDistrict === 'Kathmandu' ? 'Bagmati' : 'Unknown' }
}

/** True when the location/format text implies an online-only event */
export function isInOnlineFormat(text: string | undefined): boolean {
  const haystack = (text ?? '').toLowerCase()
  return /\bonline\b|\bvirtual\b|\bzoom\b|google meet|ms teams/.test(haystack)
}

// ---------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

const NPT_OFFSET = '+05:45'

function atMorning(y: number, m: number, d: number): string {
  // 09:00 NPT default start when the source only gives a date
  return new Date(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T09:00:00${NPT_OFFSET}`).toISOString()
}

function atEvening(y: number, m: number, d: number): string {
  return new Date(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T17:00:00${NPT_OFFSET}`).toISOString()
}

/**
 * Parse human date text commonly seen on Nepali event pages:
 *  - "5-8 July, 2026" / "April 25-26, 2026"
 *  - "Saturday, Aug 16" / "Aug 16, 2026" / "16 August 2026"
 * Returns null for recurring words ("Monthly") or unparseable text.
 */
export function parseDateText(text: string | undefined): { start: string; end: string } | null {
  if (!text) return null
  const clean = text.replace(/\s+/g, ' ').trim()
  if (/monthly|weekly|daily|every /i.test(clean)) return null

  const now = new Date()
  let year = now.getUTCFullYear()

  const explicitYear = clean.match(/\b(20\d{2})\b/)
  if (explicitYear) year = Number(explicitYear[1])

  // "5-8 July, 2026" or "25-26 Apr 2026"
  const range = clean.match(/\b(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]{3,9})/)
  if (range) {
    const month = MONTHS[range[3].slice(0, 3).toLowerCase()]
    if (month !== undefined) {
      const d1 = Number(range[1])
      const d2 = Number(range[2])
      return { start: atMorning(year, month, d1), end: atEvening(year, month, d2) }
    }
  }

  // "Aug 16" / "Aug 16, 2026"
  const mdy = clean.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})\b/)
  if (mdy) {
    const month = MONTHS[mdy[1].slice(0, 3).toLowerCase()]
    if (month !== undefined) {
      const day = Number(mdy[2])
      // No explicit year and the month already passed → assume next occurrence
      if (!explicitYear && month < now.getUTCMonth()) year += 1
      return { start: atMorning(year, month, day), end: atEvening(year, month, day) }
    }
  }

  // "16 August 2026"
  const dmy = clean.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\b/)
  if (dmy) {
    const month = MONTHS[dmy[2].slice(0, 3).toLowerCase()]
    if (month !== undefined) {
      const day = Number(dmy[1])
      if (!explicitYear && month < now.getUTCMonth()) year += 1
      return { start: atMorning(year, month, day), end: atEvening(year, month, day) }
    }
  }

  return null
}

// ---------------------------------------------------------------
// Fee / classification helpers
// ---------------------------------------------------------------

export function parseFee(priceText: string | undefined, isFreeHint?: boolean): RegistrationFee {
  if (isFreeHint || /\bfree\b/i.test(priceText ?? '')) return 0
  const match = (priceText ?? '').match(/(?:npr|rs\.?|रू)\s*([\d,]+(?:\.\d+)?)/i)
  if (match) {
    const value = Number(match[1].replace(/,/g, ''))
    if (!Number.isNaN(value)) return value
  }
  const bare = (priceText ?? '').match(/^\s*[\d,]+(?:\.\d+)?\s*$/)
  if (bare) {
    const value = Number(bare[0].replace(/,/g, ''))
    if (!Number.isNaN(value)) return value
  }
  return null
}

export function classifyEventType(text: string): EventType {
  const t = text.toLowerCase()
  if (t.includes('hackathon')) return 'hackathon'
  if (t.includes('bootcamp')) return 'bootcamp'
  if (t.includes('workshop') || t.includes('training')) return 'workshop'
  if (t.includes('conference') || t.includes('summit')) return 'conference'
  if (t.includes('seminar') || t.includes('webinar') || t.includes('talk') || t.includes('recap')) return 'seminar'
  if (t.includes('career') || t.includes('job fair') || t.includes('internship fair')) return 'career_event'
  if (t.includes('volunteer')) return 'volunteering'
  if (t.includes('meetup') || t.includes('networking') || t.includes('community night')) return 'networking'
  if (t.includes('competition') || t.includes('contest') || t.includes('olympiad') || t.includes('championship') || t.includes('ideathon') || t.includes('robowar') || t.includes('robo-war') || t.includes('ctf')) return 'competition'
  if (t.includes('fest') || t.includes('expo') || t.includes('exhibition')) return 'other'
  return 'other'
}

// ---------------------------------------------------------------
// Main normalizer
// ---------------------------------------------------------------

function stableHash(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

/**
 * Promote raw items to Events. Drops items without a parseable start
 * date — an undated listing can't drive registration-deadline logic.
 */
export function normalizeRawEvents(
  rawEvents: RawScrapedEvent[],
  meta: ScraperMeta,
  scrapedOn: Date = new Date()
): Event[] {
  const today = scrapedOn.toISOString().slice(0, 10)
  const events: Event[] = []
  const seen = new Set<string>()

  for (const raw of rawEvents) {
    if (!raw.title) continue

    const dates = raw.startsAt
      ? {
          start: new Date(raw.startsAt).toISOString(),
          end: raw.endsAt ? new Date(raw.endsAt).toISOString() : raw.startsAt,
        }
      : parseDateText(raw.dateText)
    if (!dates || Number.isNaN(new Date(dates.start).getTime())) continue

    // Skip events that clearly ended in the past
    if (dates.end.slice(0, 10) < today) continue

    const key = `${raw.title.toLowerCase()}|${dates.start.slice(0, 10)}`
    if (seen.has(key)) continue
    seen.add(key)

    const locText = [raw.locationText, raw.venue].filter(Boolean).join(', ') || undefined
    const online = isInOnlineFormat(locText) || isInOnlineFormat(raw.title)
    const place = inferDistrict(locText ?? raw.description, meta.defaultDistrict)

    const description =
      raw.description ??
      `Live listing scraped from ${meta.label}. See the source page for full details.`

    events.push({
      id: `live-${meta.id}-${stableHash(key)}`,
      title: raw.title,
      description: description.replace(/\s+/g, ' ').trim().slice(0, 600),
      organizationId: `org-live-${meta.id}`,
      eventType: classifyEventType(`${raw.title} ${raw.description ?? ''}`),
      category: meta.label,
      location: online ? 'Online' : (raw.locationText ?? place.district),
      district: place.district,
      province: place.province,
      venue: online ? undefined : raw.venue,
      format: online ? 'online' : raw.venue ? 'physical' : 'unknown',
      startDatetime: dates.start,
      endDatetime: dates.end,
      registrationDeadline: dates.start.slice(0, 10),
      registrationUrl: raw.registrationUrl ?? raw.url ?? meta.sourceUrl,
      registrationUrlType: 'external',
      officialEventUrl: raw.url,
      eligibility: {
        educationLevels: ['school', 'see', 'plus_two', 'bachelors', 'masters', 'recent_graduate'],
        eligibilityNotes: 'Eligibility per organizer listing — verify on the source page before registering.',
      },
      participation: 'unknown',
      registrationFee: parseFee(raw.priceText),
      certificateAvailable: false,
      skills: [],
      benefits: [],
      sourceUrl: raw.url ?? meta.sourceUrl,
      sourceType: `web_scrape:${meta.id}`,
      verificationStatus: 'unverified',
      safetyFlags: ['auto_scraped'],
      lastVerified: today,
      status: 'upcoming',
    })
  }

  return events.sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))
}
