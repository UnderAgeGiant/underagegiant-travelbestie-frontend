# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
ng serve                               # dev server → http://localhost:4200 (es-CL)
ng serve --configuration=en-US         # dev server in English
ng build --configuration=es-CL         # production build in Spanish
ng build --configuration=en-US         # production build in English
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
| `SavedPlansService` | Named saved trips per user in `tb_saved_plans_<email>`. Each plan can have a `shareId?` linking it to a `SharedTrip`. `register(plan)` adds a server-created plan to the local signal without an API call (idempotent — used after clone). |
| `AuthService` | JWT token + current user in `localStorage`. Exposes `isLoggedIn` computed signal. |
| `AuthModalService` | Controls login modal visibility; supports a post-login callback pattern. |
| `KarmaService` | Per-user karma score. **Earn**: commenting on someone else's shared trip. **Spend**: sharing a trip (−1), creating a new blank trip (−1). |
| `HomeAddressService` | Stores the user's home city/address in `tb_home_<email>`. Loaded reactively via `effect()` on auth changes. |
| `SharedTripsService` | Public shared trips in `tb_shared_trips`. Per-step comments in `tb_step_comments_<tripId>`. Karma eligibility in `tb_seen_steps_<email>_<tripId>`. `getTrip()` always merges the latest live plan data via `planId`. In real mode the canonical access path is through `ApiService.getSharedTrip()` and `ApiService.searchSharedTrips()` — the service is still injected directly for `getMyTrips()`, `getCommentCount()`, and comment mutations. |
| `VisitedPlacesService` | Map pins for visited places stored in `localStorage` per user. |

### Mock vs real API

`environment.useMocks` (default: `false` in dev) gates every HTTP call in `ApiService`. When `true`, all operations return hardcoded or localStorage-backed data — no backend needed. Set to `false` in `environment.production.ts`.

**Note:** `environment.ts` (dev) has `useMocks: false`, meaning local development always hits the real backend at `http://localhost:3000`.

### ApiService — key methods

| Method | Mock path | Real path |
|---|---|---|
| `getSharedTrip(shareId)` | `SharedTripsService.getTrip(shareId)`; 404 error if not found | `GET /shared/:shareId` |
| `searchSharedTrips(query)` | `SharedTripsService.search(query)` | `GET /shared?q=<query>` |
| `shareTrip(tripId)` | `of({ shareId: randomUUID() })` | `POST /trips/:id/share` |
| `cloneSharedTrip(shareId)` | `of({ id: randomUUID(), title: 'Copy of Mock Trip', … })` | `POST /shared/:shareId/clone` |
| `cloneOwnTrip(tripId)` | `of({ id: randomUUID(), title: 'Copy of Mock Trip', … })` | `POST /trips/:id/clone` |

### Component tree

