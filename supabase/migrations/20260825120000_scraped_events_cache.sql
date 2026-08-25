-- Ed-Vantage - Scraped Events Cache
-- Server-side scrapers fetch live event data from Nepali organizer sites.
-- Results are stored here as one JSONB snapshot per source so /api/events
-- can serve live data without re-scraping on every request.

CREATE TABLE IF NOT EXISTS public.scraped_events_cache (
    source_id TEXT PRIMARY KEY,
    source_url TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '[]'::jsonb,
    event_count INTEGER NOT NULL DEFAULT 0,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS: deny-all for anon/authenticated clients — this table is only
-- accessed through server routes using the service-role key.
ALTER TABLE public.scraped_events_cache ENABLE ROW LEVEL SECURITY;
