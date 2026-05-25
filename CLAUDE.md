# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
ng serve                               # dev server → http://localhost:4200 (es-CL)
ng serve --configuration=en-US         # dev server in English
ng build --configuration=es-CL         # production build in Spanish
ng build --configuration=en-US         # production build in English
npm run build:vercel                   # patch env vars then ng build --configuration production (used by Vercel CI)
ng test                                # Karma unit tests (all)
ng extract-i18n --output-path src/locale  # regenerate messages.xlf after template changes
ng generate component path/name        # new standalone component (skipTests=true by default)
ng generate service path/name
```

There is no separate lint command configured. TypeScript errors surface via `ng build`.

## Architecture

### State management

All mutable state lives in **Signal-based injectable services** (`providedIn: 'root'`). There are no NgModules — every component is standalone.

| Service | Responsibility |
|---|---|
| `TripService` | In-memory trip state (stops, transits, active stop). Auto-saves to localStorage on every mutation via an `effect()`. Sorts stops by check-in date. `persistNow(email)` flushes state synchronously before programmatic navigation. |
| `SavedPlansService` | Named saved trips per user in `tb_saved_plans_<email>`. Each plan can have a `shareId?` (set on first share) and `exportedAt?` (set on first itinerary export). `markExported(email, planId)` stamps the local signal and persists to localStorage in mock mode. |
| `AuthService` | JWT token + current user in `localStorage`. Exposes `isLoggedIn` computed signal. |
| `AuthModalService` | Controls login modal visibility; supports a post-login callback pattern. |
| `KarmaService` | Per-user karma score. **Earn**: commenting on someone else's shared trip (+1). **Spend**: sharing a trip (−1), creating a new blank trip (−1), exporting an itinerary for the first time (−1). **Purchase**: `purchaseComplete(karmaAdded)` credits the signal and persists to localStorage in mock mode; re-fetches from the backend in real mode. |
| `HomeAddressService` | Stores the user's home city/address in `tb_home_<email>`. Loaded reactively via `effect()` on auth changes. |
| `SharedTripsService` | Public shared trips in `tb_shared_trips`. Per-step comments in `tb_step_comments_<tripId>`. Karma eligibility in `tb_seen_steps_<email>_<tripId>`. `getTrip()` always merges the latest live plan data via `planId`. |
| `VisitedPlacesService` | Map pins for visited places stored in `localStorage` per user. |

### Mock vs real API

`environment.useMocks` (default: `true` in dev) gates every HTTP call in `ApiService`. When `true`, all operations return hardcoded or localStorage-backed data — no backend needed. Set to `false` in `environment.production.ts`.

### Component tree

```
AppComponent
├── SharedTripComponent         — rendered instead of normal app when ?share=<id> in URL
│   ├── NavComponent
│   ├── ProfileComponent        — (modal)
│   └── StepCommentsComponent   — per step: city, transit, lodging, attraction
├── NavComponent                — auth, saved plans, own shared trips, city+trip search, karma pill + Buy button
│   └── BuyKarmaModalComponent  — package selector, PayPal button (or demo button), success/error states
├── StopListComponent           — left panel (scrollable via min-height:0 + overflow-y:auto)
│   ├── TransitConnectorComponent  — between stops and departure/arrival edges
│   ├── LodgingComponent           — per-stop lodging with optional booking link
│   └── DateRangeComponent         — flatpickr 2-date wrapper, emits dd/mm/yyyy
├── DestinationComponent        — right panel: attraction grid for active stop
│   ├── AttractionCardComponent
│   ├── AttractionDetailModalComponent
│   ├── CommentModalComponent
│   └── PlanTimeModalComponent  — date (flatpickr) + time picker, date-aware collision
├── AddStopModalComponent       — city search + date picker
├── WelcomeComponent            — shown when no stops; 5 horizontal step cards
├── ProfileComponent            — saved plans, shared trip itinerary, home address, map
│   └── TripItineraryComponent  — read-only vertical timeline with fmtSeg()
└── ToastComponent
```

### Karma purchase flow (`BuyKarmaModalComponent`)

Opened from the "Comprar" button next to the karma pill in `NavComponent`.

- Fetches packages via `ApiService.getKarmaPackages()` on mount.
- In **real mode**: lazily loads the PayPal JS SDK using `environment.paypalClientId`, renders the official PayPal button into `#paypal-btn-container`. A `ResizeObserver` watches the container and auto-scrolls it into view within the modal body once PayPal's async render completes.
- In **mock mode**: shows a "Simular compra" button that calls `createKarmaOrder` + `captureKarmaOrder` against the localStorage-backed stubs.
- On success: calls `KarmaService.purchaseComplete(karmaAdded)` to update the karma signal, emits `karmaGained` to `NavComponent` for immediate display.
- The modal card is `max-height: 90vh` with a flex-column layout — header and footer are pinned (`flex-shrink: 0`); the body is `overflow-y: auto` so it scrolls independently of the page if PayPal renders a lot of UI.

### Shared trips (`?share=<id>`)

`AppComponent` reads `new URLSearchParams(window.location.search).get('share')` at startup. If present, it renders `SharedTripComponent` instead of the normal app.

