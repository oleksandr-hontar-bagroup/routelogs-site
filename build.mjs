/**
 * Build the production site into /dist.
 *
 *   • minify + content-hash styles.css → styles-<hash>.css, app.js → app-<hash>.js
 *   • rewrite those references (root-absolute) in every HTML page
 *   • substitute %%SITE_URL%% (env SITE_URL, default https://routelogs.app)
 *   • minify HTML
 *   • copy fonts + brand assets + robots/sitemap/manifest/security.txt
 *
 * No network, no system tools — just esbuild + html-minifier-terser.
 */
import { rm, mkdir, readFile, writeFile, copyFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, "dist");
const r = (p) => resolve(root, p);
const d = (p) => resolve(dist, p);

const SITE_URL = (process.env.SITE_URL || "https://routelogs.app").replace(/\/+$/, "");
const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 8);
const sub = (s) => s.split("%%SITE_URL%%").join(SITE_URL);

const HTML_PAGES = ["index.html", "privacy.html", "terms.html", "404.html"];
const STATIC_AS_IS = [
  "favicon.svg", "favicon.ico", "apple-touch-icon.png",
  "icon-192.png", "icon-512.png", "og-image.png", "site.webmanifest",
];
const STATIC_TOKEN = ["robots.txt", "sitemap.xml", ".well-known/security.txt"];

const HTML_OPTS = {
  collapseWhitespace: true,
  conservativeCollapse: true, // keep single spaces so inline icon+text don't collide
  removeComments: true,
  minifyCSS: true,
  minifyJS: false, // only inline scripts are JSON-LD data blocks — leave them
  keepClosingSlash: true,
  caseSensitive: true, // preserve SVG attribute case (viewBox, etc.)
  html5: true,
};

const kb = (n) => (n / 1024).toFixed(1) + " KB";

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(d(".well-known"), { recursive: true });
  await mkdir(d("fonts"), { recursive: true });

  // --- CSS + JS: minify and content-hash --------------------------------
  const cssSrc = await readFile(r("styles.css"), "utf8");
  const cssMin = (await transform(cssSrc, { loader: "css", minify: true })).code;
  const cssName = `styles-${hash(cssMin)}.css`;
  await writeFile(d(cssName), cssMin);

  const jsSrc = await readFile(r("app.js"), "utf8");
  const jsMin = (await transform(jsSrc, { loader: "js", minify: true, target: ["es2018"] })).code;
  const jsName = `app-${hash(jsMin)}.js`;
  await writeFile(d(jsName), jsMin);

  // --- HTML: rewrite refs + token, then minify --------------------------
  for (const page of HTML_PAGES) {
    let html = await readFile(r(page), "utf8");
    html = html
      .split('href="styles.css"').join(`href="/${cssName}"`)
      .split('src="app.js"').join(`src="/${jsName}"`);
    html = sub(html);
    await writeFile(d(page), await minifyHtml(html, HTML_OPTS));
  }

  // --- Fonts ------------------------------------------------------------
  for (const f of await readdir(r("fonts"))) {
    if (f.endsWith(".woff2")) await copyFile(r(`fonts/${f}`), d(`fonts/${f}`));
  }

  // --- Static assets ----------------------------------------------------
  for (const f of STATIC_AS_IS) await copyFile(r(f), d(f));
  for (const f of STATIC_TOKEN) await writeFile(d(f), sub(await readFile(r(f), "utf8")));

  // --- Summary ----------------------------------------------------------
  console.log(`SITE_URL = ${SITE_URL}`);
  console.log(`✓ ${cssName}  ${kb((await stat(d(cssName))).size)}  (was ${kb(Buffer.byteLength(cssSrc))})`);
  console.log(`✓ ${jsName}  ${kb((await stat(d(jsName))).size)}  (was ${kb(Buffer.byteLength(jsSrc))})`);
  for (const page of HTML_PAGES) {
    console.log(`✓ ${page}  ${kb((await stat(d(page))).size)}`);
  }
  console.log("✓ dist ready");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
