# RouteLogs — Landing site

Pre-launch marketing landing page for **RouteLogs**, a B2B SaaS platform that
automates medical specimen logistics — from the clinic where samples are
collected to the lab where they're processed.

Built as a fast, self-contained static site (HTML + CSS + vanilla JS), with no
build step required.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The full single-page landing page (all sections) |
| `styles.css` | Design system + component styles (navy + green theme) |
| `app.js` | Interactions: route map, step tracer, scroll reveal, live dashboard, temperature chart, ROI calculator, demo-form validation, Calendly popup |

## Design

- **Palette:** deep navy (`#0d2a4a`) primary, green (`#1faa6a`) accent, cool off-white surfaces
- **Type:** Plus Jakarta Sans (UI) + IBM Plex Mono (technical labels), loaded from Google Fonts
- **Primary CTA:** "Request a Demo" throughout; "Log in" is secondary

### Sections

Hero · Problem · Solution · How it works · Capabilities · Cold chain ·
Client portal · Courier app · Gallery · Who it's for · ROI calculator ·
Security · Pricing · Pilot · FAQ · Roadmap · Final CTA · Footer

## Running locally

No tooling needed — open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Before going live

A few placeholders are intentional and ready to be swapped in:

- **Calendly:** set your real scheduling link in `app.js` —
  `var CALENDLY_URL = "https://calendly.com/your-team/demo";`
- **Contacts:** update the email/phone/login links in the header and footer.
- **Product screenshots:** the labeled placeholders (Routes, Client Dashboard,
  Pickup Status, courier app, cold-chain visual) are waiting for real images.
- **Pricing & pilot:** plan prices and the founding-partner quote are
  placeholders pending sign-off.
