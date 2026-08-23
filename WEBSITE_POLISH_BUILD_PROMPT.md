# Task: Website Technical & Reliability Polish

Read `MASTER_PROMPT.md` and `CLAUDE.md` first. This covers the public marketing site — not the authenticated dashboard or student survey, which have their own requirements in their own prompt files.

## Build these

- Custom 404 page
- `robots.txt`
- Unique page title + meta description per page
- A social share image (OG image)
- Alt text on every image
- A real thank-you page after any inquiry/demo-request form submission
- 5 real FAQs — cover: how scoring works and why it's transparent, how student data is handled, cost/pricing model, who this is actually for (NGOs/municipalities/school networks, not individual schools), and how this differs from just using the free World Bank ETRI tool directly
- A privacy policy page — **treat this as required, not optional.** This product collects real student data, and an NGO/municipality evaluating it will specifically want to see how that's handled before adopting.
- Internal links between marketing pages (pricing, FAQ, research/evidence section)

## Explicitly do not build

- Maps/directions, local business schema — this is remote B2B/B2G software with no physical location a user needs to find. If you add structured data at all, use `Organization` or `SoftwareApplication` schema, not `LocalBusiness`.
- Sticky mobile "call now" CTA, response-time promises — these are conversion patterns for a consumer making a fast, local, impulsive decision. The actual buyer here is doing considered institutional due diligence. A standard "Request a Demo" CTA is fine; the urgency-driven version isn't the right register.
- Breadcrumbs — the site's structure (marketing pages + dashboard + survey) is too flat to need them.
- A case studies or reviews section populated with anything that isn't a real pilot or customer yet. If you don't have one, leave the section out entirely rather than fill it with World Bank research reframed as if it validates the product — that research validates the *problem*, not this specific tool, and presenting it as a case study is a credibility risk if anyone checks. Keep a separate "Grounded in Research" section for the ETRI/Nepal citations instead.

## Done criteria

- Marketing site passes basic SEO hygiene (unique titles/descriptions, robots.txt, OG image, alt text).
- Privacy policy is real and specific to what this product actually collects (student survey data, school assessment data) — not generic boilerplate.
- Nothing built here touches the dashboard or student survey codebases.
