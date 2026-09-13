
# CLAUDE.md

Guidance for Claude Code working in this repo.

**Stack:** Angular 22 (standalone components + signals), TypeScript 5, Jest 30 (jest-preset-angular), `@angular/localize` i18n, Vercel static hosting.

## Commands

```bash
npm run dev                           # dev server (es-CL) — patches env from local.env via scripts/start-dev.mjs, then ng serve
npm run dev:en                        # dev server in English
ng serve                              # raw ng serve → http://localhost:4200 (no env patching)
ng build --configuration=es-CL        # production build in Spanish
ng build --configuration=en-US        # production build in English
npm run build:vercel                  # patch env vars + ng build --configuration production (used by Vercel CI)
npm test                              # Jest (all tests)
npm run test:coverage                 # Jest with coverage
npx jest --watch                      # watch mode
npx jest src/app/features/trip/trip.service.spec.ts   # run a single test file
ng extract-i18n --output-path src/locale  # regenerate messages.xlf after adding i18n strings
```

`npm run dev` (not raw `ng serve`) is the normal entry point: `scripts/start-dev.mjs` reads `local.env`, injects `BACKEND_API_URL`/`BACKEND_RSA_PUBLIC_KEY`/`TURNSTILE_SITE_KEY`/`PAYPAL_CLIENT_ID`/`AUTOSAVE_INTERVAL_MS` into `environment.ts`, launches `ng serve`, restores the file on exit.

No lint command — TypeScript errors surface via `ng build`. E2E (Playwright) and load (k6) tests live in sibling `travelbestie-tests/`, not here.

## Mock vs real API

`environment.useMocks` (`src/environments/environment.ts`) gates every HTTP call. **Dev is `false`** — local dev always hits the real backend at `http://localhost:3000`. When `true`, all operations use `localStorage`/`sessionStorage`/hardcoded data; no backend needed. Every `ApiService`/`AuthService` method has an `if (environment.useMocks)` branch — implement both paths for any new call.

## Architecture

### No NgModules — standalone + signals everywhere

All components `standalone: true`. All mutable state lives in **signal-based injectable services** (`providedIn: 'root'`). No `BehaviorSubject`s or `Store` patterns.

### Core services

| Service | State | Storage |
|---|---|---|
| `TripService` | Stops, transits, active stop, loaded plan ID | `localStorage` (`tb_plan_<email>`, `tb_active_plan_<email>`); auto-saves via `effect()`. `loadForUserPreservingAnonymous(email)` snapshots in-memory stops before loading, restores them if the account had no saved plan |
| `SavedPlansService` | Named saved trips per user | `localStorage` (`tb_saved_plans_<email>`) mock mode; real API in prod. May carry `shareId`. |
| `AuthService` | JWT access token (in-memory) + `AuthUser` | Access token: in-memory `_token` signal only, never written to storage. Refresh token: **not held by frontend at all** — backend-set `HttpOnly` cookie (auth calls send `withCredentials: true`). User display info: `localStorage` (`tb_session_user`). Legacy `sessionStorage`/`localStorage` keys (`tb_token`, `tb_session_user`) purged on init. |
| `AuthModalService` | Login modal visibility + post-login callback | In-memory signal |
| `KarmaService` | Karma score | `localStorage` (`tb_karma_<email>`) |
| `KarmaModalService` | Buy/insufficient modal visibility; parses 402 errors; `mpConfirm` (MercadoPago post-redirect confirmation state) | In-memory signal |
| `FavoritesService` | Favorited shared trips list + id set | In-memory; lazy `loadFavorites()`; optimistic `toggle()`; `clear()` on logout |
| `SharedTripsService` | Public shared trips; step comments; karma eligibility | `localStorage` (`tb_shared_trips`, `tb_step_comments_<id>`, `tb_seen_steps_<email>_<id>`) |
| `CommentCooldownService` | Post-comment cooldown + shake | In-memory; nav banner while `cooldownSeconds() > 0` |
| `HomeAddressService` | Country of residence, ISO2 (server-persisted) | `auth.currentUser().countryOfResidence` via `PUT /auth/profile` |
| `VisitedPlacesService` | Map pins | `localStorage` per user |

### Top-level routing

`AppComponent` is a bare `<router-outlet />`. `app.routes.ts`: `''` → lazy `ShellComponent` (the real app root — landing/app-mode layout, all root overlays), `'about'` → `AboutComponent`, `'karma-history'` → `KarmaHistoryComponent` (`authGuard`-protected), `'shared/:id'` → `SharedTripComponent`, `'terms'`/`'privacy'` → `TermsComponent`/`PrivacyComponent` (own `<app-nav>` + nested `<app-profile>`), wildcard `**` → `''`. All lazy via `loadComponent()`.

`core/routing/share-redirect.util.ts` (`shareRedirectPath`) converts the legacy `?share=<id>[&highlight=...]` query-param form into `/shared/<id>[?highlight=...]`; an `APP_INITIALIZER` runs it once at boot via `window.history.replaceState` so old share links still work. `core/share/share-url.util.ts`'s `buildShareLink()` only emits the new `/shared/:id` form — the query-param shim exists solely for old links; **don't remove it**.

Within `ShellComponent`, navigation between profile/AI-planning/My Trips panels is still signal booleans (`showProfile`, `showAiPlanning`, `showMyTrips`), not further routes.

### Karma history page (`KarmaHistoryComponent`, Feature: Karma Events History)

Routed `/karma-history` page (`authGuard`-protected, lazy), reached via a third button ("📈 Historial de karma") in both nav bars' user dropdown, alongside "👤 Mi perfil"/"🗺 Mis viajes" — not a tab inside `MyTripsComponent`. Same `.profile-page`/`<app-nav>` skeleton as `ProfileComponent`/`PrivacyComponent`. Fetches `ApiService.getKarmaEvents(email, cursor, limit)` (cursor-paginated, "Cargar más" button, no infinite scroll); each row's natural-language label comes from `karmaReasonLabel()` (`core/models/karma-event.model.ts`, function not const map — lazy `$localize`, same convention as `getCategoryMeta()`). A row's `target` (server-resolved, `null` if the underlying trip/AI-plan-request no longer exists) drives an optional "Ir al viaje" or "Ir al plan de IA" (`NavFacadeService.openMyTrips('aiplans')`) button. A failed first load shows a dedicated error state with a "Reintentar" button (distinct from the genuinely-empty-ledger state) rather than silently rendering as "no history" — a `loadMore()` failure instead leaves the already-loaded rows in place and reports via the existing `toast` signal, so pagination retry doesn't blow away the list.

`goToTrip()` mirrors `MyTripsComponent.loadAndModify()`'s mechanism exactly — including its `AutoSaveService.commitSnapshot(id)` + `showReminderNow()` calls (skipping these would leave the first auto-save tick after arriving here mistaking an untouched trip for one with unsaved changes, and a collaboration would miss its up-front auto-save-off reminder) — and additionally retries against a fresh `ApiService.getTrips()` lookup when the trip isn't found in the (possibly stale) `savedPlans.plans()` cache, since the backend has already confirmed the trip exists and is owned by the caller before ever sending that target at all.

**`authGuard` gotcha (`core/auth/auth.guard.ts`):** this route was the app's first consumer of `authGuard`, which surfaced a real bug — a synchronous `isLoggedIn()` check races the async, `queueMicrotask`-deferred token restore on page load (reload/direct link/new tab), bouncing a genuinely logged-in user to `/`. The guard now branches on `AuthService.sessionMayExist()`: when true, it awaits `refreshAccessToken()` (already deduped via `_refreshInFlight`) before deciding, instead of redirecting immediately. Any future route that needs `authGuard` gets this fix for free.

**Mock-mode ledger:** `KarmaService.spend()`/`.gain()`/`.purchaseComplete()` gained optional `reason`/`targetId` params (defaulted, so existing zero-arg call sites still compile) — in mock mode they append a synthetic `KarmaEvent` to `localStorage['tb_karma_events_<email>']`, which `ApiService.getKarmaEvents()`'s mock branch reads back. Best-effort dev convenience (only the reasons those 4 real call sites pass — `trip_created`, `itinerary_exported`, `companion_boost`, `karma_purchased` — ever appear in the mock ledger), not a strict mirror of backend `karma_events` semantics.

**Saved-AI-plan trip link:** without this, saving a plan out of `AiPlanningComponent` would leave its `ai_plan` karma event permanently unlinkable (the backend hard-deletes the `ai_plan_requests` row on save). `Trip` (`core/models/trip.model.ts`) gained an optional, write-only `sourceAiPlanRequestId?: string`; `SavedPlansService.upsert()`'s `opts` param gained `sourceAiPlanRequestId?: string`, threaded to `ApiService.saveTrip({...})` only on the create path (`id` falsy — an update never creates a new trip row). `AiPlanningComponent.save()` passes `{ sourceAiPlanRequestId: this.currentAiPlanRequestId() ?? undefined }`, read before the success callback clears `currentAiPlanRequestId()`.

**City-suggestion trip link:** `ApiService.suggestCityAttractions(...)` gained an optional trailing `tripId?: string` param; `CitySuggestService.fetchSuggestions()` passes `this.trip.loadedPlanId() ?? undefined` — this wasn't in the original written plan (only the backend half was tasked) but is required by the design spec for the `ai_city_suggest` karma reason's deep link to ever resolve to anything; added directly by this console after auditing the plan against its spec. An unsaved trip has no id yet, so that call's karma event simply won't be linkable (graceful degradation, not an error).

