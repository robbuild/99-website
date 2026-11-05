import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSiteMap, SITEMAP_COLUMNS } from "../plugins/99-website/scripts/validate-sitemap.mjs";
import { toCsv } from "../plugins/99-website/scripts/lib/csv.mjs";

const row = (o) => ({ url: "", slug: "", page_name: "", title_tag: "", page_type: "", parent: "", target_keyword: "",
  volume: "", kd: "", intent: "", primary_cta: "call", phase: "now", data_source: "datawise", notes: "", ...o });
const GOOD = [
  row({ url: "/", slug: "home", page_name: "Home", title_tag: "NDIS Support Melbourne | My Inclusion", page_type: "home", target_keyword: "ndis support melbourne", volume: "320", kd: "12", intent: "commercial" }),
  row({ url: "/services/", slug: "services", page_name: "Services", title_tag: "Our NDIS Services | My Inclusion", page_type: "hub", parent: "/" }),
  row({ url: "/services/support-coordination/", slug: "support-coordination", page_name: "Support Coordination", title_tag: "NDIS Support Coordination, Melbourne | My Inclusion", page_type: "service", parent: "/services/", target_keyword: "ndis support coordination", volume: "0", kd: "", intent: "transactional" }),
  row({ url: "/contact/", slug: "contact", page_name: "Contact", title_tag: "Contact My Inclusion", page_type: "contact", parent: "/" }),
];
const csv = (rows) => toCsv(SITEMAP_COLUMNS, rows);
const fields = (res) => res.errors.map((e) => `${e.row}:${e.field}`);

test("a clean plan passes", () => {
  const res = validateSiteMap(csv(GOOD));
  assert.deepEqual(res.errors, []);
});

test("zero volume and blank KD are valid, estimates are not", () => {
  const bad = GOOD.map((r, i) => (i === 2 ? { ...r, volume: "~50", kd: "est. 20" } : r));
  assert.deepEqual(fields(validateSiteMap(csv(bad))).sort(), ["4:kd", "4:volume"]);
});

test("one keyword per page", () => {
  const dup = [...GOOD, row({ url: "/blog/what-is-support-coordination/", slug: "what-is-support-coordination", page_name: "Post", title_tag: "What Is Support Coordination?", page_type: "blog", parent: "/", target_keyword: "NDIS  Support Coordination", intent: "informational" })];
  const res = validateSiteMap(csv(dup));
  assert.ok(res.errors.some((e) => e.field === "target_keyword" && /already used on row 4/.test(e.message)));
});

test("title rules: 60 chars, no em dash, unique", () => {
  const long = GOOD.map((r, i) => (i === 3 ? { ...r, title_tag: "Contact \u2014 " + "x".repeat(60) } : r));
  const msgs = validateSiteMap(csv(long)).errors.filter((e) => e.field === "title_tag").map((e) => e.message).join(" | ");
  assert.match(msgs, /max 60/);
  assert.match(msgs, /em dash/);
});

