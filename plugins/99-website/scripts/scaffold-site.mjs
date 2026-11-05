#!/usr/bin/env node
// Copy templates/astro-starter into sites/<slug>/site. Never overwrites an existing file.
// The thank-you page is named after the site language (thanks.astro, or tack.astro for language_code sv).
//   node scaffold-site.mjs sites/<slug>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { routesFor, ROUTES } from "./lib/routes.mjs";
import { parseFrontMatter } from "./site-data.mjs";

const DEFAULT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../templates/astro-starter");
const SKIP = new Set(["node_modules", "dist", ".astro", ".wrangler"]);

function list(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (SKIP.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? list(p, base) : [path.relative(base, p)];
  });
}

export function scaffoldSite(siteDir, templateDir = DEFAULT, languageCode = "en") {
  const thanks = routesFor(languageCode).thanks;
  const dest = path.join(siteDir, "site");
  const created = [];
  const skipped = [];
  for (const rel of list(templateDir)) {
    const named = rel === path.join("src/pages", `${ROUTES.en.thanks}.astro`) ? path.join("src/pages", `${thanks}.astro`) : rel;
    const to = path.join(dest, named);
    if (fs.existsSync(to)) { skipped.push(rel); continue; }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(templateDir, rel), to);
    created.push(named);
  }
  return { created, skipped };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const siteDir = process.argv[2];
  if (!siteDir) { console.error("usage: node scaffold-site.mjs sites/<slug>"); process.exit(1); }
  const md = path.join(siteDir, "business/client.md");
  const lang = fs.existsSync(md) ? parseFrontMatter(fs.readFileSync(md, "utf8")).language_code || "en" : "en";
  const r = scaffoldSite(siteDir, undefined, lang);
  console.log(`created ${r.created.length}, skipped ${r.skipped.length} (existing files are never overwritten)`);
}