**Post-implementation fixes (user feedback after the initial ship):** every trip-type `target` now carries a `name` (the trip's title), rendered next to the reason label. A `null` target on a reason that's normally plan-linked (`isPlanLinkedReason()` in `karma-event.model.ts`) renders "Plan borrado" instead of a bare row — reasons that were never plan-linked to begin with (`companion_boost`, `karma_purchased`, ...) still render nothing extra. `karma_purchased` events carry `purchase: {provider, transactionId}`, shown as plain text with no action button (`karma-purchase-meta` class). `ai_city_suggest`/`ai_plan` (and, going one step earlier, `ai_suggest`) can resolve to a trip target via the AI-planning session's `planSessionId` — sent on every `/ai/suggest` call via `ApiService.suggestTrips()`'s optional 4th param, and threaded through `SavedPlansService.upsert()`'s `sourcePlanSessionId` opt (parallel to the existing `sourceAiPlanRequestId`) — matched server-side against `trips.source_plan_session_id`. **Gotcha:** `ai_suggest` is deliberately *excluded* from `PLAN_LINKED_REASONS` despite being able to resolve to a trip target — unlike every other plan-linked reason, an `ai_suggest` event's `null` target is the *overwhelmingly common* case (the user browsed suggestions and never saved a trip at all, so nothing was ever created to "delete"), not the rare "was later deleted" case the other reasons represent; including it in that set would mislabel the common case as "Plan borrado". `target.type === 'trip'` still drives the "Ir al viaje" button independently of `isPlanLinkedReason` whenever an `ai_suggest` event *does* resolve.

### Landing mode (no stops)

When `trip.stops().length === 0`, `ShellComponent` renders a scroll-snap landing (`.landing-scroll`, four `landing-snap-child` sections) instead of the app layout:

| Section | Component | Description |
|---|---|---|
| S1 | inline in `ShellComponent` | Full app shell (stop list + welcome panel) with scroll hint |
| S2 | `FeaturedSlideshowComponent` (`tb-featured-slideshow`) | Cinematic slideshow of featured trips; crossfade + progress bar |
| S3 | `LandingAboutComponent` (`tb-landing-about`) | Lavender section; copy + count-up stats (cities/users/plans) |
| S4 | `AppFooterComponent` (`tb-app-footer`) | Near-black footer; three-column nav + logotype |

Mobile: scroll-snap disabled, sections stack vertically. `FeaturedSlideshowComponent` fetches `ApiService.getFeatured()` (24h `localStorage` cache, `tb:featured:cache`); its clone button navigates to `/?share=<id>&highlight=clone`. `LandingAboutComponent` fetches `ApiService.getStats()`; count-up fires once via `IntersectionObserver`. `InViewDirective` (`[tbInView]`) adds `.in-view` at 30% visibility, self-disconnects after firing (drives `.reveal.hidden → .reveal.in-view`). `?highlight=clone` makes `SharedTripComponent` shake the clone button once (`shakeClone`, `.shake`, 800ms).

### App mode layout

When stops exist, three columns: `<app-stop-list> | <tb-day-timeline> | <div class="right-panel"> → <app-destination>`.

**`DayTimelineComponent`** (`tb-day-timeline`, `OnPush`) renders a scrollable 00:00–23:00 hour grid (46px/hr); days with no blocks auto-scroll to 07:00. Shows `PlannedAttraction` blocks for the active stop's selected day; day tabs from check-in/check-out range.

- **Day-tab re-derivation is guarded:** the auto-select-a-day effect only re-picks a day when the stop actually changed (`stop.stopId !== lastStopId`) or the current `selectedDay()` fell off the new `days()` list — otherwise every attraction mutation (new stop object reference) used to jump the timeline back to day 1.
- **Weekday labels are locale-aware:** `days()`'s `dow` calls `d.toLocaleDateString(this.locale.current(), {weekday:'short'})`, not `undefined` (which silently used the OS locale instead of the app's compiled bundle).
- **`.tl-days` horizontal scroll:** nested flex containers need `min-width: 0` + `flex-wrap: nowrap` + `overflow-y: hidden` in `src/styles.css`, or the day-tabs row refuses to shrink and pushes content below it down the page instead of scrolling horizontally.

### Weather chips (`WeatherService`, Feature 61)

`providedIn: 'root'`, mirrors `FavoritesService`'s cache pattern but keyed per `(cityId, checkIn, checkOut)` (`tb:weather:{cityId}:{checkIn}:{checkOut}`) storing an `ETag` instead of a TTL — `load()` always calls the API sending `If-None-Match`, so an unchanged combo is a cheap 304 (weather genuinely changes as the date approaches, so an indefinite client cache would go stale). `DayTimelineComponent` calls `load()` once per changed `(cityId,checkIn,checkOut)` tuple, rendering a chip per day-tab: icon (`getWeatherCodeMeta`) + `tempMaxC`. `type:'forecast'` = full color; `'historic'` = grayscale + "?" tooltip (estimate from same date last year); `'unavailable'`/no data = no chip.

### Trip Map (`TripMapComponent`, `shared/trip-map/`)

Read-only, geographically-accurate map of a trip's cities: `data/city-coords.data.ts` (`CITY_COORDS`, generated by the root `lib/build-city-coords.mjs` — same script Feature 61's weather lookup uses server-side, now with a frontend output target too) + `data/world-map-outline.data.ts` (`WORLD_MAP_LAND_D`, a single flattened SVG path generated by the root `lib/build-world-map-svg.mjs` from Natural Earth's public-domain 110m land dataset) + `core/maps/latlng-projection.util.ts` (`latLngToSvgPoint()`, equirectangular projection into the shared `viewBox="0 0 100 50"` space — 2:1, not square, to preserve real longitude:latitude proportions).

`TripMapComponent` takes `cities: TripMapCity[] = {cityId, stopId?}[]` — deliberately not `TripStop[]`/`Trip`, so any host (a saved trip, a shared trip, or an in-progress plan with only picked cities so far) can feed it by mapping its own model down to that shape. `interactive` gates whether clicking a pin (only those with a `stopId`) emits `pinClick`; `showFlightPath` (independent of `interactive`) toggles an animated dashed route + flying plane, reusing `AboutComponent`'s existing flight-path CSS technique (`offset-path` + `stroke-dashoffset` reveal) — nested as SVG children of the same `viewBox`, not a separately-positioned HTML overlay like `AboutComponent`'s, so the animation stays correctly aligned at any container size, not just a fixed pixel width.

Three integration points: `DayTimelineComponent`'s `showTripMap` input (only set `true` on `ShellComponent`'s single trip-wide instance, same convention as `showPlanSlideshow`) opens it in a fullscreen modal from the planning view; `SharedTripComponent`'s own `.shared-header` opens the same modal (its `DayTimelineComponent` usages are per-stop, not trip-wide, so the button lives at the page level there instead), with a pin click selecting that stop and scrolling its `#itin-city-<cityId>` card into view; `MyTripsComponent` embeds a small `interactive=false showFlightPath=false` thumbnail directly on each saved-trip card via the `.trip-map-thumb` CSS class.

Full design: `docs/superpowers/specs/2026-09-13-trip-map-design.md`; plan: `docs/superpowers/plans/2026-09-13-trip-map.md`.

### The shared-trip view (`?share=<id>` / `/shared/:id`)

`SharedTripComponent` is the entire app when a share link is opened: `ApiService.getSharedTrip(id)` → read-only itinerary + step comments, full `<app-nav>`, `<tb-day-timeline>`. Clone calls `cloneSharedTrip(shareId)` then `savedPlans.register()` + `tripService.restoreStops()`. `AttractionPreviewPopoverComponent` shows a hover popover. `sortedAttractions(stop)` sorts by date then `startTime` **for display only** (never mutates `selectedAttractions`); template renders a `.itin-day-divider` when the sorted date changes between rows in the same city card.

### Nav architecture — device split (Feature 41)

| File | Role |
|---|---|
| `core/device/device.service.ts` | `providedIn:'root'`; wraps `matchMedia('(max-width: 768px)')`, exposes `isMobile` signal + `isDesktop` computed |
| `features/nav/nav-facade.service.ts` | `providedIn:'root'`; owns all header/menu state + methods (`toggleUserMenu`, `doSavePlan`, `doLoadPlan`, `doLogout`, etc.); both bars inject it |
| `features/nav/shared/auth-modal.component.ts` | Login/register/OTP form + Turnstile lifecycle; rendered once by the shell |
| `features/nav/desktop/nav-desktop.component.ts` | Desktop top bar; templates reference `facade.*` |
| `features/nav/mobile/nav-mobile.component.ts` | Compact bar + slide-in drawer; local `drawerOpen` signal |
| `features/nav/nav-shell.component.ts` | Selector `app-nav` (stable); switches `<app-nav-desktop>`/`<app-nav-mobile>` on `device.isMobile()`; renders auth-modal + karma overlays once |

**Search:** `normalizeSearch()` (lowercase + NFD-strip diacritics, e.g. `"Bogotá"` matches `"bogota"`) backs every filter (`filteredPlans`, `filteredFavorites`, `filteredSharedTrips`, `navFiltered`) — reuse for new search boxes.

