# TravelingBestie — Frontend

Angular 22 standalone SPA for planning multi-destination trips. Users build an itinerary, explore curated attractions per city, and leave comments on every stop. Live at [tripilove.com](https://tripilove.com). Connects to the [travelbestie-manager](https://github.com/UnderAgeGiant/underagegiant-travelbestie-manager) REST API via JWT auth.

## Features

- Multi-destination itinerary planning with per-city curated attractions
- AI-assisted trip suggestions and full-plan generation
- Token economy — earn Tokens by commenting on shared trips, spend them on AI planning, itinerary exports, and cloning (the code and API call them `karma`)
- Share a trip publicly and let others clone it into their own account
- City guides (`/ciudad/:slug`), public profiles and following, trophies, weekly rankings
- Trip cost estimate and a bilingual Excel itinerary export
- **Trip co-editing** — invite another registered user to collaborate on a trip as a full editor; the owner keeps sole control over deleting, re-sharing, cloning, and exporting it

## Tech stack

- Angular 22 · standalone components · Signal-based state
- `@angular/localize` for i18n (es-CL default, en-US supported)
- Angular HttpClient + JWT interceptor
- Deployed on Vercel (static output + edge middleware and functions for SEO)
- Node ≥ 22.22.3

## Development server

```bash
npm run dev     # Spanish — http://localhost:4200 (default), patches env vars from local.env first
npm run dev:en  # English — http://localhost:4200
```

`npm run dev` is the normal entry point — it reads `local.env` and injects backend URL/keys into `environment.ts` before launching `ng serve`, restoring the file on exit. Use `npm start` (raw `ng serve`) only if you don't need those env vars patched in. The app reloads automatically on file changes.

Attraction data is not bundled: `npm run data` writes one JSON file per city to `public/data/attractions/` (gitignored). It runs automatically on `npm install` and before every dev/build command.

## Environment variables

Copy `local.env.example` to `local.env` at the repo root (`cp local.env.example local.env`) (gitignored via `*.env` — never commit it) with any of the following. **None are strictly required** — `environment.ts` ships with working defaults (a real backend URL, a real RSA key, Cloudflare's always-pass Turnstile test key), so `npm run dev` runs out of the box even with no `local.env` at all (`start-dev.mjs` just prints a warning and falls back to those defaults).

| Variable | Used by | Default if unset | Purpose |
|---|---|---|---|
| `BACKEND_API_URL` | `npm run dev` | `http://localhost:3000` | Base URL of the `underagegiant-travelbestie-manager` API. Point this at a locally running backend, or a deployed one. |
| `BACKEND_USE_MOCKS` | `npm run dev` | `false` | Set to `true` to run the frontend standalone with no backend at all — every `ApiService`/`AuthService` call falls back to `localStorage`/hardcoded mock data. |
| `BACKEND_RSA_PUBLIC_KEY` | `npm run dev` | a working key baked into `environment.ts` | Public half of the RSA key pair the backend uses to decrypt login/register payloads. Only override if your local backend was set up with a different key pair. |
| `TURNSTILE_SITE_KEY` | `npm run dev` | `1x00000000000000000000AA` (Cloudflare's official always-passes test key) | Cloudflare Turnstile site key rendered in the login/register modal. |
| `AUTOSAVE_INTERVAL_MS` | `npm run dev` | `600000` (10 min) | How often the co-editing auto-save tick runs. Lower this locally (e.g. `10000`) to test auto-save/reminder-banner behavior without waiting 10 minutes. |
| `PAYPAL_CLIENT_ID` | `npm run build:vercel` only (not `npm run dev`) | empty — PayPal button is skipped | Needed for a real production build with a working Buy Tokens → PayPal flow. Irrelevant in mock mode. |

To exercise the full app locally (real login, saved trips, karma, co-editing), you need a running `underagegiant-travelbestie-manager` backend reachable at `BACKEND_API_URL` — see that repo's README for its own required env vars (`JWT_SECRET`, database connection, etc.). Otherwise, set `BACKEND_USE_MOCKS=true` and skip the backend entirely.

## i18n — locales

| Locale | Language | Command |
|--------|----------|---------|
| `es-CL` | Spanish (Chile) — **default** | `npm run dev` |
| `en-US` | English (US) | `npm run dev:en` |

Translatable strings are marked with `i18n="@@id"` in templates and `$localize` in TypeScript. English translations live in `src/locale/messages.en-US.xlf`.

After adding new strings to a template, regenerate the source file:

```bash
ng extract-i18n --output-path src/locale
```

Then add the corresponding `<trans-unit>` entries to `src/locale/messages.en-US.xlf`.

Date format for es-CL is `dd/MM/yyyy` (e.g. `25/04/2026`).

## Build

```bash
npm run build:vercel   # what Vercel runs: data → env patch → production build (both locales) → post-build (SEO pages, sitemap)
npm run build          # plain ng build
```

## Tests

```bash
npm test              # Jest — all tests
npm run test:coverage # Jest with coverage
npm run test:scripts  # node tests for the build scripts
npx jest --watch      # watch mode
```

There is no Karma/`ng test` runner in this project — Jest (via `jest-preset-angular`) is the only test runner. There is also no lint command; TypeScript errors surface via `ng build`.

## Code scaffolding

```bash
ng generate component features/<name>/<name>
ng generate service core/<name>/<name>
```

## Project structure

```
src/
├── app/
│   ├── core/                 # Injectable, providedIn:'root' services — auth, api, karma,
│   │                         #   saved-plans, favorites, shared-trips, device, ai, models,
│   │                         #   seo, social, trophies, rankings, game, weather, trip-cost…
│   ├── data/
│   │   ├── cities.data.ts          # World cities catalog
│   │   ├── attractions-curated.ts  # Curated attractions, build input only (never imported by app code)
│   │   ├── attractions.data.ts     # Runtime lookup: loads public/data/attractions/<cityId>.json on demand
│   │   ├── freetours-curated.ts    # Free-tour listings
│   │   └── city-guides.data.ts     # City guide pages
│   ├── shared/                # Reusable presentational components/directives/pipes
│   ├── features/
│   │   ├── nav/                # app-nav shell — device-split desktop/mobile bars
│   │   ├── shell/              # ShellComponent — the normal app layout root
│   │   ├── welcome/            # Landing / no-stops-yet view
│   │   ├── trip/               # StopList, TripService, stop-level editing
│   │   ├── planning/           # DayTimelineComponent (hour-grid schedule)
│   │   ├── ai-planning/        # AI-assisted suggest + full-plan flow
│   │   ├── destination/        # DestinationView, AttractionCard, comments
│   │   ├── my-trips/           # Saved/favorited/collaborated trips, invites
│   │   ├── preferences/        # Account settings, trophies, companion boost (/preferences)
│   │   ├── public-profile/     # /u/:username
│   │   ├── city-guide/         # /ciudad/:slug guides and the /guides index
│   │   ├── karma-history/      # Token history page
│   │   ├── shared-trip/        # Read-only public share view (/shared/:id)
│   │   ├── karma/              # Buy-Tokens modal, karma overlays
│   │   ├── comments/           # Attraction/step comment modals
│   │   ├── landing/            # Scroll-snap landing sections (slideshow, about, footer)
│   │   └── about/, legal/, not-found/, too-many-requests/
│   ├── app.component.ts
│   ├── app.config.ts          # Locale registration (es-CL, en-US)
│   └── app.routes.ts
├── edge/                      # Framework-free routing/SEO logic shared by middleware.ts and api/
└── locale/
    └── messages.en-US.xlf     # English translations
```