test("url rules per page type", () => {
  const bad = GOOD.map((r, i) => (i === 2 ? { ...r, url: "/Support_Coordination" } : r));
  assert.ok(validateSiteMap(csv(bad)).errors.some((e) => e.field === "url"));
  const wrongPrefix = GOOD.map((r, i) => (i === 2 ? { ...r, url: "/support-coordination/" } : r));
  assert.ok(validateSiteMap(csv(wrongPrefix)).errors.some((e) => /\/services\/\{slug\}\//.test(e.message)));
});

test("parent must exist, data_source must be single and valid", () => {
  const bad = GOOD.map((r, i) => (i === 2 ? { ...r, parent: "/nope/", data_source: "manual" } : r));
  const res = validateSiteMap(csv(bad));
  assert.ok(res.errors.some((e) => e.field === "parent"));
  assert.ok(res.errors.some((e) => /mixed sources/.test(e.message)));
});

test("an unquoted comma shifts columns and is reported", () => {
  const text = csv(GOOD).replace("Contact My Inclusion", "Contact, My Inclusion").replace('"Contact, My Inclusion"', "Contact, My Inclusion");
  assert.ok(validateSiteMap(text).errors.some((e) => e.field === "row"));
});

test("missing columns stop validation with one clear error", () => {
  const res = validateSiteMap("url,slug\n/,home\n");
  assert.equal(res.errors.length, 1);
  assert.match(res.errors[0].message, /missing columns/);
});

test("rebuild: URLs the old site already has keep their path, new ones follow the pattern", () => {
  const rows = [...GOOD,
    row({ url: "/locations/", slug: "locations", page_name: "Locations", title_tag: "Where We Support You | My Inclusion", page_type: "hub", parent: "/" }),
    row({ url: "/locations/box-hill/", slug: "box-hill", page_name: "Box Hill", title_tag: "NDIS Support Box Hill | My Inclusion", page_type: "area", parent: "/locations/", target_keyword: "ndis box hill", intent: "commercial" }),
    row({ url: "/locations/kew/", slug: "kew", page_name: "Kew", title_tag: "NDIS Support Kew | My Inclusion", page_type: "area", parent: "/locations/", target_keyword: "ndis kew", intent: "commercial" }),
  ];
  const text = csv(rows);
  assert.ok(validateSiteMap(text).errors.some((e) => e.field === "url"), "new build: /locations/ breaks the pattern");
  const res = validateSiteMap(text, { existingPaths: ["/", "/locations/", "/locations/box-hill/"] });
  const urlErrs = res.errors.filter((e) => e.field === "url");
  assert.equal(urlErrs.length, 1, JSON.stringify(urlErrs));
  assert.equal(urlErrs[0].row, 8, "only /locations/kew/ (not on the old site) must follow the pattern");
});

test("title must contain the target keyword, in its first half", () => {
  const bad = GOOD.map((r, i) => (i === 2 ? { ...r, target_keyword: "pavers charlotte nc", title_tag: "Paver Patios Charlotte NC: Walkways | Cedar" } : r));
  assert.ok(validateSiteMap(csv(bad)).errors.some((e) => e.field === "title_tag" && /keyword/.test(e.message)));
  const late = GOOD.map((r, i) => (i === 2 ? { ...r, title_tag: "Trusted Local Help With Plans: NDIS Support Coordination" } : r));
  assert.ok(validateSiteMap(csv(late)).errors.some((e) => e.field === "title_tag" && /first half/.test(e.message)));
  const ok = GOOD.map((r, i) => (i === 2 ? { ...r, target_keyword: "pavers charlotte nc", title_tag: "Pavers Charlotte NC: Patios and Walkways" } : r));
  assert.deepEqual(validateSiteMap(csv(ok)).errors, []);
});

const SV = [
  row({ url: "/", slug: "home", page_name: "Startsida", title_tag: "Rörmokare Uppsala | Lindqvist Rör", page_type: "home", target_keyword: "rörmokare uppsala", volume: "880", kd: "0", intent: "commercial" }),
  row({ url: "/tjanster/", slug: "tjanster", page_name: "Tjänster", title_tag: "Tjänster | Lindqvist Rör", page_type: "hub", parent: "/" }),
  row({ url: "/tjanster/stambyte/", slug: "stambyte", page_name: "Stambyte", title_tag: "Stambyte Uppsala | Lindqvist Rör", page_type: "service", parent: "/tjanster/", target_keyword: "stambyte", volume: "2400", kd: "12", intent: "informational" }),
  row({ url: "/omraden/", slug: "omraden", page_name: "Områden", title_tag: "Områden | Lindqvist Rör", page_type: "hub", parent: "/" }),
  row({ url: "/omraden/knivsta/", slug: "knivsta", page_name: "Knivsta", title_tag: "Rörmokare Knivsta | Lindqvist Rör", page_type: "area", parent: "/omraden/", target_keyword: "rörmokare knivsta", volume: "90", kd: "0", intent: "commercial" }),
  row({ url: "/blogg/", slug: "blogg", page_name: "Blogg", title_tag: "Blogg | Lindqvist Rör", page_type: "hub", parent: "/" }),
  row({ url: "/blogg/vattenlacka/", slug: "vattenlacka", page_name: "Vattenläcka", title_tag: "Vattenläcka: så agerar du | Lindqvist Rör", page_type: "blog", parent: "/blogg/", target_keyword: "vattenläcka", volume: "880", kd: "0", intent: "informational" }),
  row({ url: "/om-oss/", slug: "om-oss", page_name: "Om oss", title_tag: "Om Lindqvist Rör", page_type: "about", parent: "/" }),
  row({ url: "/kontakt/", slug: "kontakt", page_name: "Kontakt", title_tag: "Kontakta Lindqvist Rör", page_type: "contact", parent: "/" }),
  row({ url: "/integritetspolicy/", slug: "integritetspolicy", page_name: "Integritetspolicy", title_tag: "Integritetspolicy | Lindqvist Rör", page_type: "legal", parent: "/" }),
];

test("a Swedish plan passes with lang sv, URL parts follow the language", () => {
  assert.deepEqual(validateSiteMap(csv(SV), { lang: "sv" }).errors, []);
  assert.deepEqual(validateSiteMap(csv(SV), { lang: "sv-SE" }).errors, []);
});

test("the same Swedish plan fails as English, and an English plan fails as Swedish", () => {
  assert.ok(validateSiteMap(csv(SV), { lang: "en" }).errors.some((e) => e.field === "url"));
  assert.ok(validateSiteMap(csv(GOOD), { lang: "sv" }).errors.some((e) => /\/tjanster\//.test(e.message) || /\/kontakt\//.test(e.message)));
});

test("about, contact and legal must sit on the language's own route", () => {
  const bad = SV.map((r) => (r.page_type === "contact" ? { ...r, url: "/contact/", slug: "contact" } : r));
  const res = validateSiteMap(csv(bad), { lang: "sv" });
  assert.ok(res.errors.some((e) => e.field === "url" && /\/kontakt\//.test(e.message)));
  assert.deepEqual(validateSiteMap(csv(bad), { lang: "sv", existingPaths: ["/contact/"] }).errors, []);
});

test("no lang means English, as before", () => {
  assert.deepEqual(validateSiteMap(csv(GOOD)).errors, []);
});