`SharedTripsService.getTrip(id)` always looks up `tb_saved_plans_<ownerEmail>` and merges the **live** plan data (stops, transits, name) via `planId` — so the shared page always reflects the latest version of the trip. Falls back to the stored snapshot if the plan was deleted.

Each step in the shared trip itinerary has a `StepCommentsComponent`. Step key format:
- City: `stop:<cityId>`
- Transit: `transit:<fromId>:<toId>` (edges use `transit:__start__` and `transit:__end__`)
- Lodging: `lodge:<cityId>`
- Attraction: `att:<cityId>:<attractionId>`

Comments require **≥ 50 characters**. First comment on a step earns **+1 karma** unless the commenter owns the trip.

### Transit legs

`TransitLeg` stores `segments: TransitSegment[]`. Each segment now has `departureDate`, `departureTime`, `arrivalDate`, `arrivalTime` (all `dd/mm/yyyy` / `HH:mm`). Duration is computed on the fly via `computeMins(seg)`. Legacy segments with only `durationMinutes` still render correctly.

- Between two stops: key is `cityA|cityB`
- **Departure** (before first stop): key is `__start__|__start__`
- **Return** (after last stop): key is `__end__|__end__`

`TransitConnectorComponent` uses `type` (`'default' | 'departure' | 'arrival'`), `cityLabel`, and `HomeAddressService` to show the home city in edge connector labels.

### Planned attractions

`PlannedAttraction` has `attractionId`, `startTime` (HH:mm), and optional `date` (dd/mm/yyyy). The plan-time modal uses `DatePickerComponent` (single-date flatpickr, bounded by stop checkIn/checkOut). Collision detection is date-aware — attractions on different days never conflict.

### Date format

All dates are `dd/mm/yyyy` strings throughout the app. `TripService` parses these for sorting. Both `DateRangeComponent` (2-date) and `DatePickerComponent` (single-date) are flatpickr wrappers that always emit in this format.

### Karma rules

| Action | Effect |
|---|---|
| Comment on someone else's shared trip (first time per step) | **+1** |
| Share a trip | **−1** |
| Create a new blank trip | **−1** |
| Export trip itinerary to `.xlsx` (first time only; free on repeats) | **−1** |
| Purchase a karma package | **+purchased amount** (via PayPal or other provider) |

### Data files

- `src/app/data/cities.data.ts` — `WORLD_CITIES`: 120+ cities with `id`, `name`, `country`, `flag`, `region`
- `src/app/data/attractions.data.ts` — `getAttractions(city)`: returns curated attractions for major cities or region-based templates otherwise

### CSS

All design tokens (colors, shadows, layout) are CSS custom properties in `src/styles.css` using `oklch()`. The prototype `TravelingBestie.html` at the repo root is the UI/UX reference. Component-specific styles for transit, lodging, itinerary, shared trip, and step comments are all global in `src/styles.css`.

**Left panel scroll**: `.panel-body` uses `flex: 1; min-height: 0; overflow-y: auto` — the `min-height: 0` is required to allow a flex child to shrink below its content height and actually scroll.

**Modal scroll pattern**: modals that contain third-party rendered content (e.g. PayPal buttons) use `max-height: 90vh` on the card + `overflow-y: auto; flex: 1` on the body div, with header/footer set to `flex-shrink: 0`. This keeps header and footer pinned while only the body scrolls.

### i18n

Source locale is `es-CL` (all templates written in Spanish). After adding new `i18n="@@id"` or `i18n-<attr>="@@id"` attributes, run `ng extract-i18n` to regenerate `messages.xlf`, then add the matching `<trans-unit>` to `src/locale/messages.en-US.xlf`. TypeScript strings use `` $localize`...` ``.

**Angular template constraint**: arrow functions (`=>`) are not allowed in template event bindings. Always extract them into class methods.

## Environment variables (build-time injection)

`scripts/patch-env.mjs` runs before `ng build --configuration production` (via the `build:vercel` npm script). It reads environment variables and replaces named placeholders in `src/environments/environment.production.ts` before Angular compiles them into the bundle.

| Env var | Placeholder in `environment.production.ts` | Purpose |
|---|---|---|
| `BACKEND_API_URL` | `BACKEND_API_URL_PLACEHOLDER` | Backend Vercel URL |
| `BACKEND_RSA_PUBLIC_KEY` | `RSA_PUBLIC_KEY_PLACEHOLDER` | RSA public key for encrypting login/register payloads |
| `TURNSTILE_SITE_KEY` | `TURNSTILE_SITE_KEY_PLACEHOLDER` | Cloudflare Turnstile site key |
| `PAYPAL_CLIENT_ID` | `PAYPAL_CLIENT_ID_PLACEHOLDER` | PayPal JS SDK client ID (used to load the PayPal button) |
| `BACKEND_USE_MOCKS` | replaces `useMocks: false` | Set to `'true'` to force mock mode in production |

Set all of these in the Vercel project's **Environment Variables** dashboard. The `build:vercel` script runs automatically in Vercel CI.

## Git workflow

Active feature branches:
- `feat/paypal_integration` — karma purchase via PayPal (PRs open against `main` in both repos)

Every task ends with a commit and PR opened against `main`:
```bash
gh pr create --base main --head <branch> --title "feat(<scope>): <what>"
```
