// URL parts per site language. One table: the sitemap validator, site-data.mjs, the scaffold and the
// Lighthouse gate all read it, so a Swedish site gets /tjanster/ and an English one /services/.
// The language comes from `language_code` in business/client.md ("sv", "sv-SE" and "sv_SE" all mean sv).
// An unknown language falls back to English.
export const ROUTES = {
  en: { services: "services", areas: "areas-served", blog: "blog", about: "about", contact: "contact", legal: "privacy-policy", thanks: "thanks" },
  sv: { services: "tjanster", areas: "omraden", blog: "blogg", about: "om-oss", contact: "kontakt", legal: "integritetspolicy", thanks: "tack" },
};

export const routesFor = (languageCode) =>
  ROUTES[String(languageCode || "").toLowerCase().split(/[-_]/)[0]] ?? ROUTES.en;

export const hubUrls = (r) => [r.services, r.areas, r.blog].map((s) => `/${s}/`);
export const prefixes = (r) => ({ service: `/${r.services}/`, area: `/${r.areas}/`, blog: `/${r.blog}/` });
// Page types that live one level deep: about, contact, legal.
export const flatUrl = (r, type) => `/${r[type]}/`;

// Every segment any language uses for a hub, mapped to the page type of its children.
export const SEGMENT_TYPES = Object.fromEntries(
  Object.values(ROUTES).flatMap((r) => [[r.services, "service"], [r.areas, "area"], [r.blog, "blog"]]),
);