**Every mobile drawer action must close `drawerOpen` itself** — it's `NavMobileComponent`'s own local signal, unreachable from the facade. Each drawer button wraps its facade call in a local handler that also does `this.drawerOpen.set(false)`.

**Desktop user-panel** closes on outside `mousedown` (not `click`, so it can't out-race a legitimate in-panel click) via `ElementRef.contains`.

**Breakpoint:** `(max-width: 768px)`, matches `src/styles.css` `@media` blocks; crossing it live-updates `isMobile` with no reload.

**Call sites** (`ShellComponent`, `AiPlanningComponent`, `SharedTripComponent`, `AboutComponent`, `ProfileComponent`, `MyTripsComponent`) all use `<app-nav>`. `NavShellComponent`/`NavDesktopComponent`/`NavMobileComponent` take `activeView = input<'profile'|'mytrips'|null>(null)` to highlight the current page's nav button.

**`NavFacadeService.closeOverlaysRequestId`** (monotonic counter) is bumped by `doLoadPlan()`, `onLogoClick()`, `doNewTrip()` — anything that restores `TripService` stops from elsewhere should surface the app-mode editor; `ShellComponent`'s constructor effect closes `showProfile`/`showMyTrips`/`showAiPlanning` whenever it changes, since the facade can't reach those signals directly. Same "counter the child can't reach into, parent reacts" pattern used by `pendingMyTripsTab`.

**`app-nav { display: block }` required** in `src/styles.css` — custom elements default to `inline`, which would leave `.landing-scroll` flush with the page top.

**`.landing-scroll`/`.landing-snap-child` mobile overrides must appear *after* the default rules** in `src/styles.css` (equal specificity → later rule wins regardless of media-query nesting order).

**"Mis viajes" navigates from anywhere:** the button calls `NavFacadeService.openMyTrips(tab?)` directly (sets `pendingMyTripsTab` + `router.navigateByUrl('/')`) instead of each host emitting/interpreting its own output — `myTripsClick`/`openMyTrips` outputs were removed.

### Auth flow — OTP registration + Turnstile

Login is one step. **Registration is two steps**: form → email OTP (`AuthService.requestOtp(email)` → `POST /auth/request-otp`; `register(name, email, password, otpCode)`). Both require a Cloudflare Turnstile token (`#tb-turnstile`, `AuthModalComponent.renderTurnstile`/`destroyTurnstile`/`resetTurnstile`); submit disabled until `captchaToken()` non-empty. Registration also shows a password-strength indicator.

**Every submit button has its own `*Loading` signal** (`otpLoading`, `registerLoading`, `resetLoading`, `loginLoading`) disabling the button + swapping label for a spinner while in flight — add one for any new submit path; captcha/OTP-length gates alone don't block resubmission with already-valid inputs.

**OTP digit filtering must also reset the live DOM value**, not just the signal — `[value]` bindings only re-apply when the *bound* value differs from the previous render, so a filtered `''→''` (rejected char) left the character visibly stuck. `onOtpInput`/`onResetOtpInput` write the filtered string back onto `(event.target as HTMLInputElement).value` directly. Apply this pattern to any other type-as-you-go numeric filter.

**Registration requires accepting Terms of Service:** `acceptTerms` checkbox (links `/terms`/`/privacy`) gates the "Enviar código →" button; reset on modal close / re-entering register, but **not** by `goBackFromOtp()` (consent shouldn't be discarded by fixing a typo'd email).

### JWT token storage and rotation

Access token lives **in-memory only** (`_token` signal in `AuthService`) — XSS-safe, never in browser storage. **Refresh token is an `HttpOnly` cookie set/read by the backend** — frontend never touches it. All four auth calls (`login`/`register`/`refresh`/`logout`) send `{withCredentials: true}`. `tb_session_user` in `localStorage` is a non-sensitive marker meaning a session *may* exist; the backend confirms via the cookie.

| Event | What happens |
|---|---|
| Login/Register | `setTokens(token, user)` stores access token, persists `tb_session_user`, schedules proactive refresh |
| App start (marker present) | Constructor defers `refreshAccessToken().subscribe()` via `queueMicrotask` (see NG0200 below); 401 just leaves user logged out |
| Proactive refresh | Reads JWT `exp`, fires 60s before expiry |
| 401 response | `AuthInterceptor` refreshes then retries the original request once |
| Logout | `POST /auth/logout` (fire-and-forget) + `clearTokens()` |

`refreshAccessToken()` dedupes concurrent callers via a shared `_refreshInFlight` Observable, reset to `null` in `finalize()`.

**`AuthInterceptor`** attaches `Authorization: Bearer <token>` to every request except `/auth/refresh`; retries once after a successful refresh on 401, else re-throws + `clearTokens()`. **Boot race:** if `auth.sessionMayExist()` is true but the in-memory token isn't restored yet (right after reload), it waits on the deduped refresh before sending *any* request. Also attaches `X-Anonymous-Id: <AnonymousIdService.get()>` to every outgoing request.

**Critical gotcha — NG0200 circular DI on the constructor's silent refresh:** `AuthService`'s constructor must **never** call `refreshAccessToken().subscribe()` synchronously — that dispatches through `AuthInterceptor`, which `inject(AuthService)`s while Angular is still constructing that very singleton, throwing `NG0200` before the request ever reaches the network. The swallowed error then calls `clearTokens()`, wiping `tb_session_user` on every reload (this was the real root cause of the "session lost on refresh" bug, not a timing race). Fix: `queueMicrotask(() => this.refreshAccessToken().subscribe())`. Jest specs use a mocked `AuthService` and Playwright mocks the API, so neither catches this — only a live backend with a real marker present at construction time reproduces it. Regression test: `auth.service.spec.ts` ("boot-time silent refresh (NG0200 regression)") wires the real interceptor via TestBed.

**Storage keys:** `tb_refresh_token` → HttpOnly cookie (backend-set, not JS-readable); `tb_session_user` → `localStorage`, `{name, email, countryOfResidence?}`; `tb_token` (legacy) → purged on init.

### `ProfileComponent` — edit account accordion

Three rows: Nombre, Contraseña, País de residencia (ISO2; no email-change row — removed from the profile page, though `AuthService.requestProfileOtp`/`updateProfile({newEmail, otp})` remain in the service layer unused by any UI). All signals prefixed `edit*`.

**País de residencia requires explicit Guardar/Eliminar** (no auto-save-on-select): picking a country only sets a pending `editCountryOfResidence`; `editSaveCountryOfResidence()` commits via "Guardar" (disabled until changed). "Eliminar" (shown only when a country is set) calls `HomeAddressService.clear()` → `updateProfile({countryOfResidence: null})` — explicit `null` means clear.

**Signal gotcha:** never read `auth.currentUser()` inside an `effect()` without `untracked()` — `updateProfile()` calls `_user.set()`, so an untracked read re-fires the effect on every save, wiping the ✓ before it renders.

**`effect()` writing signals** needs `{allowSignalWrites: true}` as the second arg or Angular throws `NG0600`.

### Button loading/success UX pattern

```html
@if (loading()) {
  <span class="btn-spinner"></span> Guardando…
} @else if (savedTab() === 'name') {
  ✓ Guardado
} @else {
  Guardar nombre
}
```

Delay clearing the success signal until the `onComplete` callback in `markSaved` — otherwise Angular batches the changes into one render where the button is already gone.

### Comment flow (attraction comments)

`DestinationComponent.ngOnInit()` loads all of a city's comments in one `getCommentsBatch(ids)` call → `allComments = signal<Record<string, Comment[]>>({})`. `AttractionDetailModalComponent` gates comment submission on `auth.isLoggedIn()` (else opens login modal); 402s route through `KarmaModalService.handleKarmaError(err)`. `CommentModalComponent` is rating stars + textarea; avatar color is deterministic from the user's initial. After a shared-trip step comment, `CommentCooldownService.startCooldown(seconds)` drives a nav-bar countdown; a too-similar comment shows `CommentSimilarModalComponent`.

### AI attraction suggestions (`CitySuggestCloudComponent`)

Fullscreen comic-chat overlay from a stop card's "🐾 Sugiere qué hacer en esta ciudad" button; reparents to `document.body` via `Renderer2` (same technique as `AttractionImageLightboxComponent`) to win stacking order over `<app-nav>`. **Closes only via ✕ or Escape** — backdrop/scene clicks deliberately do not dismiss it (don't re-add that), to avoid discarding an in-progress selection by accident.

### Visa requirement badge (`VisaRequirementService`, Feature 62)

Pure synchronous lookup, `requirement(homeIso2, destIso2)`, into a static bundled 199×199 matrix (`src/app/data/visa-requirements.data.ts`, generated from `visualpharm/visa-free-dataset` by `lib/build-visa-matrix.mjs`) — **no backend endpoint**, ships in the bundle like `cities.data.ts`/`attractions-curated.ts`. `StopListComponent`'s per-stop card shows a category-only badge from the destination ISO2 + the user's `countryOfResidence`; no country set → "set your country" CTA chip (opens profile); logged out → nothing. Never persisted — a live per-viewer lookup, since a trip can have collaborators/anonymous viewers with different home countries. `ProfileComponent`'s former free-text "Ciudad de origen" is now "País de residencia" via `CountryComboboxComponent`.

