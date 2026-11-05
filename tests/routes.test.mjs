import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUTES, routesFor, hubUrls, prefixes, flatUrl, SEGMENT_TYPES } from "../plugins/99-website/scripts/lib/routes.mjs";

test("language code picks the route table, regions and underscores included", () => {
  assert.equal(routesFor("sv").services, "tjanster");
  assert.equal(routesFor("sv-SE").areas, "omraden");
  assert.equal(routesFor("SV_se").blog, "blogg");
  assert.equal(routesFor("en").services, "services");
});

test("unknown or missing language falls back to English", () => {
  for (const l of ["de", "", undefined, null]) assert.deepEqual(routesFor(l), ROUTES.en);
});

test("hub urls, prefixes and flat urls follow the table", () => {
  const sv = routesFor("sv");
  assert.deepEqual(hubUrls(sv), ["/tjanster/", "/omraden/", "/blogg/"]);
  assert.deepEqual(prefixes(sv), { service: "/tjanster/", area: "/omraden/", blog: "/blogg/" });
  assert.equal(flatUrl(sv, "legal"), "/integritetspolicy/");
  assert.equal(flatUrl(routesFor("en"), "about"), "/about/");
});

test("every language has every route, and the segment map covers all of them", () => {
  const keys = Object.keys(ROUTES.en).sort();
  for (const r of Object.values(ROUTES)) assert.deepEqual(Object.keys(r).sort(), keys);
  assert.equal(SEGMENT_TYPES.tjanster, "service");
  assert.equal(SEGMENT_TYPES["areas-served"], "area");
  assert.equal(SEGMENT_TYPES.blogg, "blog");
});