```
AppComponent
├── SharedTripComponent         — rendered instead of normal app when ?share=<id> in URL
│   ├── NavComponent
│   ├── ProfileComponent        — (modal)
│   └── StepCommentsComponent   — per step: city, transit, lodging, attraction
├── NavComponent                — auth, saved plans, own shared trips, city+trip search
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

### Shared trips (`?share=<id>`)

`AppComponent` reads `new URLSearchParams(window.location.search).get('share')` at startup. If present, it renders `SharedTripComponent` instead of the normal app.

`SharedTripComponent` always fetches via `ApiService.getSharedTrip(id)` (no `useMocks` branch in the component itself — the mock/real split is inside `ApiService`). The effect has `{ allowSignalWrites: true }` because it resets `rateLimited` synchronously.

**Clone flow:** A "📋 Clonar este viaje −1 ✨ karma" button sits in the shared-trip header. `cloneTrip()` checks auth (opens login modal with post-login callback if not logged in) then calls `api.cloneSharedTrip(shareId)`. On success, `cloneResult` signal is set and a success toast appears with an "Abrir en editor →" button. `openCloneInEditor()` calls `savedPlans.register()` + `tripService.restoreStops()` then navigates to `/`. 402 errors are forwarded to `KarmaModalService.handleKarmaError()`.

**Error states:**
- `err.status === 429` → `rateLimited = signal(true)` → "Demasiadas solicitudes" screen with retry button
- Any other error → `_trip.set(null)` → "Viaje no encontrado" screen

**Comment section toggle:**
- Each step (city, lodging, attraction, departure transit, between-city transit, return transit) shows a faded `comment ✍️` button inline with its name by default.
- `expandedSteps = signal(new Set<string>())` tracks which steps the user has opened.
- `shouldShowComments(stepKey)`: returns `true` if the step has existing comments OR if the key is in `expandedSteps`.
- Clicking `✍️` calls `expandStep(stepKey)`.
- `StepCommentsComponent` emits `focusLost` via `focusout` on the form wrapper (checks `relatedTarget` so clicking "Comentar" does not collapse the form). The parent calls `collapseStep(stepKey)` which removes the key from `expandedSteps`; sections with existing comments stay open because `shouldShowComments` evaluates comments independently.

**Header subtitle:** Transport emoji rendered between each pair of city flags using the first segment mode of the transit leg (`modeIcon(mode)`). Omitted when no leg is defined for that pair.

`SharedTripsService.getTrip(id)` always looks up `tb_saved_plans_<ownerEmail>` and merges the **live** plan data (stops, transits, name) via `planId` — so the shared page always reflects the latest version of the trip. Falls back to the stored snapshot if the plan was deleted.

Each step in the shared trip itinerary has a `StepCommentsComponent`. Step key format:
- City: `stop:<cityId>`
- Transit: `transit:<fromId>:<toId>` (edges use `transit:__start__` and `transit:__end__`)
- Lodging: `lodge:<cityId>`
- Attraction: `att:<cityId>:<attractionId>`

Comments require **≥ 50 characters**. First comment on a step earns **+1 karma** unless the commenter owns the trip.

### Nav — saved plans panel

The "Mis viajes guardados" panel has a client-side search (`planSearch` signal + `filteredPlans` computed) that filters by plan name. The list is wrapped in a `max-height: 240px; overflow-y: auto` container so the save/new-trip buttons stay pinned below. Search is cleared when the panel closes.

Each plan row has a ⿻ duplicate button (fires `doClonePlan()` via a `cloningConfirmPlanId` confirm dialog) and a ✕ delete button (fires `doDeletePlan()` via a `deletingPlanId` inline confirm row).

### Nav search

`NavComponent` runs two simultaneous searches as the user types:

1. **City quick-add** (`navFiltered` computed) — synchronous filter over `WORLD_CITIES`.
2. **Shared trip search** (`navSharedTrips` signal) — populated by a debounced async pipe:
   ```
   toObservable(navQuery) | debounceTime(300) | distinctUntilChanged
     | switchMap(q => api.searchSharedTrips(q).pipe(catchError(() => of([]))))
     | takeUntilDestroyed()
   ```
   `catchError` prevents the subscription from dying on backend errors (which would silently break all future searches).

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

### Profile — saved plans

The "Viajes guardados" section has a client-side search input (`planSearch` signal + `filteredPlans` computed) above the plan cards. Each card header shows a 📋 clone button and a 🗑️ delete button (both stop accordion-toggle propagation). Clicking either opens a confirmation modal:

- **Clone modal** — gradient header, warns about −1 karma; on confirm calls `api.cloneOwnTrip()`, registers the result via `savedPlans.register()`, shows a toast. Shows ⏳ while in flight.
- **Delete modal** — red gradient header, warns irreversible; on confirm calls `savedPlans.remove()`.

Both modals close on backdrop click.

### Karma rules

| Action | Effect |
|---|---|
| Comment on someone else's shared trip (first time per step) | **+1** |
| Share a trip | **−1** |
| Create a new blank trip | **−1** |
| Clone a trip (shared or own) | **−1** |

### Data files

- `src/app/data/cities.data.ts` — `WORLD_CITIES`: 115 cities with `id`, `name`, `country`, `flag`, `region`
- `src/app/data/attractions.data.ts` — `getAttractions(city)`: returns curated attractions for major cities or region-based templates otherwise. The top-level `CURATED` map holds hand-crafted entries for 10 cities (paris, london, tokyo, rome, barcelona, amsterdam, newyork, dubai, marrakech, sydney); each also has UNESCO entries appended.
- `src/app/data/attractions-curated.ts` — `CURATED_ALL`: 246 UNESCO World Heritage Site attractions across 83 additional cities, merged into `CURATED` via `Object.assign` in `attractions.data.ts`. Keys must match WORLD_CITIES `id` values. Generated from `attractions-raw.json` at the repo root using `format-unesco.mjs`.

**Adding more UNESCO attractions:** run `node format-unesco.mjs` from the repo root (see root `CLAUDE.md`), then copy new city entries from `attractions-formatted.json` into `attractions-curated.ts`. Add any new city IDs to both `cities.data.ts` and `format-unesco.mjs`'s `WORLD_CITIES` array.

### CSS

All design tokens (colors, shadows, layout) are CSS custom properties in `src/styles.css` using `oklch()`. The prototype `TravelingBestie.html` at the repo root is the UI/UX reference. Component-specific styles for transit, lodging, itinerary, shared trip, and step comments are all global in `src/styles.css`.

`SharedTripComponent` has a component-scoped `styles` array for `.step-comments-toggle`, `.step-comments-label` (the inline comment affordance), and `.clone-success-toast` (the green success banner shown after a successful clone).

**Left panel scroll**: `.panel-body` uses `flex: 1; min-height: 0; overflow-y: auto` — the `min-height: 0` is required to allow a flex child to shrink below its content height and actually scroll.

### i18n

Source locale is `es-CL` (all templates written in Spanish). After adding new `i18n="@@id"` or `i18n-<attr>="@@id"` attributes, run `ng extract-i18n` to regenerate `messages.xlf`, then add the matching `<trans-unit>` to `src/locale/messages.en-US.xlf`. TypeScript strings use `` $localize`...` ``.

**Angular template constraint**: arrow functions (`=>`) are not allowed in template event bindings. Always extract them into class methods.

## Git workflow

Every task ends with a commit and PR opened against `main`:
```bash
gh pr create --base main --head <branch> --title "feat(<scope>): <what>"
```
