// ================================================================
// Ed-Vantage — Web scraper framework types
//
// Each source adapter returns loosely-shaped RawScrapedEvent items;
// normalize.ts promotes them into full Event records from types.ts.
// Items that cannot satisfy required fields (e.g. no parseable date)
// are dropped rather than guessed (CLAUDE.md quality rules).
// ================================================================

/** Loose shape produced by source adapters before normalization */
export interface RawScrapedEvent {
  title: string
  description?: string
  /** Event detail or landing page URL */
  url?: string
  /** Direct registration URL if different from `url` */
  registrationUrl?: string
  venue?: string
  /** Free-text location as printed on the source site */
  locationText?: string
  /** Already-ISO datetime, when the source provides structured data */
  startsAt?: string
  endsAt?: string
  /** Raw date text like "5-8 July, 2026" for heuristic parsing */
  dateText?: string
  /** Raw price text like "Free" or "NPR 2,000" */
  priceText?: string
  organizerName?: string
}

export interface ScraperMeta {
  /** Stable identifier used as the cache key and event-id prefix */
  id: string
  label: string
  sourceUrl: string
  defaultDistrict: string
  defaultProvince: string
}

export interface ScrapeOutcome {
  events: RawScrapedEvent[]
  errors: string[]
}

export type ScraperFn = () => Promise<ScrapeOutcome>

export interface RegisteredScraper {
  meta: ScraperMeta
  run: ScraperFn
}
