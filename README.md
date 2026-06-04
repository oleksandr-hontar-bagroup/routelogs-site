# RouteLogs — marketing site

Production site for **RouteLogs**, a B2B SaaS platform that automates medical
specimen logistics — from the clinic where samples are collected to the lab
where they're processed.

It's a fast, hand-written static site (HTML + CSS + vanilla JS) with a small
build step that minifies and content-hashes assets, self-hosts the fonts, and
emits `/dist`. It ships in a Docker image served by **Caddy** (security headers,
compression, caching) and is set up to deploy on **Railway**.

## Structure

| Path | Purpose |
|------|---------|
| `index.html` | Single-page landing (17 sections) |
| `privacy.html`, `terms.html` | Legal pages (GDPR-aligned templates) |
| `404.html` | Branded not-found page |
| `styles.css` | Design system + components + self-hosted `@font-face` rules |
| `app.js` | Interactions: route map, step tracer, scroll reveal, live dashboard, temperature chart, ROI calculator, demo-form validation, lazy Calendly popup |
| `fonts/` | Self-hosted Plus Jakarta Sans + IBM Plex Mono (`woff2`) |
| `favicon.*`, `icon-*.png`, `apple-touch-icon.png`, `og-image.png`, `site.webmanifest` | Brand / PWA / social assets |
| `robots.txt`, `sitemap.xml`, `.well-known/security.txt` | Crawl & disclosure |
| `build.mjs` | Build → `/dist` |
| `Caddyfile`, `Dockerfile`, `railway.json` | Serving & deploy |
| `scripts/` | One-off generators (`fetch-fonts`, `gen-assets`) |

## Develop

No tooling needed to preview — open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Build

```bash
npm install
npm run build                 # → ./dist  (minified, content-hashed, fonts copied)
SITE_URL="https://your-domain.com" npm run build   # set the canonical domain
```

`SITE_URL` (default `https://routelogs.app`) is substituted into the canonical /
Open Graph / sitemap / robots / security.txt URLs at build time — the one place
the production domain is configured.

### Regenerating assets (rarely needed)

These use the `optionalDependencies` (`sharp`, `png-to-ico`) and the brand TTFs
in fontconfig; their output is committed, so the normal build never needs them.

```bash
npm run gen:fonts             # re-download self-hosted woff2 + @font-face block
npm run gen:assets            # re-render favicons, app icons, og-image.png
```

## Deploy (Railway)

Railway builds the `Dockerfile` (multi-stage: Node builds `/dist`, then Caddy
serves it) and injects `PORT`, which Caddy binds automatically.

1. Create a Railway service from this repo (it auto-detects the Dockerfile).
2. Set the `SITE_URL` environment variable to your real domain.
3. Deploy. TLS is terminated at Railway's edge; Caddy adds the security headers.

Any static host works too — point it at `dist/` after `npm run build`, but
you'll need to reproduce the headers/caching from `Caddyfile` yourself.

## What's hardened

- **Security headers (`Caddyfile`):** CSP (tight `script-src`, no `unsafe-inline`
  for scripts), HSTS (preload), `X-Content-Type-Options`, `Referrer-Policy`,
  comprehensive `Permissions-Policy` (denies camera/mic/geo/payment/usb/… ),
  `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `X-Frame-Options`,
  `X-Permitted-Cross-Domain-Policies`, `Server` header removed. No inline
  scripts/handlers/styles; Calendly is origin-restricted by CSP.
- **Supply chain / container:** Docker base images pinned to digests; the serve
  stage runs as a **non-root** user; `npm ci` from a committed lockfile;
  Dependabot (`.github/dependabot.yml`) watches npm + Docker + Actions.
- **Known trade-off:** the in-page Calendly popup means `style-src 'unsafe-inline'`
  and the Calendly origins must stay, and Trusted Types / COEP can't be enforced
  (Calendly's `widget.js` isn't compatible). Switching Calendly to open in a new
  tab would unlock a stricter CSP — see `app.js`.
- **Enable in GitHub (Settings → Code security & analysis):** Dependabot alerts,
  Secret scanning, and Push protection.
- **Performance:** self-hosted fonts (no third-party CDN), Calendly loaded only
  on first interaction, minified + content-hashed CSS/JS with immutable caching,
  zstd/gzip compression, preloaded above-the-fold fonts.
- **SEO:** title/description, canonical, Open Graph + Twitter cards, favicons +
  web manifest, `robots.txt`, `sitemap.xml`, and JSON-LD (Organization,
  SoftwareApplication, FAQPage).
- **Reliability:** scroll-reveal and Calendly fallbacks, content visible without
  JS, `prefers-reduced-motion`, branded 404 with a real 404 status.

## Before going live (intentional placeholders)

- **Domain:** set `SITE_URL` to the real domain (currently `routelogs.app`).
- **Calendly:** set your real link in `app.js` (`var CALENDLY_URL = …`).
- **Contacts:** real phone (and the "Log in" links, once the app exists).
- **Product screenshots:** the labeled placeholders await real images.
- **Pricing & pilot:** plan prices and the founding-partner quote.
- **Legal:** `privacy.html` and `terms.html` are templates — have counsel review
  them before launch.
