// ================================================================
// Ed-Vantage — Source adapter: Kathmandu University Computer Club
//
// kucc.ku.edu.np lists flagship activities (IT Meet, Software Freedom
// Day, NCCI) as undated cards. Items without any parseable date are
// filtered out by the normalizer, so this adapter currently acts as a
// discovery feed that only yields events once KUCC publishes dates on
// the homepage cards.
// ================================================================

import * as cheerio from 'cheerio'
import { cleanText, fetchText } from './fetch-utils'
import type { RawScrapedEvent, RegisteredScraper, ScrapeOutcome } from './types'

const SOURCE_URL = 'https://kucc.ku.edu.np/'

const META = {
  id: 'kucc',
  label: 'KU Computer Club',
  sourceUrl: SOURCE_URL,
  defaultDistrict: 'Kavre', // KU main campus is in Dhulikhel, Kavre
  defaultProvince: 'Bagmati',
}

export const scrapeKucc = async (): Promise<ScrapeOutcome> => {
  const errors: string[] = []
  try {
    const html = await fetchText(SOURCE_URL)
    const $ = cheerio.load(html)

    const raw: RawScrapedEvent[] = []

    $('h3.tech-text').each((_, el) => {
      const title = cleanText($(el).text())
      if (!title) return

      // Sibling card layout: heading + description inside the same group box
      const container = $(el).closest('div.group')
      const description = cleanText(container.find('p.text-gray-400').first().text())

      // Look for any date-like text in the card; KUCC cards usually have none,
      // in which case the normalizer drops the item.
      const dateText = cleanText(container.find('span, div').text())?.match(
        /\d{1,2}\s*[A-Za-z]{3,9}[\s,-]*20\d{2}|[A-Za-z]{3,9}\s+\d{1,2},?\s*20\d{2}/
      )?.[0]

      raw.push({
        title,
        description,
        locationText: 'Kathmandu University, Dhulikhel',
        venue: 'Kathmandu University',
        dateText,
      })
    })

    return { events: raw, errors }
  } catch (err) {
    errors.push(`kucc: ${err instanceof Error ? err.message : String(err)}`)
    return { events: [], errors }
  }
}

export const kuccScraper: RegisteredScraper = { meta: META, run: scrapeKucc }