**Gotcha — a rounded card's `overflow: hidden` clips popover children too**, not just corners. The edit-account card dropped its wrapper-level `overflow: hidden` (was there only to round hover fills) in favor of rounding the flush first/last accordion buttons individually, so `CountryComboboxComponent`'s dropdown isn't clipped. Any future collapsible that might host a popover-bearing child should default to `overflow: visible` and round flush edges individually instead.

### Currency & plug info badges (`TravelInfoService`, Feature 63)

Same static-dataset pattern as Feature 62 (`src/app/data/travel-info.data.ts`, from `annexare/Countries` + `benjiao/world-plugs`). `StopListComponent` adds `currencyBadge(city)` and `plugBadge(city)` — shown to **every** viewer (facts about the destination, not the viewer). Only the "adapter needed" qualifier on the plug badge needs a known `countryOfResidence`; when unknown it just omits the qualifier (Feature 62 already owns the one "set your country" CTA per card). **No live exchange rates** — deliberately name+symbol only, same reasoning as rejecting a live visa API.

**2026-09-07:** the three always-visible per-stop badges were replaced by one `CityInfoBadgeComponent` (hover/focus/tap popover revealing whichever apply), and the weather chip was extracted into `CityWeatherChipComponent` — both shared between `StopListComponent` and `SharedTripComponent`'s `itin-city-head`. Each `CityWeatherChipComponent` instance loads its own weather (already de-duped/cached).

### Companion mascot nudges (`CompanionMascotComponent`)

