// ================================================================
// Ed-Vantage — Shared fetch helpers for source adapters
// ================================================================

const USER_AGENT =
  'Mozilla/5.0 (compatible; EdVantageEventsBot/1.0; student event discovery)'

/** Fetch a page as UTF-8 text with a timeout and browser-ish UA */
export async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`)
    }
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

/** Resolve a possibly-relative href against the page it was found on */
export function absoluteUrl(href: string | undefined, baseUrl: string): string | undefined {
  if (!href) return undefined
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return undefined
  }
}

/** Collapse whitespace so scraped titles/descriptions are clean */
export function cleanText(input: string | undefined | null): string | undefined {
  if (!input) return undefined
  const collapsed = input.replace(/\s+/g, ' ').trim()
  return collapsed.length > 0 ? collapsed : undefined
}
