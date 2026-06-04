/**
 * Generate raster brand assets from the RouteLogs logomark.
 *
 *   favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png  ← favicon.svg
 *   og-image.png (1200×630 social card)                            ← built here
 *
 * Outputs are committed to the repo, so the runtime build never needs sharp.
 * Re-run with: npm run gen:assets   (requires the optional deps + brand TTFs
 * installed in fontconfig for the OG text; see README).
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = (f) => resolve(root, f);

// Icon source (navy tile + white route mark), rendered at high density for crisp edges.
const faviconSvg = await readFile(out("favicon.svg"));
const renderIcon = (size) =>
  sharp(faviconSvg, { density: 512 }).resize(size, size).png({ compressionLevel: 9 });

// --- App icons --------------------------------------------------------------
await renderIcon(180).toFile(out("apple-touch-icon.png"));
await renderIcon(192).toFile(out("icon-192.png"));
await renderIcon(512).toFile(out("icon-512.png"));

// --- favicon.ico (16/32/48) -------------------------------------------------
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(icoSizes.map((s) => renderIcon(s).toBuffer()));
await writeFile(out("favicon.ico"), await pngToIco(icoPngs));

// --- OG / social card (1200×630) -------------------------------------------
const NAVY = "#0d2a4a";
const NAVY_900 = "#07203c";
const GREEN = "#1faa6a";
const GREEN_400 = "#34c281";
const WHITE = "#ffffff";
const MUTED = "#b9cbe0";

const mark = `
  <g transform="translate(80 64)">
    <rect width="64" height="64" rx="16" fill="${GREEN}"/>
    <g transform="translate(12 12) scale(1.6667)" fill="none" stroke="${WHITE}"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="6" r="2.2"/>
      <circle cx="18" cy="18" r="2.2"/>
      <path d="M8 6h6a3 3 0 0 1 0 6H10a3 3 0 0 0 0 6h6"/>
    </g>
  </g>`;

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY_900}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.82" cy="0.08" r="0.6">
      <stop offset="0" stop-color="${GREEN}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${GREEN}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- faint route motif, bottom-right -->
  <g opacity="0.16" fill="none" stroke="${GREEN_400}" stroke-width="3" stroke-linecap="round">
    <path d="M760 470 C 870 470 880 540 1000 540 L 1120 540" stroke-dasharray="6 9"/>
    <circle cx="760" cy="470" r="9" fill="${GREEN_400}" stroke="none"/>
    <circle cx="1000" cy="540" r="9" fill="${GREEN_400}" stroke="none"/>
    <circle cx="1120" cy="540" r="11" fill="${WHITE}" stroke="none"/>
  </g>

  ${mark}
  <text x="164" y="107" font-family="Plus Jakarta Sans ExtraBold" font-size="40" font-weight="800">
    <tspan fill="${WHITE}">Route</tspan><tspan fill="${GREEN_400}">Logs</tspan>
  </text>

  <text x="82" y="196" font-family="IBM Plex Mono Medium" font-size="21" letter-spacing="3"
        fill="${GREEN_400}">AUTOMATED MEDICAL SPECIMEN LOGISTICS</text>

  <g font-family="Plus Jakarta Sans ExtraBold" font-weight="800" font-size="60" fill="${WHITE}">
    <text x="80" y="296">Automate the journey of</text>
    <text x="80" y="372"><tspan fill="${WHITE}">every</tspan><tspan fill="${GREEN_400}" dx="18">medical specimen,</tspan></text>
    <text x="80" y="448">clinic to lab.</text>
  </g>

  <rect x="82" y="492" width="72" height="5" rx="2.5" fill="${GREEN}"/>
  <text x="82" y="552" font-family="Plus Jakarta Sans Medium" font-size="25" fill="${MUTED}">Scheduling · optimized routes · transfer hubs · real-time client portal</text>
</svg>`;

await sharp(Buffer.from(ogSvg)).png({ compressionLevel: 9 }).toFile(out("og-image.png"));

const list = ["favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "og-image.png"];
for (const f of list) {
  const m = await sharp(out(f === "favicon.ico" ? "icon-512.png" : f)).metadata().catch(() => null);
  console.log("✓", f, m ? `${m.width}×${m.height}` : "");
}
console.log("done");
