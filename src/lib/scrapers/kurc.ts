// ================================================================
// Ed-Vantage — Source adapter: Kathmandu University Robotics Club
//
// kurc.ku.edu.np renders dated event cards server-side:
//   article.event-card > h3.event-card-title / p.event-card-description
//   .event-meta-item spans (date text, venue) + a.event-card-link
// ================================================================

import * as cheerio from 'cheerio'
import { absoluteUrl, cleanText, fetchText } from './fetch-utils'
import type { RawScrapedEvent, RegisteredScraper, ScrapeOutcome } from './types'

const SOURCE_URL = 'https://kurc.ku.edu.np/'

const META = {
  id: 'kurc',
  label: 'KU Robotics Club',
  sourceUrl: SOURCE_URL,
  defaultDistrict: 'Kavre', // KU main campus is in Dhulikhel, Kavre
  defaultProvince: 'Bagmati',
}

export const scrapeKurc = async (): Promise<ScrapeOutcome> => {
  const errors: string[] = []
  try {
    const html = await fetchText(SOURCE_URL)
    const $ = cheerio.load(html)

    const raw: RawScrapedEvent[] = []

    $('article.event-card').each((_, card) => {
      const el = $(card)
      const title = cleanText(el.find('.event-card-title').first().text())
      if (!title) return

      const description = cleanText(el.find('.event-card-description').first().text())

      // Meta items are [date-ish text, venue] in page order
      const metaTexts = el
        .find('.event-meta-item span')
        .map((_, s) => cleanText($(s).text()))
        .get()
        .filter(Boolean) as string[]
      const dateText = metaTexts.find((t) => /\d|month|weekly|annual/i.test(t))
      const venue = metaTexts.find((t) => t !== dateText)

      raw.push({
        title,
        description,
        url: absoluteUrl(el.find('a.event-card-link').attr('href'), SOURCE_URL),
        registrationUrl: undefined,
        venue,
        locationText: venue ? `${venue}, Dhulikhel` : 'KU Dhulikhel',
        dateText,
      })
    })

    return { events: raw, errors }
  } catch (err) {
    errors.push(`kurc: ${err instanceof Error ? err.message : String(err)}`)
    return { events: [], errors }
  }
}

export const kurcScraper: RegisteredScraper = { meta: META, run: scrapeKurc }
