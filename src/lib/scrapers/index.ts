// ================================================================
// Ed-Vantage — Scraper source registry
// ================================================================

import type { RegisteredScraper } from './types'
import { katajaamScraper } from './katajaam'
import { kurcScraper } from './kurc'
import { gdgKathmanduScraper } from './gdg-kathmandu'
import { kuccScraper } from './kucc'

export const SCRAPERS: RegisteredScraper[] = [
  katajaamScraper,
  gdgKathmanduScraper,
  kurcScraper,
  kuccScraper,
]

export * from './types'
export { normalizeRawEvents, inferDistrict, parseDateText, parseFee, classifyEventType } from './normalize'