`CompanionSuggestionService.trigger()` fires once, fire-and-forget, right after a **direct user action** (`AttractionCardComponent`/`AttractionDetailModalComponent`'s `onPlanConfirmed`) — **never** from `CitySuggestService.addAll()`'s batch loop (would stack multiple popups). Doesn't wait for `state==='idle'`; a new call simply overwrites a pending one. **Silent until 200** — a rate-limited/miss/error `204`/network-error shows nothing at all; only a real `200` shows the sniffing dog, then swaps to the speech-bubble card after a fixed 2.5s reveal delay. **No auto-dismiss** — stays until ✕/"No, gracias"/"➕ Agregar"; no backdrop close either. `dismiss()`/`accept()` cancel any pending reveal timer.

`accept()` also calls `TripService.setActive(stopId)` + `requestDayJump(stopId, dayKey)` before adding the attraction — `dayJumpRequest` is a one-shot request any mounted `DayTimelineComponent` showing that stop consumes via a constructor `effect()` (switch day, expand on mobile, `consumeDayJumpRequest()`), since the suggestion's day may not match the currently-open tab.

`CompanionBoostCardComponent` (profile page) calls `boost()` (−2 karma, `POST /companion/boost`) to raise the roll chance 20%→75% for 24h from purchase; renders a live countdown that reverts itself at zero without waiting on `refreshBoostStatus()`, but still calls that on init for server-authoritative TTL.

**Backend dependency:** `POST /ai/suggest-companion`, `POST /companion/boost`, `GET /companion/status` on the manager repo (`feat/companion-suggestions`) — `environment.useMocks` covers local dev without it.

### Highlight tour (onboarding spotlight walkthrough)

`src/app/shared/highlight-tour/` — config-driven spotlight tour: gray veil + cutout around one element + a mascot dog speech bubble. `HighlightRegistryService` (`Map<string,HTMLElement>`) is populated by `HighlightTargetDirective ([tbHighlightTarget])` so targeting survives the desktop/mobile split. Content lives in `highlight-tours.config.ts` (`HIGHLIGHT_TOURS: Record<HighlightType, HighlightStep[]>`) — a new tour is a data-only change. `HighlightTourComponent` reparents to `<body>` via `Renderer2`.

**Shipped tour:** `landing_welcome`, 2 steps (spotlight "Iniciar sesión" then "🐾 Crear con IA"), shown once to an anonymous visitor on the empty-trip landing page. Trigger guard: `!auth.isLoggedIn() && !auth.sessionMayExist() && trip.stops().length === 0` — the `sessionMayExist()` half specifically avoids flashing the tour at a real returning user during the boot-time silent-refresh window.

**Three-layer "already seen" tracking**, checked in order by `HighlightSeenService`:
1. `sessionStorage` (per-tab/type) — checked first; only calls `GET /highlights/:type/status` if uncached, caching the answer either way.
2. Redis, keyed `u:{userId}` → `a:{anonymousId}` → `ip:{req.ip}`; TTL-bound (default 86400s), not permanent.
3. Postgres `user_highlight_views` — logged-in users only, the permanent record.

`AnonymousIdService` generates one UUID per browser profile in `localStorage` (`tb_anonymous_id`, deliberately not sessionStorage) sent as `X-Anonymous-Id` on highlight endpoints and login/register, so a backend migration can fold anonymous state onto a fresh account.

**Mobile: each step scrolls its target into view** (`scrollIntoView({block:'center', behavior:'smooth'})` in `resolveCurrentTarget()`, gated on `device.isMobile()`) — the landing page stacks sections vertically on mobile, so a step's target often sits off-screen; desktop never has this problem.

**Confirm ≠ dismiss:** reaching the last step's "¡Entendido!" (or an auto-skip when a target never resolves) calls private `confirm()` → marks seen immediately (`POST /highlights/:type/seen`). Closing early (✕/Escape) calls private `dismiss()` → `POST /highlights/:type/dismiss`, which does **not** mark seen locally — the backend only escalates to "seen" after `HIGHLIGHT_DISMISS_LIMIT` (3) dismissals, so an early-bail visitor sees the tour again later; the frontend can't know from a bare 204 whether this dismissal crossed that limit, so it leaves the local cache alone.

**Critical gotcha — signal-tracking leak through a called method:** `start()` is called from inside `ShellComponent`'s own `effect()`; Angular attributes *any* signal read during an effect's synchronous execution to that effect, even reads performed inside a method the effect merely calls. `start()`'s synchronous guard read `_activeType`, silently making it a dependency of the host effect — dismissing the tour set `_activeType` to null, re-triggering the host effect, which called `start()` again, reopening a tour that `dismiss()` never marks seen. Fixed by wrapping `start()`'s entire body in `untracked(() => {...})`. Apply the same wrap to any service method called from inside an `effect()` that reads/writes its own signals internally, unless you specifically want those reads tracked. Regression test: `shell.component.spec.ts` ("does not reopen the landing_welcome tour after it is dismissed via close()").

Full design history: `docs/superpowers/plans/2026-08-16-highlights-module.md` (monorepo root).

### Data models

**`TripStop`** — optional `lodging?: Lodging` (`{name, url, address?, notes?}`; `address`/`notes` free-text, shown only on the Hospedaje export sheet). `LodgingComponent` renders between stops via `TripService.setLodging()`/`removeLodging()`.

**`TransitLeg`** — multi-segment: `segments: TransitSegment[]`, each with `mode`, `departureDate/Time`, `arrivalDate/Time`, `notes`, optional `carrier` and `locationUrl` (via `attractionMapsUrl()`). Legacy single-mode format migrated by `migrateTransitLeg()`.

**`PlannedAttraction`** — optional `ticketPurchased?: boolean` (`setTicketPurchased()`), shown only on entries whose attraction has a `ticketUrl`.

**`FavoritedTrip`** — `trip.model.ts`, keyed by `shareId`. `FavoritesService.seedFromPayload()` initializes the set from trip-payload data without a round trip.

### XLSX itinerary export — `ticketRequiredIds`

`ApiService.exportItinerary(id, cityNames, attractionNames, ticketRequiredIds)` posts `POST /trips/:id/itinerary`, streams the `.xlsx` blob. Both call sites (`DayTimelineComponent.exportItinerary()`, `MyTripsComponent.downloadItinerary()`) build the three payload maps via shared `buildItineraryExportMaps(stops)` (`core/utils/itinerary-export.util.ts`) — it loops `getAttractions(city)` per stop, flagging `ticketRequiredIds` for any curated attraction with a `ticketUrl` (the frontend is the only place that knows this). Everything past that (blob download, karma spend, toasts, mock-mode branch) still differs per call site.

### Karma rules

| Action | Effect |
|---|---|
| Comment on someone else's shared trip (first time per step) | +1 |
| Create a new blank trip | −1 |
| Clone a trip (shared or own) | −1 |
| AI suggest | −9 |
| AI plan (first or major re-plan) | −1 |
| AI plan (minor re-plan, ≤20% change, up to 3 free per session) | 0 |
| AI attraction suggestions for a stop (first request per stop-card click) | −2 |
| AI attraction suggestions "🔄 Buscar más opciones" (follow-up, `isFollowUp: true`) | 0 |

402 errors mean insufficient karma — always route through `KarmaModalService.handleKarmaError(err)`.

### AI Plan Timeout Resilience & History (Feature 59)

`ApiService.planTrip()` keeps its `Observable<PlanTripResponse>` signature but now kicks off `POST /ai/plan` (returns `{requestId}`) and polls `GET /ai/plan/:requestId/status` every 15s until non-`pending`. `AiPlanningComponent.executePlan()` layers a 15s `setTimeout` (`planTakingLong`) showing a dog+bubble with **Esperar** (no-op) / **Notificarme** (unsubscribes the poll; backend keeps generating and notifies via the bell). `ai_plan_ready`/`ai_plan_failed` notifications route through `NotificationBellComponent` to `pendingMyTripsTab.set('aiplans')` + navigate home.

**"Planes IA Pendientes" tab** (`MyTripsComponent`) is a to-do list, not an archive: no reload-into-editor; a completed row's `ai_plan_requests` row is deleted (`deleteAiPlanHistoryItem()`) the moment it's saved via `AiPlanningComponent.save()`. A failed row shows a "Karma reembolsado" note when refunded + a manual "🗑️ Descartar" (soft-deletes server-side). `AiPlanViewPayload` carries `{result, requestId}` through `ShellComponent.pendingAiPlanResult` into `AiPlanningComponent.initialResult`; `currentAiPlanRequestId` tracks which row backs the displayed plan for `save()`.

Both the fresh-`executePlan()` success path and the revisited-card path call `triggerPlanReadyCelebration()` (2.6s fullscreen confetti/`ai-plan-ready.gif`) before opening `PlanSlideshowComponent`.

### `TimePickerComponent` — flatpickr only commits on blur/Enter/arrows

flatpickr's `onChange` only fires on a "committed" value (blur, Enter, arrows) — typing digits then immediately clicking "Confirmar" without blurring never emitted a change. `ngAfterViewInit()` also attaches raw `input` listeners directly to `fp.hourElement`/`minuteElement`, emitting `timeChange` on every keystroke once both parse as valid numbers. **Keep both paths** — removing the raw listeners reintroduces the bug.

### Left-panel planned-attraction ordering (`StopListComponent`)

`plannedSorted(stop)` sorts `selectedAttractions` by date (fallback: check-in) then `startTime` for display — the underlying array stays in add order. The template must `@for` over `plannedSorted(stop)` (tracked by `entryId`, not `attractionId`), never `stop.selectedAttractions` directly.

### Date format

All dates are `dd/mm/yyyy` strings. `TripService` parses these for sorting; `DateRangeComponent`/`DatePickerComponent` (flatpickr wrappers) always emit this format.

### Attraction categories

`core/models/attraction-category.ts`: `AttractionCategory = 'poi'|'freetour'|'event_party'|'foodie'`; `CATEGORY_META` maps each to `{code, label, icon, bg, defaultSubcategoryLabel}`; `ALL_CATEGORIES = Object.values(CATEGORY_META)` drives the filter-chip row.

| Category | bg |
|---|---|
| `poi` | `#E8F0FD` |
| `freetour` | `#E8FDE8` |
| `event_party` | `#FDE8F5` |
| `foodie` | `#FDF5E8` |

`.att-filter-chip` active state uses `[style.--chip-bg]="cat.bg"`. `AttractionCardComponent` sets `[style.background-color]="categoryBg()"` on the card root; sub-sections use `background: transparent` to inherit it.

### Attractions data layer

`src/app/data/attractions.data.ts` → `getAttractions(city)` builds from four sources in order (`attractions-curated.ts` is ~134k lines):
1. **`CURATED_ALL`** (`attractions-curated.ts`, UNESCO pipeline output) — filtered by `active: true`; HTTP image URLs stripped (`stripInsecureImages()`, mixed-content safety).
2. **`REGION_TMPL`** fallback for uncurated cities — synthetic runtime IDs `${city.id}_${i}`, deterministic per-index rating (`hashRating()`).
3. **`FREETOURS_CURATED`** (`freetours-curated.ts`, Civitatis scrape) — appended for cities with freetours.
4. **`EVENTS_CURATED`** (`events-curated.ts`, from `refresh-tm-events.mjs`/Ticketmaster, IDs `ev_`) — `category: 'event_party'` with a fixed `date`/`time` (see `PlanTimeModalComponent`'s locked mode).

`findCuratedAttraction(cityId, attractionId)` searches all three curated sources regardless of `active` state — use when rendering existing trip stops that may reference inactive attractions.

#### Stable attraction IDs — NEVER change them

Every `attractions-curated.ts` entry has a permanent `id = "${cityId}_${index}"`; freetours use `"ft_${cityId}_${index}"`. **Write-once** — they're stored in Postgres (`planned_attractions.attraction_id`), in `TripService`'s `localStorage`, and as comment keys (`attraction_comments.attraction_id`).

- Append new attractions to the end of a city's array (safe, gets the next index).
- Never reorder, remove, or renumber existing entries.
- `getAttractions()` uses `id` directly — it never recomputes it.

#### Soft-deleting an attraction — use `active: false`

`active: boolean` is required on every `Attraction`. **Never delete or reorder** — set `active: false` instead. `findCuratedAttraction()` bypasses the filter.

#### Freetours data pipeline (repo root)

`scrape-civitatis.mjs` → `freetours-by-city.json` → `enrich-civitatis.mjs` → `freetours-enriched.json` → `merge-freetours.mjs` → `src/app/data/freetours-curated.ts` (auto-generated, do not hand-edit; civitatis 0–10 rating halved to app's 0–5 scale).

`FeaturedSlideshowComponent` uses a hardcoded `CITY_COVER_PHOTOS` map of verified direct Unsplash CDN photo IDs — the old `source.unsplash.com` random-by-keyword endpoint is deprecated, don't use it.

### Day-timeline drag-and-drop (`day-timeline-drag.util.ts`)

Native HTML5 Drag and Drop (no `@angular/cdk`). Two custom MIME types: `NEW_ATTRACTION_MIME` (an `.att-card`, sets `{attractionId, category, estimatedMinutes}` on `dragstart`) and `RESCHEDULE_MIME` (an existing `.tl-block` not category-locked, sets `{stopId, entryId}`). `DayTimelineComponent.onGridDrop()` dispatches to `TripService.addAttraction()`/`updateStartTime()`; `snapMinutesFromOffset()`/`minutesToHm()` convert drop `clientY` into a 15-minute-snapped `HH:mm` against `#tlGridEl`'s rect.

**Reschedule lock** (`isRescheduleLocked()`): a `freetour`, or an `event_party` with a fixed `date`, can never be drag-rescheduled. Rescheduling preserves the block's original duration (`endTime − startTime`), not the catalog `estimatedMinutes`.

Dragging a new attraction only works with a valid day/stop selected, and is a no-op in transport mode.

**Mobile drag ghost (`TouchDragGhostService`):** desktop's native DnD gets a free drag-image preview; touch drag had none. A small `providedIn:'root'` sibling to `TouchDragService` (`{icon,label,x,y}|null` signal, `show()`/`move()`/`hide()`) driven by `AttractionCardComponent`'s and `DayTimelineComponent`'s touch handlers; `TouchDragGhostComponent` renders it as a `position: fixed` pill (`z-index: 2000`), mounted once at root in `ShellComponent`.

## i18n

Source locale `es-CL` (templates written in Spanish). After adding `i18n="@@id"`/`i18n-<attr>="@@id"` attributes, run `ng extract-i18n` to regenerate `messages.xlf`, then add matching `<trans-unit>`s to `src/locale/messages.en-US.xlf`.

Template constraint: arrow functions aren't allowed in event bindings — extract to class methods.

**External links:** never `[href]="dynamicUrl"` (Angular's sanitizer silently emits `unsafe:...`, blocking navigation). Use `window.open()` in a click handler:

```typescript
openWebsite(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  const url = this.attraction().website;
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
```

Keep `[attr.href]="url"` on the `<a>` for right-click/keyboard access — attribute binding calls `setAttribute()` directly, bypassing the sanitizer.

## CSS

All design tokens are `oklch()` CSS custom properties in `src/styles.css`. Component styles for transit/lodging/itinerary/shared-trip/step-comments/profile-accordion/day-timeline/**all landing sections** are global there too. Use existing tokens (`--lav`, `--lav-d`, `--peach`, `--t1`, `--t2`, `--t3`, `--border`, `--cream`, `--sh-lg`), not hardcoded colors.

Landing class prefixes: `.landing-scroll`, `.landing-snap-child`, `.s1-shell`, `.scroll-hint`, `.landing-slideshow-*`, `.landing-about-*`, `.landing-stat-*`, `.landing-footer-*`, `.reveal`/`.reveal.hidden`/`.reveal.in-view`, `.shake`.

**Full-page fixed-overlay stacking-context trap:** any `position: fixed; inset: 0; z-index: <N>` wrapper (e.g. `.ai-plan-page`) establishes its own stacking context, trapping a nested `<app-nav>` as a sibling compared only within it — since `<app-nav>`'s own z-index (200) is lower than e.g. `.shared-body` (210), scrolling content can paint over the "fixed" nav bar. Fix: a scoped bump, e.g. `.ai-plan-page .nav, .ai-plan-page .nav-m-bar { z-index: 220; }`. Any new full-page fixed wrapper that renders `<app-nav>` inside it needs the same override.

**`.profile-page` is the same trap via a different mechanism:** its `animation: profSlideIn` ends on a non-`none` `transform`, kept by `animation-fill-mode: both` — per spec, *any* non-`none` transform makes an element a containing block for `position: fixed` descendants, not just literal `position: fixed`. Scoped bump: `.profile-page .nav, .profile-page .nav-m-bar { z-index: 360; }` (above its own 350). Separately, `.prof-bar` needs `margin-top: 72px` to clear desktop's fixed 72px `.nav` (zeroed on mobile, where `.nav-m-bar` is `position: sticky` and already pushes content down).

Static design references: `../../landing-preview.html`, `../../landing-page-demo.html` (repo root) — landing color tokens, structure, animation keyframes.

## Production security headers

`vercel.json` ships an enforcing CSP + `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS, `Permissions-Policy`. CSP `script-src`/`frame-src` allow-list Turnstile and PayPal. Because inline `onload` handlers are forbidden, `angular.json` sets `optimization.styles.inlineCritical: false` — don't re-enable it or styling breaks under the enforced CSP.

## File Reference

Per-file index so a future session can find functionality without re-searching the tree. Sections above cover cross-cutting architecture in prose; entries below are terse and point back to those sections. Grouped by `src/app/` directory.

### Root & bootstrap

- `src/main.ts` — `bootstrapApplication(AppComponent, appConfig)`.
- `src/app/app.component.ts` — `AppComponent`: bare `<router-outlet />`.
- `src/app/app.component.html/.css` — dead code (unused scaffold; `AppComponent` uses an inline template). Safe to delete.
- `src/app/app.config.ts` — `appConfig`: registers `es-CL`/`en-US` locale data, `provideRouter`, `provideHttpClient(withXhr(), withInterceptors([authInterceptor]))`, three `APP_INITIALIZER`s (sync `<html lang>`; run `shareRedirectPath()` once at boot; `handleMpReturn` — detects `?mp_purchase=<ref>&mp_status=...` on boot via `core/karma/mp-return.util.ts`, strips it, and calls `KarmaModalService.openMpConfirmation()` to reopen the buy modal into its MercadoPago confirmation step, Feature 15).
- `src/app/app.routes.ts` — see "Top-level routing" above.
- `src/index.html` — `<app-root>` mount, Turnstile script tag, favicon, `<base href="/">`.
- `src/environments/environment.ts` — dev config: `useMocks: false`, `autoSaveIntervalMs`, dev RSA key + Turnstile test key, empty PayPal id.
- `src/environments/environment.production.ts` — same shape, `*_PLACEHOLDER` values patched by `scripts/patch-env.mjs` at build time.

### data/

- `data/cities.data.ts` — `WORLD_CITIES: City[]`, ~600+ entries/6 regions. Adding a city triggers re-running `lib/format-unesco.mjs` (root `CLAUDE.md`).
- `data/attractions.data.ts` — `getAttractions()`/`findCuratedAttraction()`/`stripInsecureImages()` — see "Attractions data layer" above.
- `data/attractions-curated.ts` — `CURATED_ALL: CuratedMap`, ~134k lines. See "Stable attraction IDs"/"Soft-deleting" above before editing.
- `data/freetours-curated.ts` — `FREETOURS_CURATED`, auto-generated (`ft_<cityId>_<index>`, write-once). Do not hand-edit.
- `data/events-curated.ts` — `EVENTS_CURATED`, auto-generated by `refresh-tm-events.mjs` (`ev_<cityId>_<ticketmasterId>`, `category:'event_party'` fixed date/time). Do not hand-edit; some cities have harmless duplicate consecutive entries from the source feed.
- `data/city-coords.data.ts` — `CITY_COORDS: Record<string, {lat,lng}>`, generated by the root `lib/build-city-coords.mjs`. See "Trip Map" above.
- `data/world-map-outline.data.ts` — `WORLD_MAP_LAND_D: string`, generated by the root `lib/build-world-map-svg.mjs` from Natural Earth's public-domain 110m land dataset. See "Trip Map" above.

### mock/

- `mock/comments.mock.ts` — `MOCK_COMMENTS`, keyed by attraction id, `useMocks` only.
- `mock/trips.mock.ts` — `MOCK_TRIPS`, two seed trips, `useMocks` only.

### core/ai

- `core/ai/attraction-catalog.service.ts` — `getCityIndex()` (lightweight `{id,name}` per city, memoized once) / `getCityCatalog(cityIds)` (per-city attraction lists, `Map`-memoized) — city-scoped AI payload builder, see "City-scoped AI payloads" note in Karma/AI sections above.
- `core/ai/city-suggest.service.ts` — `CitySuggestService`: state behind `CitySuggestCloudComponent`. `request()` opens+fetches (costs karma); `searchMore()` re-fetches with `isFollowUp:true` (free); `addAll()` adds selected via `TripService.addAttraction`; 402 → `KarmaModalService`. In-memory only.
- `core/ai/companion-suggestion.service.ts` — see "Companion mascot nudges" above. Extra: `_boostExpiresAt` is a raw epoch-ms the UI ticks against; `_boostJustPurchased` is a counter (not boolean) for one-time celebration; `refreshBoostStatus()` no-ops when not logged in.
- `core/ai/plan-change-detector.util.ts` — mirrors backend dual-baseline change detection. Exports `CHANGE_THRESHOLD` (0.20), `FREE_CHANGE_LIMIT` (3), `levenshtein()`, `serializeOptions()`, `computeChangeRatio()`, `isMinorChange()`, `toSessionOptions()`. Full `AiPlanningComponent` mechanism documented under "AI Plan Change Management (frontend)" note above (see also `features/ai-planning` entry below).

### core/anonymous-id

- `core/anonymous-id/anonymous-id.service.ts` — `AnonymousIdService.get()`: one UUID/browser profile in `localStorage` (`tb_anonymous_id`); falls back to an uncached fresh UUID if storage throws.

### core/api

- `core/api/api.service.ts` — `ApiService`: single HTTP gateway, every method branches on `useMocks`. Groups: **trips** `getTrips/saveTrip/updateTrip/deleteTrip/shareTrip/cloneOwnTrip/cloneSharedTrip/exportItinerary`; **comments** `getComments/getCommentsBatch/addComment`; **karma** `getKarma/getKarmaPackages/createKarmaOrder/captureKarmaOrder/updateKarmaMock/getKarmaEvents`; **AI** `suggestTrips`/`planTrip`/`suggestCityAttractions`/`suggestCompanion`/`boostCompanion`/`getCompanionStatus`; **favorites** `toggleFavorite/getFavorites`; **shared trips** `getSharedTrip/getStepComments/addStepComment/searchSharedTrips`; **highlights** `getHighlightStatus/markHighlightSeen/markHighlightDismissed`; **notifications** `getNotifications/getNotificationStatus/markNotificationsRead/setNotificationsMuted`; **featured/stats** `getFeatured`/`getStats` (24h cache); **collaborators** `inviteCollaborator/acceptCollaboratorInvite/removeCollaborator/getCollaborators/getPendingInvites`.

### core/auth

- `core/auth/auth-modal.service.ts` — in-memory `_open` signal + one-shot `_postLogin` callback (`openLogin(onSuccess)` / `executePostLogin()`).
- `core/auth/auth.guard.ts` — `authGuard`: redirects to `/` unless `isLoggedIn()`; when `isLoggedIn()` is false but `AuthService.sessionMayExist()` is true (in-memory token not yet restored on a fresh page load), awaits the deduped `refreshAccessToken()` before deciding rather than redirecting immediately — see "Karma history page" above for why this matters.
- `core/auth/auth.interceptor.ts` — see "JWT token storage and rotation" above.
- `core/auth/auth.service.ts` — see "JWT token storage and rotation" above. Also: `login`/`register`/`resetPassword`/`updateProfile`/`requestOtp`/`requestProfileOtp`/`requestPasswordReset` RSA-OAEP-encrypt payloads client-side (`encryptPayload()`, WebCrypto; skipped in mock mode); `classifyHttpStatus()` maps HTTP status → `RATE_LIMITED`/`UNAUTHORIZED`/`BAD_REQUEST`/`UNKNOWN`.
- `core/comments/comment-cooldown.service.ts` — `cooldownSeconds` (1s tick, `startCooldown()`), `shaking` (600ms, `triggerShake()`).

### core/device

- `core/device/device.service.ts` — see "Nav architecture" above.

### core/favorites

- `core/favorites/favorites.service.ts` — see "Core services" table above; 24h cache `tb:favorites:cache:<email>`.

### core/home-address

- `core/home-address/home-address.service.ts` — `address` is a `computed()` over `currentUser().homeCity` (owns no signal itself); `save()` → `updateProfile({homeCity})`; one-time legacy-`localStorage` migration on construction (kept on failure for retry).

### core/i18n

- `core/i18n/locale.service.ts` — `LocaleService`: `current()`/`other()` from `LOCALE_ID`. `persist(target)` writes only the `tb_locale` cookie (1yr, never touches URL — a Vercel edge rewrite serves the matching bundle). `switchTo(target, restoreView?)` persists + optionally stashes the open panel (`tb_restore_view`, one-shot `consumeRestoreView()`) + reloads.
- `core/i18n/locale.util.ts` — `AppLocale`, `RestoreView`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE` (es-CL), cookie/storage keys, `isSupportedLocale()`, `otherLocale()`.

### core/karma

- `core/karma/karma-modal.service.ts` — `handleKarmaError(err, fallback?)`: regexes `"need N, have M"` out of the 402 message, opens the insufficient modal. Route every 402 through this. `openMpConfirmation(purchaseRef, status)` (Feature 15) sets the `mpConfirm` signal and opens the buy modal straight into its MercadoPago confirmation step; `closeBuy()` clears both `buyOpen` and `mpConfirm`.
- `core/karma/karma.service.ts` — see "Core services" above; mock mode optimistically mutates + persists, real mode re-fetches authoritative balance. `spend()`/`gain()`/`purchaseComplete()` accept optional `reason`/`targetId`, recording a mock-mode ledger — see "Karma history page" above.
- `core/karma/mp-return.util.ts` — `parseMpReturnParams(search)`/`stripMpReturnParams(search)` (Feature 15): parse/strip MercadoPago's post-checkout-redirect query params (`?mp_purchase=<ref>&mp_status=success|failure|pending`); consumed by `app.config.ts`'s `handleMpReturn` initializer.
- `core/models/karma-event.model.ts` — `KarmaEvent`/`KarmaEventTarget`/`KarmaEventsPage`/`KarmaEventReason`, `karmaReasonLabel()` — see "Karma history page" above.

### core/maps

- `core/maps/google-maps-url.util.ts` — keyless Google Maps URL helpers. `MAX_ROUTE_WAYPOINTS = 9`. `placeQuery()`, `attractionMapsUrl()`, `transitTerminalName(mode)` (null for bus/car → falls back to lodging), `dayRouteUrl()` (waypoints beyond cap silently dropped).
- `core/maps/latlng-projection.util.ts` — `latLngToSvgPoint(lat, lng)`: equirectangular projection into `TripMapComponent`'s shared `viewBox="0 0 100 50"` space. See "Trip Map" above.

### core/models

- `core/models/ai.model.ts` — `TripSuggestion` (carries `cityIds?`), `SuggestTripsResponse`, `CatalogEntry`/`CityCatalog`, `PlanSessionOptions`, `PlanChangeInfo`, `PlanTripRequest`/`Response`, `SuggestionScheduleEntry`/`Departure`, `CityAttractionSuggestion`, `SuggestCityAttractionsResponse`, `CompanionSuggestion`, `CompanionStatusResponse`.
- `core/models/attraction-category.ts` — see "Attraction categories" above. `getCategoryMeta()`/`getAllCategories()` are functions (not consts) so `$localize` runs lazily, not at import time.
- `core/models/city.model.ts` — `Region` union (10 regions), `City`, `REGION_LABELS` (module-level `$localize`).
- `core/models/comment.model.ts` — `Comment`, `StepComment`/`Result`, `DayHours`/`WeekDay`/`WeeklySchedule`, `TicketPrices`, canonical `Attraction` interface.
- `core/models/curated.model.ts` — re-exports `Attraction`; `CuratedMap = Record<string, Attraction[]>`.
- `core/models/featured-trip.model.ts` — `FeaturedTrip`, `AppStats`.
- `core/models/highlight.model.ts` — `HighlightType` (`'landing_welcome'` — new tours add here), `HighlightStatus`.
- `core/models/karma-purchase.model.ts` — `KarmaPackage` (price as string), `CreateOrderResponse`, `CaptureOrderResponse`.
- `core/models/notification.model.ts` — `NotificationType` (`comment|favorite|clone|purchase|collaborator_invite|collaborator_accepted`, unlisted types render via string fallback), `AppNotification`, `NotificationStatus`.
- `core/models/plan-slideshow.model.ts` — `SlideshowItem`.
- `core/models/trip.model.ts` — `PlannedAttraction`, `Lodging`, `TripStop`, `TransitMode`, `TransitSegment`/`TransitLeg`, `Planification`, `Trip` (co-editing fields `isCollaborator`/`ownerName`/`ownerEmail`), `Collaborator`, `PendingCollaboratorInvite`, `FavoritedTrip`.

### core/notifications

- `core/notifications/notification.service.ts` — 60s poll gated on `isLoggedIn()` (wrapped `untracked()`). `refreshStatus()` shakes the bell on count increase (never when muted). `openPanel()` fetches then marks-all-read, so freshly-fetched items stay visually "new" while the badge clears. `toggleMute()` optimistic.

### core/routing

- `core/routing/share-redirect.util.ts` — see "Top-level routing" above.

### core/saved-plans

- `core/saved-plans/auto-save.service.ts` — `AutoSaveService`: periodic auto-save tick + co-editing "off" reminder banner. `enabled` computed reads per-plan `tb_autosave_override_<planId>` override, default ON for own plans/OFF for collaborations. `commitSnapshot()` serializes `{stops,transits}`; `hasChangedSinceLastSave()` is a full deep-equal (not reference check). `start()` idempotent, no-ops if `autoSaveIntervalMs <= 0`; runs a cadence interval + a 1s countdown interval. `showReminderNow()` fires immediately on entering a collaboration with auto-save off.
- `core/saved-plans/saved-plans.service.ts` — `plans`+`pendingInvites` signals. Mock: `tb_saved_plans_<email>`; real: `ApiService` mapping `Trip`→`SavedPlan`. `upsert()` returns final id as `Observable<string>`; `register(plan)` adds an already-server-existing trip without a round trip.

### core/share

- `core/share/share-url.util.ts` — `buildShareLink()`, `buildWhatsappUrl()`, `shareTrip()` (Web Share API, WhatsApp fallback except user-cancel `AbortError`).

### core/shared-trips

- `core/shared-trips/shared-trips.service.ts` — mock-mode-only store (`tb_shared_trips`). `getTrip(id)` re-reads the *live* owner plan if `planId` is set, merging current stops/transits. `search()` via `normalizeSearch`, capped to 5. `getCommentCount()` stub (always 0).

### core/ui

- `core/ui/toast.service.ts` — single `message` signal, `show()`/`clear()`.

### core/utils

- `core/utils/attraction-description.util.ts` — `localizedDescription()`: `descriptionEn` for en-US (fallback `description`), else `description`.
- `core/utils/attraction-hours.util.ts` — `getTodayKey()`/`getTodayHours()`/`formatHours()`/`formatTodayHours()`. Spanish-hardcoded (not `$localize`) — check before shipping en-US.
- `core/utils/attraction-images.util.ts` — `attractionImages()`: deduped photo list, `imageUrl` first.
- `core/utils/event-datetime.util.ts` — `dd/mm/yyyy` helpers: `parseDMY()`, `isDateInRange()` (incomplete range → `true`, unparseable → `false`), `formatEventChip()`/`formatEventLong()`.
- `core/utils/itinerary-export.util.ts` — see "XLSX itinerary export" above.
- `core/utils/normalize-search.util.ts` — see "Search normalization" above.
- `core/utils/password-strength.util.ts` — `computePasswordStrength()` → `'none'|'vulnerable'|'light'|'strong'`, `passwordStrengthColor()`, `isPasswordStrengthBarActive()`. Shared by `AuthModalComponent`/`ProfileComponent` (label text stays local to each).
- `core/utils/touch-drag-ghost.service.ts` — see "Day-timeline drag-and-drop" above.

### core/visited-places

- `core/visited-places/visited-places.service.ts` — `pins` signal, per-user `tb_visited_<email>`. `clear()` (logout) only clears the in-memory signal, not storage.

### features/nav

- `features/nav/nav-facade.service.ts` — see "Nav architecture" above.
- `features/nav/nav-shell.component.ts` — see "Nav architecture" above; re-emits `logoClick`/`profileClick`/`myTripsClick`.
- `features/nav/desktop/nav-desktop.component.ts` — desktop bar: logo, search+dropdown, language flags, karma pill + cooldown banner, `<app-notification-bell>`, login/avatar.
- `features/nav/mobile/nav-mobile.component.ts` — compact bar + drawer (local `drawerOpen`).
- `features/nav/mobile/nav-mobile.component.spec.ts` — drawer-close specs (local state the facade can't reach).
- `features/nav/shared/auth-modal.component.ts` — see "Auth flow" above; re-syncs `TripService`/`KarmaService`/`SavedPlansService`/`VisitedPlacesService`/`FavoritesService`/`CompanionSuggestionService` on success.
- `features/nav/shared/notification-bell.component.ts` — badge+shake, dropdown; `collaborator_invite`/`collaborator_accepted` route to My Trips' Colaboraciones tab, others via `shareRedirectPath()`.

### features/karma

- `features/karma/buy-karma-modal.component.ts` — package grid, PayPal/MercadoPago provider tabs (Feature 15; `selectedProvider` signal, defaults to `'paypal'`), lazy PayPal SDK (`ResizeObserver`-watched buttons) or mock "Simular compra" for either provider; success → `karma.purchaseComplete()` + `karmaGained` output. MercadoPago is a redirect flow, not in-page like PayPal: `payWithMercadoPago()` calls `POST /karma/purchase/mp/create-preference` then does a full `window.location.href` redirect to MercadoPago's hosted checkout; `confirmingPurchaseRef`/`confirmingStatus` inputs (bound from `NavShellComponent` off `KarmaModalService.mpConfirm()`) drive a `'mp-confirm'` step that polls `GET /karma/purchase/mp/status/:purchaseRef` every 2s (capped at 12 attempts) until the backend's webhook has completed the purchase, then shows the existing success/error states. See `docs/superpowers/plans/2026-04-28-backend-endpoint-contracts.md` §4.2–§4.5 and the manager repo's `CLAUDE.md` ("Payment: MercadoPago" section) for the backend half.
- `features/karma/insufficient-karma-modal.component.ts` — display of `KarmaModalService.insufficientData()` + "Comprar karma" CTA.
- `features/karma/karma-success-overlay.component.ts` — stateless celebration overlay.

### features/karma-history

- `features/karma-history/karma-history.component.ts` — `KarmaHistoryComponent`, routed `/karma-history` page — see "Karma history page" above for the full mechanism (pagination, error state, `goToTrip`/`goToAiPlan`).

### features/landing

- `features/landing/app-footer.component.ts` — static S4 footer.
- `features/landing/featured-slideshow.component.ts` — see "Landing mode" above.
- `features/landing/landing-about.component.ts` — see "Landing mode" above.

### features/about

- `features/about/about-initials.util.ts` — `getInitials(name)` avatar fallback.
- `features/about/about-team.data.ts` — `ABOUT_TEAM` array, `$localize`'d.
- `features/about/about.component.ts` — "flight path" team journey (photo/initials steps + animated plane SVG paths, `offset-path`), own `<app-nav>` + lazy `<app-profile>`.

### features/welcome

- `features/welcome/welcome.component.ts` — S1 of landing: `BackgroundSliderComponent` + overlay copy + 3 CTAs ("Crear Plan", "🐾 Crear con IA", "⭐ Cómo ganar Karma" info modal); own auto-advancing slideshow.

### features/shell

- `features/shell/shell.component.ts` — `ShellComponent` (`tb-shell`, router `''`). Landing vs app-mode switch on `trip.stops().length === 0`. Mounts every root-level singleton overlay (add-stop modal, mobile attractions modal, companion mascot, highlight tour, toast, autosave banner, profile/my-trips/AI-planning overlays). Constructor effects: re-trigger `loadForUser()` on account switch; sync/restore locale-switch view; open My Trips on `pendingMyTripsTab`; start `landing_welcome` tour per its guard.

### features/comments

- `features/comments/comment-similar-modal.component.ts` — static "comment too similar" modal, one `dismiss` output.

### features/my-trips

- `features/my-trips/my-trips.component.ts` — `.profile-page` overlay, own `<app-nav>`+`<app-profile>`. Tabs: **trips** (owned plans, itinerary expand, clone/delete, Excel export, publish/share, inline collaborators panel); **favorites**; **collaborations** (`isCollaborator` plans, "✏️ Modificar mi plan"); **invites** (`pendingInvites`, accept → jumps to collaborations). Consumes `pendingMyTripsTab` once.

### features/profile

- `features/profile/companion-boost-card.component.ts` — see "Companion mascot nudges" above.
- `features/profile/profile.component.ts` — `.profile-page` overlay: edit-account accordion (see above), password-strength meter, `<app-companion-boost-card>`, trip-summary card, visited-places world map (click-to-drop-pin).
- `features/profile/trip-itinerary.component.ts` — presentational city-card itinerary renderer (`stops`/`transits` inputs), incl. synthetic `__start__`/`__end__` legs.

### features/destination

- `features/destination/attraction-card/attraction-card.component.ts` — grid card: image/icon, plan button, footer rating/comments, enrichment strip, entry chips w/ ticket checkbox. Add → toast + `CompanionSuggestionService.trigger()`.
- `features/destination/attraction-detail-modal/attraction-detail-modal.component.ts` — full-info modal, hero carousel → lightbox, comments + auth-gated add. 409→similar-modal, 429→cooldown+shake, 402→karma modal. Self-closes after first plan-confirm.
- `features/destination/attraction-image-lightbox/attraction-image-lightbox.component.ts` — fullscreen viewer, reparented to `body`. Arrows/Escape/swipe(50px)/dots.
- `features/destination/attractions-list/attractions-list.component.ts` — search + category filter chips + card grid; resets filters on `city` input change. Shared by `DestinationComponent`/`MobileAttractionsModalComponent`.
- `features/destination/comment-modal/comment-modal.component.ts` — star rating + textarea.
- `features/destination/destination-modal.service.ts` — trivial open/closed signal.
- `features/destination/destination.component.ts` — desktop-only right-panel; batch-loads comments.
- `features/destination/mobile-attractions-modal/mobile-attractions-modal.component.ts` — mobile fullscreen equivalent; deliberately a sibling of `<app-nav>` (not nested in `.right-panel`, which can't stack above the sticky mobile nav). Own scroll-to-top FAB.
- `features/destination/plan-time-modal/plan-time-modal.component.ts` — date+time picker, locked/read-only for fixed events; `overlappingIds()` conflict warning; `isEditing()` toggles "Quitar del plan".

### features/planning

- `features/planning/day-timeline/day-timeline.component.ts` — see "App mode layout"/"Day-timeline drag-and-drop" above. `stop`/`transits` inputs override `TripService` for read-only contexts; `inline` disables mobile auto-collapse; `showPlanSlideshow` gates the presentation button (trip-wide instance only). Owns `days()`, `blocks()`, `routeUrl()`, `exportItinerary()`, `daySlideItems()`/`planSlideItems()`.

### features/shared-trip

- `features/shared-trip/attraction-preview-popover.component.ts` — positioned hover-card, purely presentational.
- `features/shared-trip/shared-trip.component.ts` — see "The shared-trip view" above. Per-step comment toggles keyed by string (`transit:__start__`, `stop:<cityId>`, `lodge:<cityId>`, `att:<cityId>:<attractionId>`, `transit:<from>:<to>`, `transit:__end__`). Favorite toggle optimistic w/ rollback.
- `features/shared-trip/step-comments.component.ts` — inline comment thread, 50-char minimum. Emits `focusLost` on outside click with empty input (guarded by `_ready`).

### features/trip (incl. trip/stop-list)

- `features/trip/trip.service.ts` — see "Core services" above. Public API: stop CRUD (auto-sorted by check-in), lodging, transit (keyed `fromCityId|toCityId`), active-selection (`setActive`/`selectTransit`, mutually exclusive), planned-attraction CRUD — all compute/persist `endTime` immediately via `addMinutesToTime()`.
- `features/trip/add-stop-modal/add-stop-modal.component.ts` — city+date-range form. `defaultCheckIn()` seeds from the latest stop's check-out. `consecutiveWarning()` non-blocking. Backdrop-close requires both `mousedown` and `click` on the backdrop (filters a mobile flatpickr ghost-click).
- `features/trip/stop-list/city-suggest-cloud.component.ts` — see "AI attraction suggestions" above.
- `features/trip/stop-list/lodging.component.ts` — see "Data models" above.
- `features/trip/stop-list/stop-list.component.ts` — the whole left panel: trip name header (autosave toggle+countdown), per-stop cards, transit connectors, "Guardar viaje" flow. `suggestForCity()` gates on login.
- `features/trip/stop-list/transit-connector.component.ts` — departure/mid-trip/arrival UI; `type` input changes framing; `arrivalBeforeDep()`/`canAddSeg()`/`pendingDuration()` validation. `openEdit()` on `type==='default'` also switches the right panel into transport mode via `trip.selectTransit()`.

### features/ai-planning

- `features/ai-planning/ai-planning.component.ts` — the 3-step (`preferences`→`options`→`result`) planner; sole owner of the signal/computed/method set documented under "AI Plan Change Management (frontend)" and "AI Plan Timeout Resilience" above. Gated on `isLoggedIn()`. `save()` persists via `TripService.restoreStops()` + `SavedPlansService.upsert()`.

### shared/*

- `shared/autosave-reminder-banner/` — fixed-top banner, auto-dismisses 8s.
- `shared/background-slider/` — presentational carousel (`activeIdx` input, `prev`/`next`/`dotClick` outputs; timers live in the caller).
- `shared/city-combobox/` — searchable city picker; `excludeIds` filter; grouped by `Region`; closes on outside `mousedown`.
- `shared/companion-mascot/` — see "Companion mascot nudges" above; presentational half only.
- `shared/date-picker/` — single-date flatpickr wrapper, `d/m/Y`, es locale when `LOCALE_ID` starts `es`.
- `shared/date-range/` — paired flatpickr inputs with cross-constraint wiring; custom viewport-clamped positioner (see `[[feedback-flatpickr-positioning]]`); `alignRight` flips hang edge.
- `shared/directives/in-view.directive.ts` — see "Landing mode" above.
- `shared/flag-icon/` — `countryCodeFromFlagEmoji()` (null for non-flag glyphs) + `FlagIconComponent` (flagcdn.com `<img>`, falls back to raw glyph).
- `shared/highlight-tour/*` — see "Highlight tour" above (`highlight-registry.service.ts`, `highlight-seen.service.ts`, `highlight-storage.util.ts`, `highlight-target.directive.ts`, `highlight-tour.component.ts`, `highlight-tour.service.ts`, `highlight-tours.config.ts`).
- `shared/pipes/duration.pipe.ts` — formats minutes as `"Nh Mmin"`/`"Nh"`/`"Mmin"`.
- `shared/plan-slideshow/` — fullscreen presentation overlay (`items: SlideshowItem[]`, auto-advance 6s, arrows/Escape/swipe/dots) + `buildPlanSlideshowItems()` (flattens stops+transits into a chronological `SlideshowItem[]`; `DayTimelineComponent`'s per-day slideshow duplicates the mapping inline rather than calling it). All three call sites pass `locale.current()`.
- `shared/trip-map/` — `TripMapComponent` (`app-trip-map`), `TripMapCity`. See "Trip Map" above.
- `shared/time-picker/` — see "`TimePickerComponent`" above.
- `shared/toast/` — `ToastComponent`, auto-emits `done` after 2400ms.
- `shared/touch-drag-ghost/` — see "Day-timeline drag-and-drop" above.
