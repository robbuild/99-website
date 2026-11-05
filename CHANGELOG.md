# Changelog

## 0.1.1 (Swedish routes)

- **URL parts follow the site language.** New `scripts/lib/routes.mjs` holds one table per language (`en`, `sv`). With `language_code: sv` in `business/client.md` the plan uses `/tjanster/`, `/omraden/`, `/blogg/`, `/om-oss/`, `/kontakt/`, `/integritetspolicy/` and `/tack/`. Unknown languages fall back to English.
- `validate-sitemap.mjs` reads the language from `../business/client.md` (or `--lang sv`) instead of requiring English prefixes.
- `site-data.mjs` writes `lang` and `routes` into `site.json`, taken from the plan, so templates never hard-code a page URL.
- `scaffold-site.mjs` names the thank-you page after the language (`tack.astro` for Swedish); the starter's Header, Footer, CtaBand, 404 and contact function read `site.routes`.
- `lighthouse-gate.mjs` guesses page types for Swedish hub segments in sitemap mode.
- Skills `keyword-sitemap`, `astro-build` and `seo-foundation` describe the language-aware URLs and `site.routes`.
- Tests: `routes.test.mjs` plus Swedish cases in the validator, site-data, scaffold and gate tests.

## 0.1.0 (2026-09-29, Stage 1)

Tested end to end on two sites: a real rebuild (myinclusion.com.au, NDIS, Australia) and a fictional new build (Cedar & Stone Landscapes, Charlotte NC).

- **setup-check**: local checks (Node, Cloudflare login, Lighthouse, Chrome, keys, design skills) plus DataWise, DataForSEO, fal and treg connection checks. Picks the keyword data path (DataWise, DataForSEO or manual) and saves `.99-website/setup.json`.
- **business-intake**: new build (one-question-at-a-time interview) or rebuild (crawl the old site, pull Search Console through DataWise, ask only the gaps in one list). Treats old site copy and notes as claims, flags testimonials, ratings and years claims, sensitive-niche rules (NDIS), demo-business mode. Ends at Checkpoint 1.
- **keyword-sitemap**: seeds from services and GSC queries, DataWise `suggestions` + metrics, live SERP reads, a 4-part publication gate, one keyword per page, rebuilds keep URLs that already rank, blog plan, redirect map. Ends at Checkpoint 2.
- Scripts (zero dependencies, `node:test`): `doctor.mjs`, `site-init.mjs`, `confirm-count.mjs`, `crawl.mjs`, `validate-sitemap.mjs` (with `--crawl` for rebuilds), `validate-redirects.mjs`, `lib/csv.mjs`.
