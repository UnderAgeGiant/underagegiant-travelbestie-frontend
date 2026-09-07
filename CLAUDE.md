# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

`npm run dev` (not raw `ng serve`) is the normal dev entry point: `scripts/start-dev.mjs` reads `local.env`, injects `BACKEND_API_URL`/`BACKEND_RSA_PUBLIC_KEY`/`TURNSTILE_SITE_KEY`/`PAYPAL_CLIENT_ID`/`AUTOSAVE_INTERVAL_MS` into `environment.ts`, launches `ng serve`, and restores the file on exit.

There is no lint command. TypeScript errors surface via `ng build`.

End-to-end (Playwright) and load (k6) tests live in the sibling `travelbestie-tests/` project, not here — see `../../travelbestie-tests/CLAUDE.md`.

## Mock vs real API

`environment.useMocks` (in `src/environments/environment.ts`) gates every HTTP call. **Dev is set to `false`** — local development always hits the real backend at `http://localhost:3000`. When `useMocks: true`, all operations use `localStorage`/`sessionStorage` and hardcoded data; no backend needed.

Every method in `ApiService` and `AuthService` has an `if (environment.useMocks)` branch. When adding a new API call, always implement both paths.

## Architecture

### No NgModules — standalone components + signals everywhere

All components are `standalone: true`. All mutable state lives in **signal-based injectable services** (`providedIn: 'root'`). There are no `BehaviorSubject`s or `Store` patterns.

### Core services and what they own

| Service | State | Storage |
|---|---|---|
| `TripService` | Stops, transits, active stop, loaded plan ID | `localStorage` (`tb_plan_<email>`, `tb_active_plan_<email>`); auto-saves via `effect()`. `loadForUserPreservingAnonymous(email)` snapshots in-memory stops before loading, restores them if the account had no saved plan |
| `SavedPlansService` | Named saved trips per user | `localStorage` (`tb_saved_plans_<email>`) in mock mode; real API in prod. Plans may carry a `shareId` when the trip was shared. |
| `AuthService` | JWT access token (in-memory) + `AuthUser` | Access token: in-memory `_token` signal only — never written to storage. **Refresh token: not held by the frontend at all — it lives in a backend-set `HttpOnly` cookie the JS cannot read** (auth calls send `withCredentials: true`). User display info: `localStorage` (`tb_session_user`). On init, legacy `sessionStorage`/`localStorage` keys (`tb_token`, `tb_session_user`) are purged. |
| `AuthModalService` | Login modal visibility + post-login callback | In-memory signal |
| `KarmaService` | Karma score | `localStorage` (`tb_karma_<email>`) |
| `KarmaModalService` | Buy/insufficient modal visibility; parses 402 errors | In-memory signal |
| `FavoritesService` | Favorited shared trips list + favorited-id set | In-memory signals; lazy-loaded via `loadFavorites()`. Optimistic-update `toggle()`. Call `clear()` on logout. |
| `SharedTripsService` | Public shared trips; step comments; karma eligibility | `localStorage` (`tb_shared_trips`, `tb_step_comments_<id>`, `tb_seen_steps_<email>_<id>`) |
| `CommentCooldownService` | Post-comment cooldown countdown + shake animation | In-memory signals; shown as a nav banner while `cooldownSeconds() > 0` |
| `HomeAddressService` | User's country of residence, ISO2 (server-persisted) | `auth.currentUser().countryOfResidence` via `PUT /auth/profile` |
| `VisitedPlacesService` | Map pins | `localStorage` per user |

### Top-level routing

`AppComponent` is now a bare `<router-outlet />` — the former "no Router" design was replaced by the `feat/router-lazy-data` migration (main bundle 1.91 MB → 307 kB via lazy `loadComponent`). `app.routes.ts` defines three lazy routes: `''` → `ShellComponent` (the real app root — landing/app-mode layout, all root-level overlays), `'about'` → `AboutComponent`, `'shared/:id'` → `SharedTripComponent`; a wildcard `**` redirects to `''`. `core/routing/share-redirect.util.ts` (`shareRedirectPath`) converts the legacy `?share=<id>[&highlight=...]` query-param form into the canonical `/shared/<id>[?highlight=...]` path; an `APP_INITIALIZER` in `app.config.ts` runs it once at boot via `window.history.replaceState` so old share links still land on the right route. `core/share/share-url.util.ts`'s `buildShareLink()` only ever emits the new `/shared/:id` form — the query-param shim exists solely to keep old links alive, don't remove it.

Within `ShellComponent` itself, navigation between the profile/AI-planning/My Trips panels is still controlled by signal booleans (`showProfile`, `showAiPlanning`, `showMyTrips`) rather than further Router routes — see the `features/shell` entry in the File Reference below.

### Landing mode (no stops)

When `trip.stops().length === 0`, `ShellComponent` renders a **scroll-snap landing** instead of the normal app layout. The container `.landing-scroll` holds four `landing-snap-child` sections:

| Section | Component | Description |
|---|---|---|
| S1 | inline in `ShellComponent` | Full app shell (stop list + welcome panel) with scroll hint |
| S2 | `FeaturedSlideshowComponent` (`tb-featured-slideshow`) | Full-page cinematic slideshow of featured trips; crossfade + progress bar |
| S3 | `LandingAboutComponent` (`tb-landing-about`) | Lavender section with copy + count-up stats (cities / users / plans) |
| S4 | `AppFooterComponent` (`tb-app-footer`) | Near-black footer; three-column nav + brand logotype |

**S1 mobile:** scroll-snap is disabled on mobile — sections stack vertically.

**`FeaturedSlideshowComponent`** fetches via `ApiService.getFeatured()` (24 h localStorage cache, key `tb:featured:cache`). Its clone button navigates to `/?share=<id>&highlight=clone` instead of opening the share view inline.

**`LandingAboutComponent`** fetches via `ApiService.getStats()`. Count-up animation fires once on first intersection via `@ViewChildren` + `IntersectionObserver`.

**`InViewDirective`** (`[tbInView]`, `src/app/shared/directives/in-view.directive.ts`) — adds class `in-view` the first time the host element crosses 30% visibility; self-disconnects after firing. Used for entrance reveal animations (`.reveal.hidden → .reveal.in-view`).

**`?highlight=clone` query param:** When `SharedTripComponent` detects `?highlight=clone` on load, it shakes the clone button once after the trip data arrives (`shakeClone` signal, CSS class `.shake`, 800 ms).

### App mode layout

When stops exist, the layout is three-column:

```
<app-stop-list> | <tb-day-timeline> | <div class="right-panel"> → <app-destination>
```

**`DayTimelineComponent`** (`tb-day-timeline`, `src/app/features/planning/day-timeline/`) renders a scrollable hour grid covering the full day 00:00–23:00 (46 px/hr); days with no blocks auto-scroll to 07:00. It shows `PlannedAttraction` blocks for the active stop's selected day. Day tabs are generated from the stop's check-in/check-out range. Uses `OnPush` change detection.

**Day-tab selection only re-derives on stop change, not on every `stops()` update:** the `constructor()` effect that auto-selects a day tab used to re-run its "pick the first day with events" logic any time `activeStop()` produced a new object reference — which happens every time an attraction is planned/edited, since `TripService` is signal-based and mutations replace the stop object. That made the timeline jump back to day 1 every time the user scheduled something on a later day. Fixed by skipping the re-derivation when the stop didn't actually change (`stop.stopId !== this.lastStopId`) **and** the current `selectedDay()` is still present in the new `days()` tab list — it only re-picks a day when the stop truly switched or the selected day fell off the list (e.g. a check-in/out edit shrank the range).

**`.tl-days` (day tabs row) horizontal scroll:** `.tl-days` sits inside two nested flex containers (`.timeline-panel` > `.tl-body`). Flex items default to `min-width: auto`, so on long trips with many day tabs (`flex-shrink: 0`) the row refused to shrink to its column and grew past it instead of scrolling — pushing whatever rendered after it (e.g. the next stop card in the inline per-stop timeline) further down the page. Fix in `src/styles.css`: `min-width: 0` plus `flex-wrap: nowrap` / `overflow-y: hidden` clip it to its box and hand overflow to the existing `overflow-x: auto`. A thin styled scrollbar is shown by default for desktop mouse users to discover/grab the scroll (mobile touch users can already swipe with no visible scrollbar); it's hidden again inside the existing mobile media query.

### Weather chips (`WeatherService`, Feature 61)

`WeatherService` (`src/app/core/weather/weather.service.ts`, `providedIn: 'root'`) mirrors `FavoritesService`'s localStorage-cache pattern, but keyed per `(cityId, checkIn, checkOut)` combo (`tb:weather:{cityId}:{checkIn}:{checkOut}`) and storing an `ETag` alongside the cached payload instead of a plain TTL — `load()` always calls `ApiService.getWeather()`, sending `If-None-Match` when a cache entry exists, so a repeat call for an unchanged combo is a cheap `304` rather than being skipped client-side entirely (weather genuinely changes as a forecast date approaches, so an indefinite client-only cache would go stale).

`DayTimelineComponent` calls `weather.load(stop.cityId, stop.checkIn, stop.checkOut)` once per relevant stop whenever the set of (cityId, checkIn, checkOut) tuples actually changes (same "don't re-derive on every signal write" discipline the day-tab-selection effect already follows), and renders a small chip on each day-tab: icon (`getWeatherCodeMeta`, `src/app/core/models/weather.model.ts` — a WMO-code → emoji mapping, frontend-owned presentation mirroring the `CATEGORY_META` split) + rounded `tempMaxC`. A `type: 'forecast'` day renders full color; `type: 'historic'` renders grayscale with a small "?" badge and a tooltip explaining it's an estimate from the same date last year, not a real forecast; `type: 'unavailable'` (or no data yet) renders no chip.

### The shared-trip view (`?share=<id>`)

`SharedTripComponent` is the entire app when a share link is opened. It fetches via `ApiService.getSharedTrip(id)` and renders a read-only itinerary with step comments. It includes the full `<app-nav>` (with profile + karma) and `<tb-day-timeline>`. The clone button calls `ApiService.cloneSharedTrip(shareId)` then `savedPlans.register()` + `tripService.restoreStops()`.

`AttractionPreviewPopoverComponent` (`app-attraction-preview-popover`) shows a hover popover with attraction details in the shared trip view.

### Nav architecture — device split (Feature 41)

The nav is split into device-specific presentational components driven by shared services.

**File layout:**

| File | Role |
|---|---|
| `src/app/core/device/device.service.ts` | `providedIn: 'root'`; wraps `window.matchMedia('(max-width: 768px)')`, exposes `isMobile` signal + `isDesktop` computed. Single source of truth for viewport class. |
| `src/app/features/nav/nav-facade.service.ts` | `providedIn: 'root'`; owns all header/menu signals (`navQuery`, `searchOpen`, `userMenuOpen`, `plansOpen`, saved-plans/favorites/shared-trips state, karma-success overlay state) and all methods (`toggleUserMenu`, `doSavePlan`, `doLoadPlan`, `doLogout`, etc.). Both bars inject this. |
| `src/app/features/nav/shared/auth-modal.component.ts` | Login/register/OTP form + Turnstile DOM lifecycle. Owns `renderTurnstile` / `destroyTurnstile` / `resetTurnstile`. Rendered once by the shell; self-gates on `authModal.isOpen()`. |
| `src/app/features/nav/desktop/nav-desktop.component.ts` | Desktop top bar. Injects `NavFacadeService`; all template references prefixed `facade.`. |
| `src/app/features/nav/mobile/nav-mobile.component.ts` | Compact bar + slide-in drawer (`.nav-m-bar` / `.nav-m-drawer`). Local `drawerOpen = signal(false)`. |
| `src/app/features/nav/mobile/nav-mobile.component.spec.ts` | `NavMobileComponent`'s own drawer-close specs — the "closes the drawer and loads the plan"/"closes the drawer when signing out" cases live here rather than in `nav-facade.service.spec.ts`, since `drawerOpen` is local component state the facade can't reach. |
| `src/app/features/nav/nav-shell.component.ts` | **Selector `app-nav`** (unchanged — no call-site changes needed). Conditionally renders `<app-nav-desktop>` or `<app-nav-mobile>` via `@if (device.isMobile())`. Renders `<app-auth-modal>` + buy-karma/karma-success/insufficient-karma overlays exactly once. |

**Search normalization:** `normalizeSearch()` (`src/app/core/utils/normalize-search.util.ts`) lowercases and strips diacritics (`.normalize('NFD')` + combining-mark regex) so search matches regardless of accents (e.g. `"Bogotá"` matches a query of `"bogota"`). `NavFacadeService`'s `filteredPlans`, `filteredFavorites`, `filteredSharedTrips`, and `navFiltered` (city search) all filter through it instead of a bare `.toLowerCase()`. Use it for any new search/filter box rather than reintroducing a raw case-only comparison.

**Every mobile drawer action must close `drawerOpen` itself.** `drawerOpen` is `NavMobileComponent`'s own local signal — `NavFacadeService` (and anything it owns, like `doLogout()`) has no way to reach into it. Every button inside `.nav-m-drawer` therefore wraps its facade call in a local handler that also calls `this.drawerOpen.set(false)` (`onLogo`, `onProfile`, `onMyTrips`, `onLoadPlan`, `onLogout`) — a plain `(click)="facade.someMethod()"` binding on a drawer button leaves the drawer open behind whatever the click navigated to. The "Cerrar sesión" button used to be the one exception (bound directly to `facade.doLogout()`), which left the drawer open — showing the now-stale account/plans/favorites sections — right behind the "Iniciar sesión" button that replaces the burger menu once logged out; fixed by routing it through `onLogout()` like every other drawer action.

**Desktop user-account panel closes on outside click:** `NavDesktopComponent` listens on `@HostListener('document:mousedown', ...)` and closes `facade.userMenuOpen` when the click target falls outside the component's own `ElementRef`. `mousedown` (not `click`) is used deliberately — it fires before the panel's own click handlers, so it can't out-race a legitimate in-panel click that also closes the menu.

**Breakpoint:** `(max-width: 768px)` — matches the `@media` blocks in `src/styles.css`. When the window crosses this threshold the `DeviceService` change listener fires, updating the `isMobile` signal, and Angular re-renders the shell live (no page reload needed).

**Call sites** (`ShellComponent`, `AiPlanningComponent`, `SharedTripComponent`, `AboutComponent`, `ProfileComponent`, `MyTripsComponent`) import `NavShellComponent` and use `<app-nav>` — identical to before the split. `ProfileComponent` and `MyTripsComponent` (both `.profile-page` full-screen overlays, previously just a bare back-button `.prof-bar`) picked up `<app-nav>` alongside the co-editing UI so users can search/check karma/open notifications without leaving those pages — see the CSS section's `.profile-page` stacking-context note for the offset/z-index mechanics this required. `MyTripsComponent` also gained its own local `showProfile` signal + nested `<app-profile>` (same "profileClick → open a `<app-profile>` overlay on top" pattern as `AiPlanningComponent`/`AboutComponent`/`SharedTripComponent`); `ProfileComponent`'s own `<app-nav>` leaves `profileClick` unbound since opening another copy of itself would be recursive.

**`app-nav { display: block }` is required** in `src/styles.css`. Angular custom elements default to `display: inline`; without this the sticky `.nav-m-bar` inside the host contributes no block height and `.landing-scroll` appears flush with the top of the page.

**CSS cascade rule for `.landing-scroll` / `.landing-snap-child`:** Any `@media (max-width: 768px)` override for these two selectors **must appear after the default rules** in `src/styles.css`. When specificity is equal the later rule wins regardless of whether an earlier one is inside a matching media query. Current layout: default values first (`margin-top: 72px`, `height: calc(100vh - 72px)`), then the mobile override block immediately after (`margin-top: 0`, `height: auto`, snap disabled). Do not move the mobile override to a general mobile block that appears earlier in the file.

**2026-09-07 UX-improvements round — "Mis viajes" now actually navigates from anywhere:** `<app-my-trips>` is only ever rendered by `ShellComponent`, but `<app-profile>` is nested inside five different hosts, each previously wiring its own `<app-profile>`'s `(openMyTrips)` output ad hoc — only `ShellComponent`'s and `MyTripsComponent`'s wiring happened to be correct; `AiPlanningComponent`, `SharedTripComponent`, and `AboutComponent` all just closed the profile overlay and stopped, never reaching My Trips at all. That per-host interpretation is gone: the "🗺 Mis viajes" button now calls `NavFacadeService.openMyTrips(tab?)` directly — the same `pendingMyTripsTab` signal + `router.navigateByUrl('/')` mechanism `NotificationBellComponent` already used to jump to My Trips from any page — instead of emitting an output every host had to correctly interpret. `pendingMyTripsTab` widened to accept `'trips'` (a plain "just open it" hint alongside the existing `'collaborations'`/`'aiplans'` tab hints). `ShellComponent`'s existing `pendingMyTripsTab` effect now also closes `showProfile`/`showAiPlanning` when it fires (so it correctly unmounts whatever Shell-level overlay was open, `AiPlanningComponent`'s nested profile included); `MyTripsComponent`'s own `pendingMyTripsTab` consumption became a live `effect()` (previously a one-shot constructor check) specifically so it can close its *own* local nested `<app-profile>` overlay too, for the "already on My Trips, click Mis viajes again from within its own nested profile" case. The `myTripsClick` output (on `NavShellComponent`/`NavDesktopComponent`/`NavMobileComponent`) and `openMyTrips` output (on `ProfileComponent`) were removed entirely along with every binding to them, now that the button handles its own navigation.
>
> **Nav active-page indication:** `NavShellComponent`, `NavDesktopComponent`, and `NavMobileComponent` all gained an `activeView = input<'profile' | 'mytrips' | null>(null)` — each page that renders its own `<app-nav>` (`ProfileComponent` passes `'profile'`, `MyTripsComponent` passes `'mytrips'`; every other host leaves it `null`) so the "👤 Mi perfil"/"🗺 Mis viajes" buttons can show a `.nav-page-btn.active` highlight for whichever page is currently open — previously neither button gave any indication of the current page.

### Auth flow — OTP registration + Turnstile

Login is a single form step. **Registration is two steps**: form → email OTP verification. `AuthService.requestOtp(email)` hits `POST /auth/request-otp`; `register(name, email, password, otpCode)` sends the code.

Both flows require a **Cloudflare Turnstile** token (rendered inside `#tb-turnstile`, managed by `AuthModalComponent` methods `renderTurnstile` / `destroyTurnstile` / `resetTurnstile`). `environment.turnstileSiteKey` provides the site key. The submit button is disabled until `captchaToken()` is non-empty. Turnstile is destroyed when the modal closes and re-rendered on reopen.

Registration flow also shows a password strength indicator (Vulnerable / Moderada / Fuerte) based on length + character-class scoring.

**Every submit button in the modal has its own `*Loading` signal** (`otpLoading`, `registerLoading`, `resetLoading`) that disables the button and swaps its label for a `.btn-spinner` + "…ing" text while its request is in flight — the same three-state pattern documented below under "Button loading/success UX pattern". Plain login was missing this (nothing stopped a double-click from firing duplicate `/auth/login` calls) until `loginLoading` was added, set around `doAuth()`'s login branch (`auth.login(...).subscribe({ next, error })`) and reset in the modal-close effect alongside `registerLoading`. If you add a new submit path to this modal, give it its own loading signal from the start rather than relying on `captchaToken()`/OTP-length gates alone — those only ever block a *second* click if the user hasn't already satisfied them, they don't block re-submission with the same already-valid inputs.

**OTP input — digit-only filtering must also reset the live DOM value, not just the signal.** `onOtpInput`/`onResetOtpInput` (`AuthModalComponent`) strip non-digit characters via `value.replace(/\D/g, '')` before writing to `otpCode`/`resetOtp`. Angular's `[value]` property binding only re-applies the DOM property when the *bound* value differs from the previous render — so typing a single rejected character into an otherwise-empty field (filtered result `''` before and after) left that character visibly stuck in the input even though the signal itself stayed clean (fixed 2026-08-20, see `docs/superpowers/plans/2026-08-20-fix-otp-lightbox-profile-email-bugs.md`). Both handlers now take the raw `Event` and also write the filtered string back onto `(event.target as HTMLInputElement).value` directly, closing that gap. Apply the same "write back to the live element, don't rely on the binding" pattern for any other type-as-you-go numeric filter in this codebase.

### JWT token storage and rotation

The access token lives **in-memory only** (`_token` signal in `AuthService`) — it is never written to any browser storage, making it XSS-safe. The **refresh token is an `HttpOnly` cookie set and read by the backend** (security finding F-5) — the frontend never touches it. All four auth calls (`login`, `register`, `refresh`, `logout`) send `{ withCredentials: true }` so the browser transmits/receives that cookie. A non-sensitive `tb_session_user` marker in `localStorage` is what tells the app a session *may* exist across reloads; the backend confirms it via the cookie.

**Token lifecycle:**

| Event | What happens |
|---|---|
| Login / Register | `setTokens(token, user)` (2-arg) — stores access token in `_token` signal, persists `tb_session_user`, schedules proactive refresh. The refresh cookie is set by the backend response. |
| App start (`tb_session_user` present) | The constructor defers `refreshAccessToken().subscribe()` via `queueMicrotask` (see NG0200 gotcha below); the backend authenticates via the cookie and returns a new access token. A 401 just leaves the user logged out. |
| Proactive refresh | `scheduleProactiveRefresh()` reads the JWT `exp` claim and fires `refreshAccessToken()` 60 s before expiry |
| 401 response | `AuthInterceptor` catches the error, calls `refreshAccessToken()`, then retries the original request with the new token |
| Logout | `POST /auth/logout` (fire-and-forget, `withCredentials: true` — backend clears the cookie) + `clearTokens()` |

**`refreshAccessToken()` deduplication:** the first caller creates an `Observable<boolean>` stored in `_refreshInFlight`; subsequent callers during the same in-flight request subscribe to the same observable. `_refreshInFlight` is reset to `null` in `finalize()`.

**`AuthInterceptor`** (`src/app/core/auth/auth.interceptor.ts`):
- Attaches `Authorization: Bearer <token>` to every request that has a token, **except** `/auth/refresh` (which authenticates via the HttpOnly refresh cookie).
- On 401, retries once after a successful token refresh. If the refresh itself fails, the original error is re-thrown and `clearTokens()` is called, logging the user out.
- **Boot race**: if `auth.sessionMayExist()` is true (session marker present, in-memory token not yet restored — e.g. right after a reload), the interceptor waits on the deduplicated `refreshAccessToken()` before sending *any* request, so components that fire API calls in `ngOnInit` don't race ahead with no `Authorization` header. Safe from loops — a failed refresh clears the marker.

**Critical gotcha — NG0200 circular DI on the constructor's silent refresh**: `AuthService`'s constructor must **never** call `this.refreshAccessToken().subscribe()` synchronously. That subscription synchronously dispatches the HTTP call through `AuthInterceptor`, which does `inject(AuthService)` — while Angular is still constructing that very same `AuthService` singleton, so DI throws `NG0200` (circular dependency) before the request ever reaches the network. `refreshAccessToken()`'s `catchError` silently swallows this and calls `clearTokens()`, wiping `tb_session_user` on **every single reload** — this was the actual root cause of a real "session lost on refresh" bug (fixed 2026-07-25), not a timing race. The fix is to wrap the call in `queueMicrotask(() => this.refreshAccessToken().subscribe())` so it fires after construction finishes. No unit test caught this originally: Jest specs use a mocked `AuthService` (no re-entrant DI) and Playwright specs run against a mocked API layer — it only reproduces against a live backend with a real `tb_session_user` marker present at construction time. `auth.service.spec.ts` has a regression test (`AuthService boot-time silent refresh (NG0200 regression)`) that wires the real `authInterceptor` via TestBed to catch a reintroduction.

**Storage keys:**

| Key | Storage | Contents |
|---|---|---|
| `tb_refresh_token` | **HttpOnly cookie (backend-set)** | Opaque refresh token — not readable by JS; no longer in `localStorage` |
| `tb_session_user` | `localStorage` | `{ name, email, countryOfResidence? }` JSON — user display info + session marker, not sensitive |
| `tb_token` (legacy) | `sessionStorage` / `localStorage` | **Purged on init** — removed by old implementation |

### `ProfileComponent` — edit account accordion

The "Editar cuenta" section has three accordion rows: Nombre, Contraseña, and País de residencia (country of residence, ISO2). There is no email-change row — email editing was removed from the profile page (2026-08-20, see `docs/superpowers/plans/2026-08-20-fix-otp-lightbox-profile-email-bugs.md`); `AuthService.requestProfileOtp(newEmail)` and `updateProfile({ newEmail, otp })` remain in the service layer (they mirror the backend's `PUT /auth/profile` / `POST /auth/request-profile-otp` contracts 1:1) but have no UI caller anymore. All signals are prefixed `edit*` to avoid collisions.

**Critical signal gotcha**: never read `auth.currentUser()` inside an `effect()` without wrapping it in `untracked()`. Because `updateProfile()` calls `_user.set()`, an untracked read makes the effect re-fire on every save, calling `resetState()` and wiping the ✓ before it renders.

**`effect()` writing signals**: if an `effect()` calls `signal.set()` on any writable signal, pass `{ allowSignalWrites: true }` as the second argument or Angular throws `NG0600` at runtime.

### Button loading/success UX pattern

All action buttons follow the same three-state pattern:

```html
@if (loading()) {
  <span class="btn-spinner"></span> Guardando…
} @else if (savedTab() === 'name') {
  ✓ Guardado
} @else {
  Guardar nombre
}
```

When success clears a signal that controls the button's `@if` condition, delay that clear until the `onComplete` callback in `markSaved` — otherwise Angular batches the signal changes into one render where the button is already gone.

### Comment flow (attraction comments)

`DestinationComponent.ngOnInit()` loads comments for all attractions in a city with a **single** `ApiService.getCommentsBatch(ids)` call. Result is stored in `allComments = signal<Record<string, Comment[]>>({})`.

`AttractionDetailModalComponent` gates comment submission on auth:
- `openCommentModal()` checks `auth.isLoggedIn()`; unauthenticated users are sent to the login modal via `authModal.openLogin(() => showCommentModal.set(true))`.
- 402 errors route through `KarmaModalService.handleKarmaError(err)`.

`CommentModalComponent` form has only rating stars + textarea; the user's name comes from `userName = input.required<string>()` and avatar color is deterministic (`AV_COLORS[initial.charCodeAt(0) % AV_COLORS.length]`).

After a step comment is submitted in `SharedTripComponent`, `CommentCooldownService.startCooldown(seconds)` starts a countdown shown in the nav bar. If the user submits a too-similar comment, `CommentSimilarModalComponent` is shown.

### AI attraction suggestions (`CitySuggestCloudComponent`)

`CitySuggestCloudComponent` (`app-city-suggest-cloud`, `src/app/features/trip/stop-list/`) is a fullscreen comic-chat overlay triggered by a stop card's "🐾 Sugiere qué hacer en esta ciudad" button. Like `AttractionImageLightboxComponent`, it reparents itself to `document.body` in `ngOnInit()` via `Renderer2.appendChild` so it always wins the stacking order against `<app-nav>` regardless of where it's declared in the component tree.

**Closes only via the ✕ button or Escape** — clicking the backdrop or the dog/bubble scene does **not** dismiss it (a bare `(click)="dismiss.emit()"` on `.csc-overlay` used to do this and was removed; don't re-add it), since an accidental outside click would otherwise silently discard the user's in-progress attraction selection.

### Visa requirement badge (`VisaRequirementService`, Feature 62)

`VisaRequirementService` (`src/app/core/visa/visa-requirement.service.ts`, `providedIn: 'root'`) is a pure synchronous lookup — `requirement(homeIso2, destIso2)` — into a static, bundled 199×199-country visa-requirement matrix (`src/app/data/visa-requirements.data.ts`, generated by the root `lib/build-visa-matrix.mjs` pipeline script from the MIT-licensed `visualpharm/visa-free-dataset`). There is no backend endpoint for this — the matrix and country list (`src/app/data/countries.data.ts`) live entirely in the frontend bundle, same as `cities.data.ts`/`attractions-curated.ts`.

`StopListComponent`'s per-stop card computes a badge from the destination's ISO2 code (`countryCodeFromFlagEmoji(city.flag)`, existing util) and the logged-in user's `countryOfResidence` (`AuthService.currentUser()`), rendering a category-only label via `getVisaRequirementMeta()` (`core/models/visa-requirement.model.ts`). No comparison against the stop's stay length. A logged-in user with no `countryOfResidence` set sees a "set your country" CTA chip (clicking it opens the profile overlay via a new `StopListComponent.openProfile` output) instead of a badge; a logged-out visitor sees nothing. `ShellComponent` renders `<app-stop-list>` twice (landing-mode S1 shell + the three-column app-mode layout) and binds `(openProfile)="showProfile.set(true)"` on **both** — the landing-mode one is inert in practice (it only renders with zero stops, so no stop card ever shows a badge/CTA there), but both are wired so the binding doesn't silently regress if that ever changes.

The result is never persisted — it's a `computed()`-style live lookup every render, since it's a function of the *viewer* (home country) not the trip, and a trip can have collaborators or anonymous shared-link viewers with a different or absent home country.

`ProfileComponent`'s former free-text "Ciudad de origen" row is now "País de residencia": a `CountryComboboxComponent` (`src/app/shared/country-combobox/`, same interaction pattern as `CityComboboxComponent` including rendering each flag via `<app-flag-icon>` — not a raw emoji span — replacing the plain `<input>`. `HomeAddressService` was repurposed in place — `address` → `countryCode`, its old one-time legacy-localStorage migration effect was removed (nothing left to migrate once the backend wiped every account's old free-text value).

**Gotcha — a rounded card's `overflow: hidden` clips popover children, not just corners.** The edit-account card wrapping `ProfileComponent`'s three accordion rows used to wrap them in `overflow: hidden` purely to keep each row's `:hover` fill inside the card's 14px rounded corners. That also clipped `CountryComboboxComponent`'s absolutely-positioned dropdown — which needs to render below the card's bottom edge once the "País de residencia" row (the last one) is open — making it invisible instead of overlaying below. Fixed by dropping the wrapper's `overflow: hidden` and rounding the flush first/last `.profile-accordion-hd` buttons directly on `:hover` instead (`src/styles.css`). Any future accordion/collapsible container that might host a popover-bearing child (a combobox, a date picker, a menu) should default to `overflow: visible` and round the flush edges individually, rather than reaching for a wrapper-level `overflow: hidden` shortcut.

The "🔄 Buscar más opciones" (search more) button never shows a karma-cost badge — `CitySuggestService.searchMore()` always sends `isFollowUp: true`, and the backend skips the karma charge entirely for follow-up requests; only the first suggestion request per stop-card click costs karma (see Karma rules below).

**Dog mascot artwork:** both this component and the `AiPlanningComponent` header use the same `public/small-black-dog.png` asset (a "peeking dog" illustration with the "Asistente Miel" title baked into the artwork by a designer) via the shared `.csc-dog` CSS class (circular, `object-fit: contain`, `cscBob` idle-bob animation). Do not reintroduce a separate SVG `textPath` arc to draw the title text over a plain photo — that was tried and reverted in favor of the single branded asset.

**2026-09-07 UX-improvements round:** the always-visible `.stop-visa-badge`/`.stop-currency-badge`/`.stop-plug-badge` badges were replaced by a single reusable `CityInfoBadgeComponent` (`app-city-info-badge`, `src/app/shared/city-info-badge/`) — a small "Información sobre la ciudad ?" trigger that reveals all three (whichever apply) in a floating popover on hover/focus/tap, mirroring the weather chip's own hover pattern. Same for the weather chip itself, extracted into `CityWeatherChipComponent` (`app-city-weather-chip`, `src/app/shared/city-weather-chip/`) so both `StopListComponent` and the public `SharedTripComponent`'s `itin-city-head` can render identical city info + weather without duplicating the hover/popover-positioning logic. Each `CityWeatherChipComponent` instance loads its own weather data (`WeatherService.load()` already de-dupes/caches, so multiple instances for the same city/range are safe).

### Currency & plug info badges (`TravelInfoService`, Feature 63)

`TravelInfoService` (`src/app/core/travel-info/travel-info.service.ts`, `providedIn: 'root'`) is a pure synchronous lookup into a static, bundled dataset (`src/app/data/travel-info.data.ts`, generated by the root `lib/build-travel-info.mjs` pipeline script from two open sources: `annexare/Countries` for currency, `benjiao/world-plugs` for plug type/voltage/frequency). Same "no backend endpoint, ships in the bundle" architecture as Feature 62's visa matrix.

`StopListComponent`'s badge row gains two more entries alongside Feature 62's visa badge: `currencyBadge(city)` (destination currency name + symbol, e.g. "🪙 Euro (€)" — shown to **every** viewer regardless of login state, since it's a fact about the destination, not the viewer) and `plugBadge(city)` (destination plug type(s) + voltage, e.g. "🔌 Tipo C/E · 230 V" — also shown to every viewer). Only the "adapter needed" qualifier on the plug badge requires a known `countryOfResidence`; when it's unknown (anonymous visitor, or logged in with no country set) the badge just omits that qualifier rather than showing a second CTA chip — Feature 62's visa badge already owns the one "set your country" nudge per stop card.

**Explicitly no live currency exchange rates** — `TravelInfoService.currencyInfo()` returns only the currency's name and symbol, never a conversion rate; that would require a live API and contradicts this feature's static-dataset design, same reasoning Feature 62 used to reject a live visa-requirements API.

### Companion mascot nudges (`CompanionMascotComponent`)

`CompanionSuggestionService` (`src/app/core/ai/companion-suggestion.service.ts`, `providedIn: 'root'`) is triggered once, fire-and-forget, right after `TripService.addAttraction()` succeeds from a direct user action — `AttractionCardComponent.onPlanConfirmed()` and `AttractionDetailModalComponent.onPlanConfirmed()` (guarded there to skip edits of an already-planned attraction's time). It is **never** called from `CitySuggestService.addAll()`'s loop (Feature 52) — that would stack several mascot popups from one AI-suggestion batch-add. `trigger()` does **not** wait for `state` to be `'idle'` before starting — if the user adds another attraction while a previous suggestion is still sniffing or showing, the new response simply overwrites it (clearing any pending reveal timer first); a `204`/error from the new call leaves whatever is currently displayed untouched.

`CompanionMascotComponent` (`app-companion-mascot`, `src/app/shared/companion-mascot/`) is mounted once, root-level, in `ShellComponent` (the only view where attractions can be added) — same "render once at the root" pattern as Feature 41's auth/karma overlays. **The trigger is silent** — `CompanionSuggestionService.trigger()` keeps `state` at `'idle'` (mascot fully hidden) for the *entire* `POST /ai/suggest-companion` round trip, so a rate-limited/dice-roll-miss/invalid-suggestion `204` or a network error never shows anything at all. Only once a `200` actually arrives does the mascot appear: it renders the sniffing dog (`sniffing-back-dog.png`) first — even though the suggestion is already fetched and held in memory at that point — then swaps to the speech-bubble card (`small-black-dog.png`, reusing the `cscBob` idle-bob keyframe from `CitySuggestCloudComponent`) after a fixed `SUGGESTION_REVEAL_DELAY_MS` (2.5 s) pause, so the dog always visibly "searches" for a beat before revealing the answer. **The bubble has no auto-dismiss timer** — it stays until the user explicitly closes it (✕, "No, gracias", or "➕ Agregar"); there is also no backdrop/outside-click handler, matching `CitySuggestCloudComponent`'s "only an explicit close" pattern. `dismiss()` (and `accept()`, which ends by calling it) cancels the pending reveal timer too, so closing the mascot mid-sniff can never cause the bubble to pop in late on its own.

When an attraction is added, `ToastService` (`src/app/core/ui/toast.service.ts`, `providedIn: 'root'`, a single `message` signal + `show()`/`clear()`) shows a confirmation toast alongside the (silent, possibly-empty) mascot trigger — replaces an earlier local `signal<string|null>` that lived directly on `ShellComponent`. `AttractionDetailModalComponent.onPlanConfirmed()` also closes the modal itself (`this.close.emit()`) right after showing the toast/triggering the mascot, so neither is hidden behind the still-open detail view.

`CompanionBoostCardComponent` (`src/app/features/profile/`) lives on the profile page and calls `CompanionSuggestionService.boost()` (−2 karma via `POST /companion/boost`) to raise the roll chance from 20% to 75% for the next 24 hours (a rolling window from the moment of purchase, not a reset at midnight). It renders a live `HH:MM:SS` countdown (`companion-boost-timer`, ticking every second off a local `now` signal compared against `CompanionSuggestionService.boostExpiresAt()`) and reverts to the unboosted illustration on its own once the countdown reaches zero — it does not wait for another `refreshBoostStatus()` round trip to notice expiry. It still calls `refreshBoostStatus()` on init so a page reload reflects the server-authoritative remaining time (read from the Redis key's TTL via `GET /companion/status`).

**Backend dependency:** this frontend half calls `POST /ai/suggest-companion`, `POST /companion/boost`, and `GET /companion/status` on `underagegiant-travelbestie-manager` (branch `feat/companion-suggestions`, Feature 54). Those routes must exist and be deployed before this behaves end-to-end in a live environment; `environment.useMocks` covers local dev without the backend (`ApiService.suggestCompanion()` rolls a canned 30% chance client-side, `boostCompanion()`/`getCompanionStatus()` return canned responses).

### Highlight tour (onboarding spotlight walkthrough)

`src/app/shared/highlight-tour/` implements a generic, config-driven "spotlight" onboarding tour: a gray veil with a cutout around one UI element at a time, paired with a mascot dog (`small-black-dog.png`, continuous 3-frame wag→wag→play-bow loop, independent of tour step) speaking in a bubble. `HighlightRegistryService` (`providedIn: 'root'`) is a plain `Map<string, HTMLElement>`; any element can register itself under a logical string id via `HighlightTargetDirective` (`[tbHighlightTarget]="'login-btn'"`) so tour targeting survives the desktop/mobile nav split instead of relying on brittle CSS selectors. Tour content — which target id, what the bubble says per locale — lives entirely in `highlight-tours.config.ts` as data (`HIGHLIGHT_TOURS: Record<HighlightType, HighlightStep[]>`); adding a new tour is a data-only change, no new components. `HighlightTourComponent` renders the veil/spotlight/dog/bubble, reparented to `<body>` (same `Renderer2.appendChild` technique as `CitySuggestCloudComponent`) so it always wins the stacking order.

**Shipped tour:** `landing_welcome`, 2 steps, shown once to an anonymous (not-logged-in) visitor on the empty-state landing page — step 1 spotlights "Iniciar sesión", step 2 spotlights "🐾 Crear con IA". Triggered from `ShellComponent`'s constructor `effect()`: `!auth.isLoggedIn() && !auth.sessionMayExist() && trip.stops().length === 0`. The `sessionMayExist()` half specifically guards the boot-time silent-refresh window (see JWT section below) — without it, a real returning logged-in user briefly reads as "anonymous" on every reload and would flash the tour by mistake; `HighlightTourService.start()`'s own `{ shouldStillShow }` option closes the narrower race of a login completing while the in-flight `/status` check is still pending.

**Three-layer "already seen" tracking**, checked in order by `HighlightSeenService`:
1. `sessionStorage` (per-tab, per-highlight-type) — `checkServerStatus(type)` checks this first and only calls `GET /highlights/:type/status` when nothing is cached yet, caching whichever answer comes back (`true` or `false`). At most one network round trip per type per tab session.
2. Redis, keyed by identity — `u:{userId}` (logged in) → `a:{anonymousId}` (valid `X-Anonymous-Id` header) → `ip:{req.ip}` (last resort). Backend-side, TTL-bound (`HIGHLIGHT_SEEN_TTL_SECONDS`, default 86400s) — not permanent.
3. Postgres `user_highlight_views` — logged-in users only, the actually-permanent record.

`AnonymousIdService` (`src/app/core/anonymous-id/`) generates one UUID per browser profile via `crypto.randomUUID()`, persisted in `localStorage` (deliberately not `sessionStorage` — needs to survive tab closes, unlike the layer-1 cache above). `ApiService` sends it as `X-Anonymous-Id` on all three highlight endpoints; `AuthService.login()`/`register()` send it too, so a backend migration middleware can fold an anonymous visitor's dismiss/seen state onto their account the moment they sign in or register.

**Mobile: each step scrolls its target into view.** `HighlightTourService` injects `DeviceService`; in `resolveCurrentTarget()`, once a step's target element is found it calls `el.scrollIntoView({ block: 'center', behavior: 'smooth' })` when `device.isMobile()` — on `start()`, `next()`, and `prev()` alike, since all three route through `resolveCurrentTarget()`. No-op on desktop. This exists because the landing page stacks its sections vertically on mobile (scroll-snap disabled there — see the Landing mode section), so a step's target routinely sat outside the viewport with the spotlight ring pointing at nothing visible; desktop never had this problem since both `landing_welcome` targets are already on screen together. The existing capture-phase `window:scroll` listener (`HighlightTourComponent`, added for scroll-snap tracking) already recomputes the target rect on every scroll event, so the ring/bubble track the target smoothly through the scroll animation instead of jumping once it settles.

**Confirm vs. dismiss are different actions, not the same completion path.** Reaching "¡Entendido!" on the last step (or an internal auto-skip when a step's target never resolves) calls `HighlightTourService`'s private `confirm()` — marks seen immediately via `HighlightSeenService.markSeenOnServer()` → `POST /highlights/:type/seen`. Closing early (✕ button or Escape, i.e. `close()`) instead calls private `dismiss()` → `HighlightSeenService.markDismissedOnServer()` → `POST /highlights/:type/dismiss`, which does **not** mark it seen locally — the backend counts dismissals per identity and only escalates to "seen" after `HIGHLIGHT_DISMISS_LIMIT` (3) early closes, so a visitor who bails out once still gets shown the tour again later. The frontend can't know from a bare `204` whether a given dismissal was the one that crossed the limit, so it deliberately leaves the local cache alone and lets the next tab session's `checkServerStatus()` ask the server fresh.

**Critical gotcha — signal-tracking leak through a called method:** `start()` is called directly from inside `ShellComponent`'s own `effect()` above. Its synchronous guard (`if (this._activeType()) return;`) reads a signal — and Angular attributes *any* signal read during an effect's synchronous execution to that effect, even one performed inside a method the effect merely calls, not just reads written directly in the effect body. That silently added `_activeType` as a dependency of the host effect: dismissing the tour set `_activeType` to null, which re-triggered the host effect, which called `start()` again — and since `dismiss()` never marks the tour seen locally, it reopened immediately with no way to actually close it. Fixed by wrapping the entire body of `start()` in `untracked(() => { … })`. If you add other services whose methods are called from inside an `effect()` and that read/write their own signals internally, wrap the method body in `untracked()` unless you specifically want those reads to become effect dependencies. `shell.component.spec.ts` has a regression test (`'does not reopen the landing_welcome tour after it is dismissed via close()'`) that renders a real `ShellComponent` and would fail if this regresses.

Full design history (including two abandoned intermediate designs for the cookie layer and the dismiss/confirm split) lives in `docs/superpowers/plans/2026-08-16-highlights-module.md` (monorepo root) — see its "Post-Implementation Changes" section for what actually shipped vs. what was originally planned.

### Data models

**`TripStop`** — includes an optional `lodging?: Lodging` (`{ name, url, address?, notes? }`, `address`/`notes` are free-text and only shown on the Hospedaje export sheet). `LodgingComponent` (`app-lodging`) renders between stops in the stop list; it calls `TripService.setLodging()` / `removeLodging()`. Clicking the lodging area selects the city stop; the form only opens via the add-label click. The edit form's "Dirección" / "Observaciones" inputs sit below the existing name/URL fields and are trimmed to `undefined` (omitted from the `Lodging` object) when left blank.

**`TransitLeg`** — now multi-segment: `segments: TransitSegment[]`. Each segment has `mode`, `departureDate`, `departureTime`, `arrivalDate`, `arrivalTime`, `notes`, and optionally `carrier` (e.g. "Latam", free-text "Empresa" input) and `locationUrl` (built via `attractionMapsUrl()` from a free-text "Ubicación" input — same Google Maps search-URL helper used elsewhere, not a raw URL field). Both render as a `· <value>` suffix next to `notes` in the segment summary row. The old single-mode format is migrated by `migrateTransitLeg()` in `TripService`.

**`PlannedAttraction`** — optional `ticketPurchased?: boolean`, toggled via `TripService.setTicketPurchased(stopId, entryId, purchased)`. `AttractionCardComponent` renders a "🎟 Entrada comprada" checkbox next to an entry chip only when `attraction().ticketUrl` is set (i.e. only for attractions that actually require a purchased ticket); the checkbox's click handler calls `stopPropagation()` so toggling it doesn't also trigger the chip's own click (which opens the time-edit modal).

**`FavoritedTrip`** — lives in `trip.model.ts`. Returned by `ApiService.getFavorites()`. The `shareId` field is the key. `FavoritesService.seedFromPayload(shareId, isFavoritedByMe)` initializes the favorited-id set from trip payload data without a round-trip.

### XLSX itinerary export — `ticketRequiredIds`

`ApiService.exportItinerary(id, cityNames, attractionNames, ticketRequiredIds)` posts to `POST /trips/:id/itinerary` and streams back the `.xlsx` blob. Both call sites — `DayTimelineComponent.exportItinerary()` and `MyTripsComponent.downloadItinerary()` — build the three payload maps via the shared `buildItineraryExportMaps(stops)` helper (`src/app/core/utils/itinerary-export.util.ts`): it loops `getAttractions(city)` for every stop's city, collecting `attractionNames` and flagging `ticketRequiredIds` for every curated attraction that has a `ticketUrl` (the frontend is the only place that knows this — the backend has no access to the curated catalog). `DayTimelineComponent` passes `this.trip.stops()` (the live signal, called to get the plain array); `MyTripsComponent` passes a saved plan's `plan.stops` array directly — both work through the same function since it just takes `TripStop[]`. Everything past that point (blob download, `exporting`/`exportingPlanId` signal handling, karma spend, toasts, `MyTripsComponent`'s mock-mode branch) still differs enough between the two call sites that it isn't shared.

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

402 errors from the backend mean insufficient karma. Always route them through `KarmaModalService.handleKarmaError(err)`.

### AI Plan Timeout Resilience & History (frontend, Feature 59)

`ApiService.planTrip()` keeps its `Observable<PlanTripResponse>` signature but now kicks off `POST /ai/plan` (returns `{ requestId }`) and polls `GET /ai/plan/:requestId/status` every 15s (`pollAiPlanStatus`, private, `AI_PLAN_POLL_INTERVAL_MS`) until the job is no longer `pending`, resolving/erroring with the same shape callers already expected. The `NotificationService` bell poll (`POLL_INTERVAL_MS`, 60s) is a fully separate timer — it is unaffected by this poll or by `notifyMeInstead()`; it just keeps running at its own fixed cadence the whole logged-in session.

`AiPlanningComponent.executePlan()` layers a 15s `setTimeout` on top of the subscription (`planTakingLong` signal) — once it fires, the template shows a dog + speech bubble (reusing `CompanionMascotComponent`'s `.companion-mascot`/`.companion-bubble` CSS, but a distinct `is-waiting` dog image, not `small-black-dog.png`) with two actions: **Esperar** (`waitForPlan()`, no-op — the poll just keeps running) and **Notificarme** (`notifyMeInstead()` — unsubscribes the frontend poll and resets loading state; the backend keeps generating regardless and will notify via the bell whichever way it finishes).

`ai_plan_ready`/`ai_plan_failed` notifications route through `NotificationBellComponent.open()` to `NavFacadeService.pendingMyTripsTab.set('aiplans')` + `router.navigateByUrl('/')` — same "route by `type`, not by parsing `url`" pattern already used for `collaborator_invite`/`collaborator_accepted`.

**"Planes IA Pendientes" tab** (`MyTripsComponent`, alongside Favoritos/Colaboraciones, renamed 2026-08-26 from "Mis Planes IA") lists `ApiService.getAiPlanHistory()` — a to-do list, not a permanent archive: no re-invoking DeepSeek and no "load into editor," but a completed row's `ai_plan_requests` row is deleted (`ApiService.deleteAiPlanHistoryItem()`) the moment the user actually saves it via `AiPlanningComponent.save()`, whether opened fresh or revisited from this tab — the tab only ever shows plans the user hasn't decided about yet. A failed row (which can never be saved) shows a failed state, a "Karma reembolsado" note when a refund happened, and a "🗑️ Descartar" button that calls the same delete endpoint manually — server-side that endpoint soft-deletes a failed row instead of destroying it (see manager `CLAUDE.md`'s Feature 59 section), which the frontend neither knows nor needs to care about. `AiPlanViewPayload` (`core/models/ai.model.ts`) carries `{ result, requestId }` from a card click through `ShellComponent.pendingAiPlanResult` into `AiPlanningComponent.initialResult`, and `AiPlanningComponent.currentAiPlanRequestId` tracks which row backs the currently-displayed plan (set by either that input or a fresh `executePlan()` response) so `save()` knows what to delete.

**2026-09-07 UX-improvements round:** `AiPlanningComponent` no longer opens `PlanSlideshowComponent` directly from either the `executePlan()` success handler or the `initialResult` (revisited "Planes IA Pendientes" card) effect. Both now call `triggerPlanReadyCelebration()`, which sets `celebratingPlanReady` for `AI_PLAN_CELEBRATE_MS` (2.6s, mirroring `CompanionBoostCardComponent`'s own `CELEBRATE_MS`) — rendering a fullscreen confetti/planes/sparkles burst (`.ai-plan-celebration`) plus `public/ai-plan-ready.gif` and a congratulatory message — before setting `planSlideshowOpen` itself.

### `TimePickerComponent` — flatpickr only commits on blur/Enter/arrows

flatpickr's own `onChange` callback only fires once a typed hour/minute value is "committed" (blur, Enter, or the increment arrows) — typing digits directly and immediately clicking a modal's "Confirmar" button, without first clicking away to blur the input, never emitted a change, so the parent modal kept the stale initial time. `TimePickerComponent.ngAfterViewInit()` now also attaches raw `input` listeners directly to `this.fp.hourElement`/`minuteElement` and emits `timeChange` on every keystroke once both fields parse to valid numbers, independent of flatpickr's own commit timing. If you touch this component, keep both paths (flatpickr's `onChange` and the raw `input` listeners) — removing the raw listeners reintroduces the "confirm without blurring" bug.

### Left-panel planned-attraction ordering (`StopListComponent`)

`StopListComponent.plannedSorted(stop)` sorts a stop's `selectedAttractions` by date (falling back to the stop's `checkIn`) then by `startTime` before rendering — the underlying array is stored in add order, but the panel is meant to read as a timeline. The template's `@for` must iterate `plannedSorted(stop)` (tracked by `entryId`, not `attractionId`, since one attraction can have multiple planned entries), not `stop.selectedAttractions` directly.

### Date format

All dates are `dd/mm/yyyy` strings throughout the app. `TripService` parses these for sorting. Both date-picker components (`DateRangeComponent`, `DatePickerComponent`) are flatpickr wrappers that always emit in this format.

### Attraction categories

`src/app/core/models/attraction-category.ts` defines:
- `AttractionCategory` — discriminated union: `'poi' | 'freetour' | 'event_party' | 'foodie'`
- `CATEGORY_META` — maps each category to `{ code, label, icon, bg, defaultSubcategoryLabel }`
- `ALL_CATEGORIES` — `Object.values(CATEGORY_META)`, used to render the filter chip row

**`bg` colors** (pastel, same for filter chip active state and card background):

| Category | bg |
|---|---|
| `poi` | `#E8F0FD` |
| `freetour` | `#E8FDE8` |
| `event_party` | `#FDE8F5` |
| `foodie` | `#FDF5E8` |

The `att-filter-chip` active state uses `var(--chip-bg, var(--lav))` — bound via `[style.--chip-bg]="cat.bg"`. `AttractionCardComponent` sets `[style.background-color]="categoryBg()"` on the card root, where `categoryBg = computed(() => CATEGORY_META[attraction().category]?.bg ?? '#E8F0FD')`. Card sub-sections (footer, enrich strip, entry chips) use `background: transparent` to inherit this color.

### Attractions data layer

`src/app/data/attractions.data.ts` exports `getAttractions(city)`. It builds the list from four sources in order (`attractions-curated.ts` is ~134k lines — the UNESCO pipeline plus subsequent bulk city imports, e.g. the ~80-city Asia expansion — not the ~40k lines of earlier snapshots):

1. **`CURATED_ALL`** from `attractions-curated.ts` (UNESCO pipeline output) — used when the city has curated data; entries are filtered by `active: true` and HTTP image URLs are stripped via `stripInsecureImages()` (mixed-content safety — production is HTTPS-only).
2. **Regional template** (`REGION_TMPL`) — fallback for cities not in `CURATED_ALL`; generates synthetic attractions with runtime IDs `${city.id}_${i}` and a deterministic per-city/per-index rating (`hashRating()`).
3. **`FREETOURS_CURATED`** from `freetours-curated.ts` (Civitatis scrape) — appended after the base list for any city that has freetours.
4. **`EVENTS_CURATED`** from `events-curated.ts` (auto-generated by `refresh-tm-events.mjs` from the Ticketmaster API, IDs prefixed `ev_`) — appended after freetours for any city with upcoming ticketed events; these are `category: 'event_party'` entries carrying a fixed `date`/`time` (see `PlanTimeModalComponent`'s locked/read-only mode for fixed events in the File Reference below).

`findCuratedAttraction(cityId, attractionId)` searches `CURATED_ALL`, then `FREETOURS_CURATED`, then `EVENTS_CURATED` — use this when rendering existing trip stops that may reference inactive attractions.

#### Stable attraction IDs — NEVER change them

Every entry in `attractions-curated.ts` has a permanent `id` in the format `"${cityId}_${index}"` (e.g. `"agra_0"`, `"paris_3"`). Freetour entries in `freetours-curated.ts` use `"ft_${cityId}_${index}"` (e.g. `"ft_paris_0"`). These IDs are **write-once and must never be changed** because they are:
- Stored as `planned_attractions.attraction_id` in the PostgreSQL database (existing user trips would break)
- Persisted as `attractionId` in TripService's `localStorage` (existing offline plans would break)
- Used as attraction comment keys in the backend (`attraction_comments.attraction_id`)

**Rules:**
- You may append new attractions to the end of a city's array — they get the next index and are safe.
- Never reorder, remove, or renumber existing entries.
- `getAttractions()` uses the `id` directly from the data — it does NOT recompute it.

#### Soft-deleting an attraction — use `active: false`

`active: boolean` is a **required** field on every `Attraction`. Curated entries have it baked in; template-generated entries receive `active: true` from `getAttractions()`. **Never delete or reorder entries** — set `active: false` instead. `findCuratedAttraction()` bypasses the filter and returns any attraction by ID regardless of `active` state.

#### Freetours data pipeline (repo root)

Civitatis free-tour data is scraped and merged in three steps:
1. `scrape-civitatis.mjs` → `freetours-by-city.json` (listing page scrape; cache: `freetours-cache.json`)
2. `enrich-civitatis.mjs` → `freetours-enriched.json` (individual page enrichment; cache: `freetours-enrich-cache.json`)
3. `merge-freetours.mjs` → `src/app/data/freetours-curated.ts` (converts to TypeScript, divides civitatis 0–10 rating by 2 for app's 0–5 scale)

`freetours-curated.ts` is auto-generated — do not edit manually.

`FeaturedSlideshowComponent` uses a hardcoded map `CITY_COVER_PHOTOS` of verified direct Unsplash CDN photo IDs (no API key needed). The old `source.unsplash.com` random-by-keyword endpoint is deprecated — do not use it.

### Day-timeline drag-and-drop (`day-timeline-drag.util.ts`)

`DayTimelineComponent`'s hour grid is a native HTML5 Drag and Drop drop target (no `@angular/cdk` dependency). Two custom MIME types distinguish the two drag sources, both defined in `src/app/core/utils/day-timeline-drag.util.ts`: `NEW_ATTRACTION_MIME` (`AttractionCardComponent`'s `.att-card` root, `draggable="true"`, sets `{attractionId, category, estimatedMinutes}` on `dragstart`) and `RESCHEDULE_MIME` (an existing `.tl-block` whose `category` isn't locked, sets `{stopId, entryId}`). `DayTimelineComponent.onGridDrop()` reads whichever MIME type is present and calls `TripService.addAttraction()` or `TripService.updateStartTime()` respectively; `snapMinutesFromOffset()`/`minutesToHm()` (same file) convert a drop's `clientY` into a 15-minute-snapped `HH:mm`, measured against `#tlGridEl`'s `getBoundingClientRect()`.

**Reschedule lock** (`DayTimelineComponent.isRescheduleLocked()`): a `freetour`-category attraction, or an `event_party` one with a fixed `date`, can never be dragged to reschedule — mirrors `PlanTimeModalComponent.isFixedEvent()`'s existing event lock, extended to also cover freetours (real-world fixed schedule, family feedback idea #2). Rescheduling preserves the block's original duration (`endTime − startTime`, not the attraction's catalog `estimatedMinutes`) so a previously time-shifted block doesn't silently reset its length on drag.

Dragging a new attraction from the list only works while the timeline is showing a valid day/stop (`selectedStopForDay()`/`selectedDay()` both non-null) and is a no-op in transport mode (a transit leg selected instead of a city stop).

**Mobile drag ghost pill (`TouchDragGhostService`, `src/app/core/utils/touch-drag-ghost.service.ts`):** desktop's native HTML5 Drag and Drop gets a "what am I dragging" preview for free (the browser auto-generates a drag image from the dragged element); the touch-drag paths above never had an equivalent — only `TouchDragService`'s/`DayTimelineComponent`'s own `dragPreview` time bubble, telling you *when* a drop would land, never *what* was being dragged. `TouchDragGhostService` is a small `providedIn: 'root'` sibling service (`{icon, label, x, y} | null` signal, `show()`/`move()`/`hide()`) — deliberately separate from `TouchDragService` since it's pure display state with no bearing on drop resolution. Both touch-drag sources call it directly at the same lifecycle points they already touch `TouchDragService`/local drag state: `AttractionCardComponent`'s `onTouchStart` (armed)/`onTouchMove` (armed)/`onTouchEnd`/`onTouchCancel`, and `DayTimelineComponent`'s `onBlockTouchStart` (armed, looks up the block's icon/name from `blocks()` by `entryId`)/`onBlockTouchMove` (armed)/`onBlockTouchEnd`/`onBlockTouchCancel`. `TouchDragGhostComponent` (`app-touch-drag-ghost`, `src/app/shared/touch-drag-ghost/`) is the presentational half — a `position: fixed` pill (`.touch-drag-ghost` in `src/styles.css`, `z-index: 2000` to clear the mobile attractions bottom sheet it's commonly dragged out of) mounted once at root in `ShellComponent`, same "render once at root" pattern as `<app-toast>`/`<app-companion-mascot>`.

## i18n

Source locale is `es-CL` (all templates written in Spanish). After adding new `i18n="@@id"` or `i18n-<attr>="@@id"` attributes, run `ng extract-i18n` to regenerate `messages.xlf`, then add the matching `<trans-unit>` to `src/locale/messages.en-US.xlf`.

Angular template constraint: arrow functions (`=>`) are not allowed in template event bindings. Extract them into class methods.

**External links in Angular**: never use `[href]="dynamicUrl"` (property binding) — Angular's URL sanitizer silently converts it to `unsafe:https://...`, blocking navigation. Use `window.open()` in a click handler instead:

```typescript
openWebsite(event: MouseEvent): void {
  event.preventDefault();   // prevent browser from also following the href
  event.stopPropagation();  // prevent bubbling to parent click handlers
  const url = this.attraction().website;
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
```

Keep `[attr.href]="url"` on the `<a>` for right-click "Open in new tab" and keyboard accessibility. `[attr.href]` (attribute binding) is safe to use — it calls `setAttribute()` directly and does not go through Angular's sanitizer.

## CSS

All design tokens are CSS custom properties in `src/styles.css` using `oklch()`. Component-specific styles for transit, lodging, itinerary, shared trip, step comments, profile accordion, day-timeline, and **all landing sections** are global in `src/styles.css`. Use existing token names (`--lav`, `--lav-d`, `--peach`, `--t1`, `--t2`, `--t3`, `--border`, `--cream`, `--sh-lg`) rather than hardcoded colors.

Landing-specific CSS class prefixes: `.landing-scroll`, `.landing-snap-child`, `.s1-shell`, `.scroll-hint`, `.landing-slideshow-*`, `.landing-about-*`, `.landing-stat-*`, `.landing-footer-*`, `.reveal` / `.reveal.hidden` / `.reveal.in-view`, `.shake`.

**Full-page fixed-overlay stacking-context trap:** any full-page wrapper styled `position: fixed; inset: 0; z-index: <N>` (e.g. `.ai-plan-page`) establishes its own stacking context, which traps everything rendered inside it — including a nested `<app-nav>` — as siblings compared only against each other, not against the page's real top-level stacking order. `<app-nav>`'s own CSS (`.nav` / `.nav-m-bar`) has a lower z-index than `.shared-body` (200 vs 210), so without a scoped override the scrolling body content paints over the fixed nav bar instead of scrolling underneath it once the page scrolls far enough. Fixed for `.ai-plan-page` with a scoped bump: `.ai-plan-page .nav, .ai-plan-page .nav-m-bar { z-index: 220; }`. Any new full-page `position: fixed` wrapper that also renders `<app-nav>` inside it needs the same scoped override.

**`.profile-page` (`ProfileComponent` + `MyTripsComponent`) is a second instance of this trap, via a different mechanism:** it has no `transform` set directly, but its `animation: profSlideIn` keyframes end on `transform: translateX(0)` — a non-`none` transform value, which `animation-fill-mode: both` keeps applied indefinitely — and per spec *any* non-`none` transform (identity or not) makes the element a containing block for `position: fixed` descendants, not just `.ai-plan-page`'s literal `position: fixed` case. The scoped bump here is `.profile-page .nav, .profile-page .nav-m-bar { z-index: 360; }` (above `.profile-page`'s own `z-index: 350`). Separately, because desktop's `.nav` is itself `position: fixed` (72 px tall), it reserves no flow space — so `.prof-bar`, the back-button bar both `ProfileComponent` and `MyTripsComponent` share, carries `margin-top: 72px` to clear it, zeroed under `@media (max-width: 768px)` since mobile's `.nav-m-bar` is in-flow (`position: sticky`) and already pushes `.prof-bar` down on its own.

The static design references `../../landing-preview.html` and `../../landing-page-demo.html` (repo root) are the UI/UX reference for landing-section color tokens, structure, and animation keyframes. (The old single-file React prototype `TravelingBestie.html` has been removed — this Angular app is now the canonical UI.)

## Production security headers

`vercel.json` ships an enforcing `Content-Security-Policy` plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS, and `Permissions-Policy` (security findings F-4/F-6). The CSP `script-src`/`frame-src` allow-list Cloudflare Turnstile and PayPal. Because the CSP forbids inline `onload` handlers, the production build sets `optimization.styles.inlineCritical: false` in `angular.json` — do not re-enable it or styling breaks under the enforced CSP.

## File Reference

Per-file index of every source file in `src/`, so a future session can find where a piece of functionality lives without re-searching the tree. Sections above already cover the cross-cutting architecture (nav split, karma, AI plan change management, highlight tour, co-editing/autosave, etc.) in prose — entries below stay terse where that context already exists and point back to the relevant section instead of repeating it. Grouped by directory, matching `src/app/`.

### Root & bootstrap

- `src/main.ts` — `bootstrapApplication(AppComponent, appConfig)`, the entire app entry point.
- `src/app/app.component.ts` — `AppComponent`: just `<router-outlet />`. All former "no Router" landing-mode/share-param logic now lives in `ShellComponent` and `app.routes.ts` — see "Top-level routing" above.
- `src/app/app.component.html`, `src/app/app.component.css` — **Dead code.** Leftover `ng new` scaffold template/styles; `AppComponent` uses an inline template (no `templateUrl`/`styleUrl`), so neither file is referenced anywhere. Safe to delete if you're in this area.
- `src/app/app.config.ts` — `appConfig`: registers `es-CL`/`en-US` Angular locale data, wires `provideRouter(routes)` + `provideHttpClient(withXhr(), withInterceptors([authInterceptor]))`, and two `APP_INITIALIZER`s — one syncs `<html lang>` to `LOCALE_ID`, the other runs `shareRedirectPath()` once at boot to rewrite a legacy `?share=<id>` URL to `/shared/<id>` before the Router takes over.
- `src/app/app.routes.ts` — `routes: Routes`: `''` → lazy `ShellComponent`, `'about'` → lazy `AboutComponent`, `'shared/:id'` → lazy `SharedTripComponent`, `'**'` → redirect to `''`. All three lazy via `loadComponent()` for bundle-splitting (see "Top-level routing").
- `src/index.html` — Static shell: `<app-root>` mount point, Cloudflare Turnstile script tag (`defer`), favicon, `<base href="/">`.
- `src/environments/environment.ts` — Dev config: `production: false`, `useMocks: false` (dev always hits the real backend at `localhost:3000` — see "Mock vs real API"), `autoSaveIntervalMs` (10 min, lower locally to test autosave faster), dev RSA public key + Turnstile test site key, empty PayPal client id (PayPal button skipped in dev unless set via `local.env`).
- `src/environments/environment.production.ts` — Prod config: same shape, all secrets as `*_PLACEHOLDER` strings patched at build time by `scripts/patch-env.mjs` from Vercel env vars (`BACKEND_API_URL`, `BACKEND_RSA_PUBLIC_KEY`, `TURNSTILE_SITE_KEY`, `PAYPAL_CLIENT_ID`).

### data/

- `src/app/data/cities.data.ts` — `WORLD_CITIES: City[]`: the full static city catalog (id/name/country/flag/region), ~600+ entries across 6 regions. Adding a city here is the trigger for re-running the UNESCO pipeline (`lib/format-unesco.mjs`, see root `CLAUDE.md`).
- `src/app/data/attractions.data.ts` — `getAttractions(city)` / `findCuratedAttraction(cityId, attractionId)` / `stripInsecureImages()`: the four-source attraction resolution described in "Attractions data layer" above (`CURATED_ALL` → `REGION_TMPL` fallback → `FREETOURS_CURATED` → `EVENTS_CURATED`).
- `src/app/data/attractions-curated.ts` — `CURATED_ALL: CuratedMap`, ~134k lines, UNESCO pipeline + bulk city-import output. Auto-generated/hand-curated — see "Stable attraction IDs — NEVER change them" and "Soft-deleting an attraction" above before editing.
- `src/app/data/freetours-curated.ts` — `FREETOURS_CURATED: Record<string, Attraction[]>`, auto-generated by `merge-freetours.mjs` from Civitatis scrape data (root `CLAUDE.md`'s "Freetours data pipeline"). IDs `ft_<cityId>_<index>`, write-once. Do not hand-edit.
- `src/app/data/events-curated.ts` — `EVENTS_CURATED: CuratedMap`, auto-generated by `refresh-tm-events.mjs` from the Ticketmaster API ("Last refreshed" date in the file header). IDs `ev_<cityId>_<ticketmasterId>`; entries are `category: 'event_party'` with a fixed `date`/`time` — these are the "fixed events" `PlanTimeModalComponent` renders locked/read-only. Do not hand-edit; some cities carry duplicate consecutive entries from the source feed (harmless — `id` is the same either way).

### mock/

- `src/app/mock/comments.mock.ts` — `MOCK_COMMENTS: Record<string, Comment[]>`, keyed by attraction id; used only when `environment.useMocks` is true.
- `src/app/mock/trips.mock.ts` — `MOCK_TRIPS: Trip[]`, two seed trips (Europe, Japan) used only when `environment.useMocks` is true.

### core/ai

- `core/ai/attraction-catalog.service.ts` — City-scoped payload builder for AI calls; full mechanism (why `getCityIndex()` vs `getCityCatalog()` exist, memoization) is documented in "City-scoped AI payloads" above. Structurally: `getCityIndex()` lazy-imports `WORLD_CITIES` once and memoizes a `Promise<CatalogEntry[]>`; `getCityCatalog(cityIds)` lazy-imports `getAttractions` and caches per-city `CatalogEntry[]` in a `Map`.
- `core/ai/city-suggest.service.ts` — `CitySuggestService`: state (`openForStopId`, `loading`, `suggestions`, `error` signals) behind the "🐾 Sugiere qué hacer" cloud (`CitySuggestCloudComponent`). `request()` opens+fetches (costs karma); `searchMore()` re-fetches excluding already-shown+planned attractions with `isFollowUp: true` (free, per the Karma rules table); `addAll()` adds selected suggestions via `TripService.addAttraction` then closes; a 402 during fetch closes the cloud via `KarmaModalService.handleKarmaError`. No storage — pure in-memory signals.
- `core/ai/companion-suggestion.service.ts` — `CompanionSuggestionService`: the mascot-nudge trigger/reveal-delay/boost system is fully documented in "Companion mascot nudges" above — see that for `trigger()`'s silent-until-200 behavior, the 2.5s sniff delay, and `boost()`'s −2 karma 24h-window mechanics. Additional detail: `_boostExpiresAt` is a raw epoch-ms value the UI ticks a local countdown against (never self-updates), and `_boostJustPurchased` is a counter (not boolean) so `CompanionBoostCardComponent` can fire a one-time celebration effect only right after a purchase, not on every boosted render; `refreshBoostStatus()` no-ops (and clears the flag) when not logged in.
- `core/ai/plan-change-detector.util.ts` — Pure functions mirroring the backend's dual-baseline change-detection algorithm; the whole `AiPlanningComponent` mechanism is documented in "AI Plan Change Management (frontend)" above. Exports `CHANGE_THRESHOLD` (0.20), `FREE_CHANGE_LIMIT` (3), `levenshtein()` (O(m·n) DP), `serializeOptions()` (canonical lowercase/sorted JSON snapshot), `computeChangeRatio()`, `isMinorChange()`, `toSessionOptions()`.

### core/anonymous-id

- `core/anonymous-id/anonymous-id.service.ts` — `AnonymousIdService.get()`: one UUID per browser profile, persisted in `localStorage` key `tb_anonymous_id` (deliberately not sessionStorage — must survive tab closes/restarts). Falls back to an ungenerated-and-uncached fresh UUID per call if storage throws (private mode/quota). Sent as `X-Anonymous-Id` header by `ApiService` on highlight endpoints and by `AuthService` on login/register so the backend can fold anonymous "seen" state onto a new account.

### core/api

- `core/api/api.service.ts` — `ApiService`: single HTTP gateway; every method branches on `this.useMocks` (reads `environment.useMocks`, overridable via an injected `'ENV'` token used in tests) — mock branch returns canned/`localStorage`-backed `Observable`s, real branch calls `HttpClient` against `environment.apiUrl`. Method groups: **trips** `getTrips/saveTrip/updateTrip/deleteTrip/shareTrip/cloneOwnTrip/cloneSharedTrip/exportItinerary` (returns a `Blob`); **comments** `getComments/getCommentsBatch/addComment`; **karma** `getKarma/getKarmaPackages/createKarmaOrder/captureKarmaOrder/updateKarmaMock` (mock-only local balance mutator — real mode has no PATCH /karma, backend applies deltas server-side); **AI** `suggestTrips` (sends `cityIndex`), `planTrip` (sends `cityCatalog` scoped to `selectedOption.cityIds`), `suggestCityAttractions`, `suggestCompanion`, `boostCompanion`, `getCompanionStatus`; **favorites** `toggleFavorite/getFavorites`; **shared trips** `getSharedTrip/getStepComments/addStepComment/searchSharedTrips` (mock mode delegates to `SharedTripsService`); **highlights** `getHighlightStatus/markHighlightSeen/markHighlightDismissed` (send `X-Anonymous-Id`); **notifications** `getNotifications/getNotificationStatus/markNotificationsRead/setNotificationsMuted`; **featured/stats** `getFeatured`/`getStats` (both 24h `localStorage` cache); **collaborators** `inviteCollaborator/acceptCollaboratorInvite/removeCollaborator/getCollaborators/getPendingInvites`.

### core/auth

- `core/auth/auth-modal.service.ts` — `AuthModalService`: in-memory `_open` signal gating the login modal, plus a one-shot `_postLogin` callback set by `openLogin(onSuccess)` and fired by `executePostLogin()` after a successful login/register.
- `core/auth/auth.guard.ts` — `authGuard`: `CanActivateFn` that redirects to `/` (via `UrlTree`) unless `AuthService.isLoggedIn()`.
- `core/auth/auth.interceptor.ts` — `authInterceptor`: the token-attach/401-retry/boot-race mechanism is documented in "JWT token storage and rotation" above. Never attaches Bearer to `/auth/refresh` calls; on 401 (token was sent, not a refresh call) calls `auth.refreshAccessToken()` then retries once; if `auth.sessionMayExist()` is true it waits on the deduplicated refresh before sending any request at all.
- `core/auth/auth.service.ts` — `AuthService`: the NG0200 constructor gotcha, in-memory-token/HttpOnly-cookie split, `refreshAccessToken()` dedup, and proactive-refresh scheduling are documented in "JWT token storage and rotation" above. Not covered there: `login`/`register`/`resetPassword`/`updateProfile`/`requestOtp`/`requestProfileOtp`/`requestPasswordReset` all RSA-OAEP-encrypt their payload client-side (`encryptPayload()`, `environment.rsaPublicKey`, WebCrypto) before POSTing `{encryptedPayload}` — mock mode skips encryption; `classifyHttpStatus()` maps HTTP status to `RATE_LIMITED`/`UNAUTHORIZED`/`BAD_REQUEST`/`UNKNOWN` error codes.
- `core/comments/comment-cooldown.service.ts` — `CommentCooldownService`: `cooldownSeconds` (ticks down every 1s, `startCooldown(seconds)` resets) and `shaking` (true for 600ms via `triggerShake()`). Drives the nav-bar cooldown banner/shake after a step comment submission.

### core/device

- `core/device/device.service.ts` — `DeviceService`: single source of truth for the mobile/desktop split (see "Nav architecture — device split" above). Wraps `window.matchMedia('(max-width: 768px)')`, exposes `isMobile` signal (live via `change` listener) + `isDesktop` computed.

### core/favorites

- `core/favorites/favorites.service.ts` — `FavoritesService`: `favoritedTrips`/`loading` signals + internal `_favoritedIds` Set. 24h `localStorage` cache per user (`tb:favorites:cache:<email>`). `seedFromPayload()` initializes the set from trip-payload data without a round trip; `toggle()` is optimistic with rollback on error; `clear()` (logout) wipes signals + cache.

### core/home-address

- `core/home-address/home-address.service.ts` — `HomeAddressService`: `address` is a `computed()` over `AuthService.currentUser().homeCity` — owns no signal of its own. `save(value)` calls `AuthService.updateProfile({homeCity})`. Constructor runs a one-time migration: if the account has no server `homeCity` but a legacy `tb_home_<email>` localStorage key exists, pushes it server-side once then deletes the legacy key (kept on failure for retry).

### core/i18n

- `core/i18n/locale.service.ts` — `LocaleService`: `current()`/`other()` derive from Angular's `LOCALE_ID`. `persist(target)` writes only the `tb_locale` cookie (1yr) — never touches the URL, relying on a Vercel edge rewrite to serve the matching locale bundle next request. `switchTo(target, restoreView?)` persists the cookie, optionally stashes which shell panel was open into `sessionStorage` (`tb_restore_view`, one-shot via `consumeRestoreView()`), then does a same-URL `location.reload()`. See `[[feedback-angular-dual-locale-base-href-bug]]` memory for a related gotcha.
- `core/i18n/locale.util.ts` — Pure constants/types: `AppLocale`, `RestoreView`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE` (es-CL), `LOCALE_COOKIE_KEY`, `VIEW_RESTORE_KEY`, `isSupportedLocale()`, `otherLocale()`.

### core/karma

- `core/karma/karma-modal.service.ts` — `KarmaModalService`: `buyOpen` and `insufficientData` (`{need, have}|null`) signals. `handleKarmaError(err, fallback?)` is the canonical 402-parser — regexes `"need N, have M"` out of the backend error message, opens the insufficient modal — used sitewide per the Karma rules note "always route 402s through this".
- `core/karma/karma.service.ts` — `KarmaService`: `karma` signal (`number|null`). `gain()`/`spend()`/`purchaseComplete()` branch on `environment.useMocks`: mock mode optimistically mutates + writes `tb_karma_<email>`; real mode re-fetches the authoritative balance (backend already applied the delta). `clear()` on logout.

### core/maps

- `core/maps/google-maps-url.util.ts` — Keyless Google Maps "Maps URLs" helpers (no API key/billing). `MAX_ROUTE_WAYPOINTS = 9`. `placeQuery(name, cityId)` builds a `"name, city, country"` search string. `attractionMapsUrl()` builds a place-search link. `transitTerminalName(mode)` returns a generic terminal term (Aeropuerto/Estación de tren/Puerto) or `null` for bus/car (fall back to lodging). `dayRouteUrl()` builds a walking-directions link through an ordered attraction list, waypoints beyond the cap silently dropped.

### core/models

- `core/models/ai.model.ts` — `TripSuggestion` (carries `cityIds?: string[]`), `SuggestTripsResponse`, `CatalogEntry`/`CityCatalog`, `PlanSessionOptions`, `PlanChangeInfo`, `PlanTripRequest`/`PlanTripResponse`, `SuggestionScheduleEntry`/`SuggestionDeparture`, `CityAttractionSuggestion`, `SuggestCityAttractionsResponse`, `CompanionSuggestion`, `CompanionStatusResponse`.
- `core/models/attraction-category.ts` — `AttractionCategory` union, `CategoryMeta` shape (full color/icon table in "Attraction categories" above). `getCategoryMeta()`/`getAllCategories()` are functions (not module-level consts) so `$localize` calls execute lazily after the i18n polyfill loads, not at import time.
- `core/models/city.model.ts` — `Region` union (10 world regions), `City` interface, `REGION_LABELS` (`$localize` lookup for region display names — module-level, unlike `attraction-category.ts`).
- `core/models/comment.model.ts` — `Comment`, `StepComment`/`StepCommentAddResult`, `DayHours`/`WeekDay`/`WeeklySchedule`, `TicketPrices`, and the canonical `Attraction` interface used throughout the curated-data layer (id, name, nativeName, category, active, icon/bg, rating, estimatedMinutes, imageUrl/images, description/descriptionEn, website, schedule, ticketUrl/ticketPrices, date/time for fixed events).
- `core/models/curated.model.ts` — Re-exports `Attraction`; defines `CuratedMap = Record<string, Attraction[]>`.
- `core/models/featured-trip.model.ts` — `FeaturedTrip` (landing slideshow data), `AppStats` (`{cities, users, plans}`).
- `core/models/highlight.model.ts` — `HighlightType` (currently just `'landing_welcome'` — new tours must add their id here), `HighlightStatus` (`{seen: boolean}`).
- `core/models/karma-purchase.model.ts` — `KarmaPackage` (price as string to preserve exact decimals), `CreateOrderResponse` (`{orderID}`), `CaptureOrderResponse` (`{karma, karmaAdded}`).
- `core/models/notification.model.ts` — `NotificationType` union (`comment|favorite|clone|purchase|collaborator_invite|collaborator_accepted`, new backend types render fine untyped via string fallback), `AppNotification` (includes relative deep-link `url`), `NotificationStatus` (`{count, muted}`).
- `core/models/plan-slideshow.model.ts` — `SlideshowItem`: one fullscreen slide (attraction or transit-leg segment), id/name/type/icon/imageUrl/description + start/end date+time.
- `core/models/trip.model.ts` — `PlannedAttraction` (entryId/attractionId/startTime/endTime/date/category/ticketPurchased), `Lodging`, `TripStop`, `TransitMode`, `TransitSegment`/`TransitLeg` (multi-segment — see "Data models" above for the migration story), `Planification`, `Trip` (includes co-editing fields `isCollaborator`/`ownerName`/`ownerEmail`), `Collaborator`, `PendingCollaboratorInvite`, `FavoritedTrip`.

### core/notifications

- `core/notifications/notification.service.ts` — `NotificationService`: `notifications`, `unreadCount`, `muted`, `shaking` signals. Constructor `effect()` starts/stops a 60s poll based on `auth.isLoggedIn()` (wrapped in `untracked()` — same gotcha class as the highlight-tour signal leak documented above). `refreshStatus()` triggers a 900ms bell-shake on count increase (never when muted). `openPanel()` fetches the full list *then* marks all read, so freshly-fetched items stay visually "new" while the badge clears immediately. `toggleMute()` is optimistic with rollback.

### core/routing

- `core/routing/share-redirect.util.ts` — `shareRedirectPath(search)`: converts the legacy `?share=<id>[&highlight=...]` query-param form into the canonical `/shared/<id>[?highlight=...]` path; `null` if no `share` param. Run once at boot (see "Top-level routing" above).

### core/saved-plans

- `core/saved-plans/auto-save.service.ts` — `AutoSaveService`: drives the periodic auto-save tick + the "unsaved changes, auto-save is off" reminder banner for co-editing. `enabled` computed reads a per-plan override from `tb_autosave_override_<planId>` localStorage, defaulting ON for own plans / OFF for collaborations (`!trip.loadedPlanOwner()`) when no explicit choice exists. `commitSnapshot(planId)` serializes `{stops, transits}`; `hasChangedSinceLastSave()` does a full JSON-deep-equal diff (deliberately not a reference check — signals can hand back new references on unrelated re-renders). `start()` is idempotent, no-ops entirely if `environment.autoSaveIntervalMs <= 0`; runs two intervals — one at the configured cadence (`tick()`), one every 1s updating `secondsUntilNextTick`. `showReminderNow()` fires immediately on entering a collaboration with auto-save off.
- `core/saved-plans/saved-plans.service.ts` — `SavedPlansService`: `plans` + `pendingInvites` signals. Mock mode persists to `tb_saved_plans_<email>`; real mode calls `ApiService.getTrips/saveTrip/updateTrip/deleteTrip`, mapping `Trip` → `SavedPlan` (carrying `shareId`/`itineraryExportedAt`/collaborator fields). `upsert()` returns the final id as an `Observable<string>`. `register(plan)` adds an already-server-existing trip into local state without a round trip (used after cloning a shared trip).

### core/share

- `core/share/share-url.util.ts` — `buildShareLink(shareId, origin?)` builds the canonical `/shared/:id` absolute URL. `buildWhatsappUrl()` builds a `wa.me/?text=` link. `shareTrip()` (async) prefers the native Web Share API, falls back to WhatsApp if unavailable or on any error other than a user-cancel `AbortError`.

### core/shared-trips

- `core/shared-trips/shared-trips.service.ts` — `SharedTripsService`: mock-mode-only shared-trip store (real mode uses `ApiService` directly), persisted to `localStorage` key `tb_shared_trips`. `getTrip(id)` — if the stored entry has a `planId`, re-reads the *live* plan from `tb_saved_plans_<ownerEmail>` and merges in current `tripName`/`stops`/`transits`, so a shared view reflects the owner's latest edits rather than a frozen snapshot. `search()` filters via `normalizeSearch`, capped to 5 results. `getCommentCount()` is a stub (always returns 0).

### core/ui

- `core/ui/toast.service.ts` — `ToastService`: single `message` signal, `show()`/`clear()`. Rendered once by `ShellComponent`.

### core/utils

- `core/utils/attraction-description.util.ts` — `localizedDescription(attraction, locale)`: picks `descriptionEn` for `en-US`, falls back to `description` if untranslated; returns `description` for any other locale.
- `core/utils/attraction-hours.util.ts` — `getTodayKey()`, `getTodayHours(schedule)`, `formatHours()` (`"09:00 – 17:00"`), `formatTodayHours()` (`"Abierto 09:00 – 17:00"` / `"Cerrado hoy"` / `null`). Spanish-hardcoded strings (not `$localize`) — check before shipping the English locale.
- `core/utils/attraction-images.util.ts` — `attractionImages(attraction)`: ordered, de-duplicated photo list, `imageUrl` first then `images[]` extras.
- `core/utils/event-datetime.util.ts` — `dd/mm/yyyy`-string helpers. `parseDMY()` → local-midnight `Date` or `null`. `isDateInRange(eventDate, checkIn, checkOut)`: an incomplete stay range imposes no constraint (`true`); unparseable event date → `false`. `formatEventChip()`/`formatEventLong()` produce short/long display labels.
- `core/utils/itinerary-export.util.ts` — `buildItineraryExportMaps(stops)`: builds the `{cityNames, attractionNames, ticketRequiredIds}` payload for `POST /trips/:id/itinerary` from a plain `TripStop[]`. Shared by `DayTimelineComponent.exportItinerary()` and `MyTripsComponent.downloadItinerary()` — see "XLSX itinerary export" above.
- `core/utils/normalize-search.util.ts` — `normalizeSearch(value)`: lowercase + NFD-normalize + strip combining diacritics (accent-insensitive search, e.g. `"Bogotá"` matches `"bogota"`). Reuse for any new search/filter box.
- `core/utils/password-strength.util.ts` — `computePasswordStrength(password)` (length + character-class scoring → `'none'|'vulnerable'|'light'|'strong'`), `passwordStrengthColor(strength)`, `isPasswordStrengthBarActive(strength, index)`. Shared by `AuthModalComponent` and `ProfileComponent`'s password forms — see those entries above for what's deliberately kept separate (the label text).
- `core/utils/touch-drag-ghost.service.ts` — `TouchDragGhostService`: pure display-state sibling to `TouchDragService` driving the mobile "what am I dragging" ghost pill — see "Day-timeline drag-and-drop" above for the full mechanism.

### core/visited-places

- `core/visited-places/visited-places.service.ts` — `VisitedPlacesService`: `pins` signal (`VisitedPin[]` — id/label/x%/y% map coords), persisted per-user to `tb_visited_<email>`. `clear()` (logout) only clears the in-memory signal, not the localStorage entry — pins reappear on next login for the same account.

### features/nav

- `features/nav/nav-facade.service.ts` — `NavFacadeService`: owns every piece of state/mutation behind the nav bar; both `NavDesktopComponent`/`NavMobileComponent` bind to it via `facade.*`. Grouped responsibilities: **search** — `navQuery`/`searchOpen`/`navFiltered` (city matches via `normalizeSearch`) + `navSharedTrips` (debounced `api.searchSharedTrips` via `toObservable`+`switchMap`); **user menu** — `userMenuOpen`, `initials`, `toggleUserMenu()`; **saved plans** — `plansOpen`/`planSearch`/`filteredPlans`, `doSavePlan()`/`doLoadPlan()`/`doDeletePlan()`, `doClonePlan()` (−1 karma), `sharePlan()`/`shareNative()`; **favorites** — `favoritesOpen`, lazy-loaded on first open; **my shared trips** — `mySharedTrips` computed from plans with a `shareId`; **karma pill/overlay** — `karmaIcon()`/`karmaPillStyle()`, `onKarmaGained()`→`karmaSuccessOpen`; **logout** — `doLogout()` clears trip/karma/savedPlans/visited/favorites/companion state. `switchLocale()` delegates to `LocaleService.switchTo()`, passing `currentShellView` (set by `ShellComponent`) so a language switch can restore the panel that was open.
- `features/nav/nav-shell.component.ts` — `NavShellComponent` (selector `app-nav`, the call site everywhere). Switches between `<app-nav-desktop>`/`<app-nav-mobile>` on `DeviceService.isMobile()`, renders once `<app-auth-modal>` + the buy-karma/karma-success/insufficient-karma overlays. Re-emits `logoClick`/`profileClick`/`myTripsClick`.
- `features/nav/desktop/nav-desktop.component.ts` — `NavDesktopComponent`: full desktop top bar — logo, search input + dropdown (cities + matching shared trips), language flag dropdown, karma pill + "Comprar Karma" pill + cooldown banner, `<app-notification-bell>`, login button or user avatar → floating `.user-panel`. Closes `userMenuOpen` on outside `mousedown` (not `click`) via `ElementRef.contains`.
- `features/nav/mobile/nav-mobile.component.ts` — `NavMobileComponent`: compact bar + slide-in `drawerOpen` (local signal, not on the facade). Every drawer action handler must also call `this.drawerOpen.set(false)` (see "Every mobile drawer action must close `drawerOpen` itself" above).
- `features/nav/shared/auth-modal.component.ts` — `AuthModalComponent` (selector `app-auth-modal`, rendered once by `NavShellComponent`). Owns the entire login/register/password-reset modal: mode switching, two-step OTP registration, Turnstile lifecycle, password-strength meter (scoring/color/bar-active shared with `ProfileComponent` via `core/utils/password-strength.util.ts` — only the label text stays local, since `ProfileComponent`'s labels are `$localize`d and this modal's aren't yet), per-submit-path loading signals (`otpLoading`/`registerLoading`/`loginLoading`/`resetLoading`), full password-recovery flow. On success re-syncs `TripService`/`KarmaService`/`SavedPlansService`/`VisitedPlacesService`/`FavoritesService`/`CompanionSuggestionService`, then calls `authModal.executePostLogin()`.
- `features/nav/shared/notification-bell.component.ts` — `NotificationBellComponent` (selector `app-notification-bell`, both nav bars, logged-in only). Badge + shake animation, dropdown list; `open(n)` special-cases `collaborator_invite`/`collaborator_accepted` to route into My Trips' "Colaboraciones" tab via `facade.pendingMyTripsTab.set('collaborations')`; other types reuse `shareRedirectPath()`.

### features/karma

- `features/karma/buy-karma-modal.component.ts` — `BuyKarmaModalComponent` (selector `app-buy-karma-modal`). Package grid via `api.getKarmaPackages()`, then lazy-loads the real PayPal SDK and renders `paypal.Buttons()` (watched by a `ResizeObserver`) or, in mock mode, a "Simular compra" button. On success calls `karma.purchaseComplete()` and emits `karmaGained`.
- `features/karma/insufficient-karma-modal.component.ts` — `InsufficientKarmaModalComponent` (selector `app-insufficient-karma-modal`). Pure display of `KarmaModalService.insufficientData()` + a "Comprar karma" CTA.
- `features/karma/karma-success-overlay.component.ts` — `KarmaSuccessOverlayComponent` (selector `app-karma-success-overlay`). Stateless full-screen celebration (`amount`/`newTotal` inputs, `dismissed` output), CSS-only animations.

### features/landing

- `features/landing/app-footer.component.ts` — `AppFooterComponent` (selector `tb-app-footer`, S4). Static footer: brand block, three nav columns (`routerLink="/about"` for "Sobre Tripilove"), copyright. No logic.
- `features/landing/featured-slideshow.component.ts` — `FeaturedSlideshowComponent` (selector `tb-featured-slideshow`, S2). Fetches `api.getFeatured()`; hides entirely until loaded and non-empty. Auto-advances every 5s through crossfading slides. `coverUrl()` picks a real trip photo, else the static `CITY_COVER_PHOTOS` map of verified Unsplash CDN photo IDs (`source.unsplash.com` is deprecated — never reintroduce it). Clone button routes to `/shared/:id?highlight=clone`.
- `features/landing/landing-about.component.ts` — `LandingAboutComponent` (selector `tb-landing-about`, S3). Fetches `api.getStats()`. `IntersectionObserver` at 30% fires once: reveals `.reveal` elements, then runs a quartic-eased count-up on `[data-target]` stat spans (instant under `prefers-reduced-motion`).

### features/about

- `features/about/about-initials.util.ts` — `getInitials(name)`: first letters of up to 2 words, uppercased — avatar-photo fallback.
- `features/about/about-team.data.ts` — `AboutTeamMember` interface + `ABOUT_TEAM` array, i18n'd via `$localize` tagged strings (a `.ts` const array, not template `i18n` attrs).
- `features/about/about.component.ts` — `AboutComponent` (selector `app-about`, routed at `/about`). "Flight path" journey section: for each `ABOUT_TEAM` member, a photo-or-initials step connected by animated plane-icon SVG paths (`offset-path`, hardcoded bezier strings), revealed via `tbInView`. Hosts its own `<app-nav>` + lazily-opened `<app-profile>` overlay.

### features/welcome

- `features/welcome/welcome.component.ts` — `WelcomeComponent` (selector `app-welcome`, S1 of the landing scroll). `BackgroundSliderComponent` behind overlay copy + three CTAs: "Crear Plan" (`addDestination` output), "🐾 Crear con IA" (`openAiPlanning` output, carries `tbHighlightTarget="ai-plan-btn"`), "⭐ Cómo ganar Karma" (local info modal). Auto-advances its background slideshow independently of the landing featured slideshow.

### features/shell

- `features/shell/shell.component.ts` — `ShellComponent` (selector `tb-shell`, the router's `''` route — the actual app root now that routing goes through `app.routes.ts`). Switches between landing mode (`.landing-scroll`: S1 inline shell+welcome, `<tb-featured-slideshow>`, `<tb-landing-about>`, `<tb-app-footer>`) and app mode (`.layout`: `<app-stop-list>` + `<tb-day-timeline>` + `<app-destination>`/empty-state) on `trip.stops().length === 0`. Mounts every root-level singleton overlay: add-stop modal, mobile attractions modal, companion mascot, highlight tour, toast, autosave reminder banner (skipped while `showProfile()` is open), profile/my-trips/AI-planning overlays (AI planning `@defer`red until opened). Constructor effects: (1) re-triggers `SavedPlansService.loadForUser()` when `auth.currentUser()` transitions to a new email (works around the service's own one-shot constructor check running before the silent-refresh resolves on reload); (2) syncs `facade.currentShellView` + restores the previously-open panel after a locale-switch reload via `locale.consumeRestoreView()`; (3) opens My Trips when `facade.pendingMyTripsTab()` is set; (4) starts the `landing_welcome` highlight tour for anonymous, no-session, empty-trip visitors, gated by `auth.sessionMayExist()` (see "Highlight tour" above for the NG0200-adjacent boot-race this guards against).

### features/comments

- `features/comments/comment-similar-modal.component.ts` — `CommentSimilarModalComponent` (selector `app-comment-similar-modal`). Single-purpose static modal ("comment too similar, please reword"), one `dismiss` output.

### features/my-trips

- `features/my-trips/my-trips.component.ts` — `MyTripsComponent` (selector `app-my-trips`). Full-screen `.profile-page` overlay with its own `<app-nav>` + nested `<app-profile>`. Four tabs: **trips** — owned `SavedPlansService.plans()` (excludes collaborations), expandable to `<app-trip-itinerary>`, clone/delete confirm, Excel export (`downloadItinerary()`, −1 karma first export), publish/share, inline **collaborators panel** (`inviteCollaborator()`/`removeCollaborator()`, lazy-fetched on first expand); **favorites** — delegates to `FavoritesService`; **collaborations** — plans where `isCollaborator` is true, "✏️ Modificar mi plan" → `loadAndModify()`; **invites** — `pendingInvites()`, accept via `api.acceptCollaboratorInvite()` then jumps to the collaborations tab. Consumes `facade.pendingMyTripsTab` once to jump straight to a tab.

### features/profile

- `features/profile/companion-boost-card.component.ts` — `CompanionBoostCardComponent` (selector `app-companion-boost-card`, embedded in `ProfileComponent`). Boosted/unboosted mascot artwork based on `CompanionSuggestionService.boostExpiresAt()` vs. a locally-ticking `now` signal (1s interval) — reverts on its own at expiry without a network round trip. `remainingLabel()` formats `HH:MM:SS`. A separate `celebrating` signal (2.6s) plays a hearts/fireworks burst only right after `companion.boost()` succeeds, never on a page-load discovery of an already-active boost.
- `features/profile/profile.component.ts` — `ProfileComponent` (selector `app-profile`, full-screen `.profile-page` overlay). Owns: edit-account accordion (name/email/password/home-city, each with its own `editSaveX()`, shared `editLoading`/`editSavedTab`/`editErrorCode` signals — email change is a two-step OTP flow); a password-strength meter (scoring shared with `AuthModalComponent` — see that entry above); `<app-companion-boost-card>`; a trip-summary card (current in-memory `TripService` stops/counts); a visited-places world map (click-to-drop-pin, `pendingPin`/`pendingLabel` two-step add). See "Critical signal gotcha" above re: `auth.currentUser()` inside effects.
- `features/profile/trip-itinerary.component.ts` — `TripItineraryComponent` (selector `app-trip-itinerary`, pure presentational — `stops`/`transits` inputs). Renders city cards (lodging + planned attractions with `att.estimatedMinutes | duration`) chained by transit-leg summaries, including synthetic `__start__`/`__end__` "Salida 🏠"/"Vuelta 🏠" legs.

### features/destination

- `features/destination/attraction-card/attraction-card.component.ts` — `AttractionCardComponent` (`app-attraction-card`): the grid card in `AttractionsListComponent`. Image/icon, plan button (single planned entry → edit; none/multiple → add), footer rating/comment count, hours/ticket/website/maps enrichment strip, entry chips (one per scheduled visit, each with an optional "🎟 Entrada comprada" checkbox). On add, shows a toast and fires `CompanionSuggestionService.trigger()` (silent, fire-and-forget).
- `features/destination/attraction-detail-modal/attraction-detail-modal.component.ts` — `AttractionDetailModalComponent` (`app-attraction-detail-modal`): full-info modal with a hero image carousel (opens `AttractionImageLightboxComponent` on click), duration/plan button, `localizedDescription`, enrichment strip, comments list + "Agregar comentario" gated on `auth.isLoggedIn()`. Comment submit routes 409→similar-modal, 429→cooldown+shake, 402→`KarmaModalService`. Closes itself after a first-time plan-confirm.
- `features/destination/attraction-image-lightbox/attraction-image-lightbox.component.ts` — `AttractionImageLightboxComponent` (`app-attraction-image-lightbox`): fullscreen photo viewer, reparented to `document.body` via `Renderer2` (stacking-context escape). Keyboard arrows/Escape, touch swipe (50px threshold), dot/arrow nav, replays the entrance animation on every index change.
- `features/destination/attractions-list/attractions-list.component.ts` — `AttractionsListComponent` (`app-attractions-list`): search box + category filter chips + the attraction-card grid for a city. Filters via `normalizeSearch()` + `AttractionCategory`; resets both filters when the `city` input changes. Shared by `DestinationComponent` and `MobileAttractionsModalComponent`.
- `features/destination/comment-modal/comment-modal.component.ts` — `CommentModalComponent` (`app-comment-modal`): star rating + textarea. `submit()` builds the `Comment` payload using the user's initial for a deterministic `AV_COLORS` avatar color; `isValid()` requires non-empty text and rating > 0.
- `features/destination/destination-modal.service.ts` — `DestinationModalService` (root): trivial open/closed signal shared between `MobileAttractionsModalComponent` and `StopListComponent`'s "➕ Agregar atracción" button.
- `features/destination/destination.component.ts` — `DestinationComponent` (`app-destination`): desktop-only (`!device.isMobile()`) right-panel view for the active stop's city — banner + `<app-attractions-list>`. Loads all comments for the city in one `getCommentsBatch()` call.
- `features/destination/mobile-attractions-modal/mobile-attractions-modal.component.ts` — `MobileAttractionsModalComponent` (`app-mobile-attractions-modal`): mobile fullscreen equivalent of `DestinationComponent`, gated by `DestinationModalService.isOpen()`. Deliberately a sibling of `<app-nav>` (not nested in `.right-panel`) — a fixed-position descendant of `.right-panel` fails to stack above the sticky mobile nav. Own scroll-to-top FAB.
- `features/destination/plan-time-modal/plan-time-modal.component.ts` — `PlanTimeModalComponent` (`app-plan-time-modal`), exports `PlanEntry`/`ScheduleEntry`. Date+time picker, locked/read-only for fixed events (`category === 'event_party'` with a `date`). Computes `overlappingIds()` (time-range collision, same-day only) for a conflict warning. `isEditing()` toggles the "Quitar del plan" button.

### features/planning

- `features/planning/day-timeline/day-timeline.component.ts` — `DayTimelineComponent` (`tb-day-timeline`, `OnPush`): the hour-grid timeline (see "DayTimelineComponent" above for the day-tab auto-select gotcha). `stop`/`transits` inputs override `TripService` for read-only contexts (shared-trip page); `inline` input disables mobile auto-collapse for the per-stop inline view; `showPlanSlideshow` gates the "🎞️ Presentación del plan" button (only the trip-wide instance in `ShellComponent` sets it). Owns `days()`, `blocks()` (merges attraction + transit blocks), `routeUrl()` (walking route via Google Maps, using arrival/departure terminal on first/last day instead of lodging), `exportItinerary()` (builds `cityNames`/`attractionNames`/`ticketRequiredIds`, POSTs, downloads the blob — see "XLSX itinerary export" above), and `daySlideItems()`/`planSlideItems()` for `PlanSlideshowComponent`.

### features/shared-trip

- `features/shared-trip/attraction-preview-popover.component.ts` — `AttractionPreviewPopoverComponent` (`app-attraction-preview-popover`): positioned (`x`/`y` inputs) hover-card with image/type/name/rating/description/website/hours/ticket; purely presentational.
- `features/shared-trip/shared-trip.component.ts` — `SharedTripComponent` (`app-shared-trip`, routed at `/shared/:id`): the entire read-only public itinerary view. Fetches trip + step comments via `forkJoin`; 429 → retry-button state. Per-step `app-step-comments` toggles keyed by string (`transit:__start__`, `stop:<cityId>`, `lodge:<cityId>`, `att:<cityId>:<attractionId>`, `transit:<from>:<to>`, `transit:__end__`). Favorite toggle does optimistic count update with rollback. Clone button gates on login, then `openCloneInEditor()` registers the clone + navigates home. `?highlight=clone` triggers a one-shot shake on the clone button. Desktop-hover/mobile-tap attraction preview popover logic in `onAttHover`/`onAttClick`/`onAttHoverLeave` (150ms hover delay, viewport-clamped positioning).
- `features/shared-trip/step-comments.component.ts` — `StepCommentsComponent` (`app-step-comments`): inline comment thread + input for one itinerary step. Enforces a 50-character minimum. Emits `focusLost` when a document click lands outside the component AND the input is empty (guarded by a `_ready` flag so the opening click doesn't immediately close it) — lets `SharedTripComponent` collapse a step back to its toggle button.

### features/trip (incl. trip/stop-list)

- `features/trip/trip.service.ts` — `TripService` (root): owns all trip state per the "Core services" table above — `_stops`, `_transits`, `_activeId`, `_loadedPlanId`, `_loadedPlanOwner`, `_selectedTransitId`. Persists to `localStorage` (`tb_plan_<email>` / `tb_active_plan_<email>`) via a constructor `effect()` guarded by a `_saving` flag. `loadForUser(email)` runs `migrateStop`/`migrateTransitLeg` (legacy single-mode transit → `segments[]`). `loadForUserPreservingAnonymous(email)` is the "snapshot in-memory stops, load, restore if empty" flow. Public API groups: stop CRUD (`addStop`/`removeStop`/`updateDates`, auto-sorted by check-in), lodging (`setLodging`/`removeLodging`), transit (`setTransit`/`removeTransit`, keyed by `fromCityId|toCityId`), active-selection (`setActive`/`selectTransit`, mutually exclusive), planned-attraction CRUD (`addAttraction`/`patchAttractionTime`/`setTicketPurchased`/`removeAttraction`/`updateStartTime`) — all compute/persist `endTime` immediately via the exported `addMinutesToTime()` helper rather than deriving it lazily at render time.
- `features/trip/add-stop-modal/add-stop-modal.component.ts` — `AddStopModalComponent` (`app-add-stop-modal`): city + date-range form calling `TripService.addStop()`. `defaultCheckIn()` auto-seeds check-in from the latest stop's check-out. `consecutiveWarning()` warns (non-blocking) if the city is already adjacent in stop order. Backdrop-close requires both `mousedown` and `click` on the backdrop itself, filtering a mobile "ghost click" fired right after a flatpickr calendar closes.
- `features/trip/stop-list/city-suggest-cloud.component.ts` — `CitySuggestCloudComponent` (`app-city-suggest-cloud`): the fullscreen comic-chat AI-suggestion overlay (see "AI attraction suggestions" above). Reparents to `document.body` in `ngOnInit`. `selectedIds` re-seeds to "all checked" whenever the `suggestions` input array changes. Escape closes it; backdrop click does not (by design). Emits `addAll` with only the checked IDs.
- `features/trip/stop-list/lodging.component.ts` — `LodgingComponent` (`app-lodging`): inline edit form (name/url/address/notes, last two trimmed to `undefined` if blank), reads/writes via `TripService.setLodging()`/`removeLodging()`. Clicking the badge or empty-state label opens the edit form; clicking elsewhere selects the parent stop.
- `features/trip/stop-list/stop-list.component.ts` — `StopListComponent` (`app-stop-list`): the entire left panel — trip name header (auto-save toggle + countdown), per-stop cards (flag/dates-inline-editable/lodging/AI-suggest pill/mobile add-attraction pill/inline city timeline toggle/planned-attractions list sorted via `plannedSorted()` — see "Left-panel planned-attraction ordering" above — with inline time inputs and collision warning via `hasTimeCollision()`), departure/arrival transit connectors, footer "Guardar viaje" flow (karma-gated). `suggestForCity()` gates the AI-suggest button on login.
- `features/trip/stop-list/transit-connector.component.ts` — `TransitConnectorComponent` (`app-transit-connector`): departure/mid-trip/arrival transit UI — empty prompt, edit form (per-segment mode/date/time/notes/carrier/location, chained so a new segment's departure defaults to the previous segment's arrival), or the read badge. `type` input (`'default'|'departure'|'arrival'`) changes labeling/home-city framing. Computes `arrivalBeforeDep()`/`canAddSeg()`/`pendingDuration()` for live validation. `openEdit()` on `type==='default'` also calls `trip.selectTransit()` to switch the right-panel timeline into transport mode.

### features/ai-planning

- `features/ai-planning/ai-planning.component.ts` — `AiPlanningComponent` (`app-ai-planning`): the 3-step (`preferences`→`options`→`result`) AI trip planner — the entire signal/computed/method set (`planSessionId`, `suggestBaseline`, `originalPlanOptions`, `freeChangesUsed`, `suggestConfirmPending`, `planConfirmPending`, `changeWarning`/`changeCharged`, `planChangeAnalysis`, `planChangeBarWidth`, `suggest`/`executeSuggest`/`confirmSuggest`/`plan`/`executePlan`/`handleChangeInfo`/`adjustOptions`/`reset`) is implemented exactly as documented in "AI Plan Change Management (frontend)" above — this file is the sole owner of that logic. Gates the whole page behind `auth.isLoggedIn()`. Step 1 also has a category-chip picker (folded into `buildPreferences()`) and a date picker. Step 3 renders the itinerary read-only (same markup pattern as `SharedTripComponent`); `save()` persists via `TripService.restoreStops()` + `SavedPlansService.upsert()`.

### shared/autosave-reminder-banner

- `shared/autosave-reminder-banner/autosave-reminder-banner.component.ts` — `AutosaveReminderBannerComponent` (`app-autosave-reminder-banner`): fixed-top warning banner, single `dismiss` output; auto-dismisses after 8s. Purely presentational, driven by `AutoSaveService`.

### shared/background-slider

- `shared/background-slider/background-slider.component.ts` — `BackgroundSliderComponent` (`app-background-slider`) + `Slide` interface + `SLIDES` (8 hardcoded Unsplash city photos). Pure presentational carousel: `activeIdx` input controls the active slide/caption; `prev`/`next`/`dotClick` outputs — all timer/auto-advance logic lives in the caller (`WelcomeComponent`).

### shared/city-combobox

- `shared/city-combobox/city-combobox.component.ts` — `CityComboboxComponent` (`app-city-combobox`): searchable city picker used by `AddStopModalComponent`. `excludeIds` input filters already-added cities; results grouped by `Region` under localized `REGION_LABELS` headers. Closes on outside `mousedown`; auto-focuses the search input on open via `setTimeout(0)`.

### shared/companion-mascot

- `shared/companion-mascot/companion-mascot.component.ts` — `CompanionMascotComponent` (`app-companion-mascot`): presentational half of the companion-nudge feature (see "Companion mascot nudges" above). Renders `companion.state()` (`'sniffing'` → roaming dog image, `'suggesting'` → speech-bubble card) and derives `suggestionView()` by resolving the suggested attraction via `findCuratedAttraction()`. All state/timing/API logic lives in `CompanionSuggestionService`. No backdrop/outside-click/auto-dismiss.

### shared/date-picker

- `shared/date-picker/date-picker.component.ts` — `DatePickerComponent` (`app-date-picker`): single-date flatpickr wrapper (`d/m/Y` format), Spanish locale swapped in when `LOCALE_ID` starts with `es`. `initialDate`/`minDate`/`maxDate` inputs (`dd/mm/yyyy` strings, parsed manually). `onOpen` jumps the calendar to the initial date's month.

### shared/date-range

- `shared/date-range/date-range.component.ts` — `DateRangeComponent` (`app-date-range`): paired check-in/check-out flatpickr inputs with cross-constraint wiring. Implements the custom viewport-clamped `makePosition()` positioner referenced by `[[feedback-flatpickr-positioning]]` — replaces flatpickr's default (unreliable `children.offsetHeight`/`body.offsetWidth` on first open in a fixed modal) with a `getBoundingClientRect()`-based left/top clamp plus above/below arrow toggling. `alignRight` flips which edge the calendar hangs from.

### shared/directives

- `shared/directives/in-view.directive.ts` — `InViewDirective` (`[tbInView]`): adds `.in-view` to the host the first time it crosses 30% visibility via `IntersectionObserver`, then `unobserve()`s itself (fires once). Used sitewide for scroll-reveal (`.reveal.hidden` → `.reveal.in-view`) and `AboutComponent`'s flight-path reveal.

### shared/flag-icon

- `shared/flag-icon/flag-emoji.util.ts` — `countryCodeFromFlagEmoji(flag)`: decodes a two-codepoint regional-indicator flag emoji into a lowercase ISO 3166-1 alpha-2 code for flagcdn.com URLs; returns `null` for anything that isn't exactly two valid regional-indicator codepoints (fallback glyphs like `'📍'`/`'🏠'`, plain text).
- `shared/flag-icon/flag-icon.component.ts` — `FlagIconComponent` (`app-flag-icon`): renders a real flagcdn.com `<img>` (`w40` source, CSS-scaled via `size` input) when `flag` decodes to a country code, else falls back to the raw emoji/glyph as text.

### shared/highlight-tour

- `shared/highlight-tour/highlight-registry.service.ts` — `HighlightRegistryService` (root): trivial `Map<string, HTMLElement>` — `register()`/`unregister()`/`get()`. Backing store `HighlightTargetDirective` writes into and `HighlightTourService`/`HighlightTourComponent` read from.
- `shared/highlight-tour/highlight-seen.service.ts` — `HighlightSeenService`: implements the three-layer seen-tracking lookup described in "Highlight tour" above. `hasSeenLocally`/`markSeenLocally` read/write the layer-1 `sessionStorage` cache; `checkServerStatus()` returns the cached value if present, else calls `GET /highlights/:type/status` and caches whichever answer comes back; `markSeenOnServer()`/`markDismissedOnServer()` are fire-and-forget POSTs — the dismiss path never touches the local cache (backend owns the 3-strikes escalation).
- `shared/highlight-tour/highlight-storage.util.ts` — `HIGHLIGHT_STORAGE_PREFIX` (`'tb_highlight_seen_'`) + `highlightStorageKey(type)`.
- `shared/highlight-tour/highlight-target.directive.ts` — `HighlightTargetDirective` (`[tbHighlightTarget]`): registers/unregisters its host element under a string id in `HighlightRegistryService` on init/destroy.
- `shared/highlight-tour/highlight-tour.component.ts` — `HighlightTourComponent` (`app-highlight-tour`): renders the veil/spotlight-ring/mascot/bubble, reparented to `document.body` via `Renderer2`. Runs an independent continuous 3-frame dog wag/wag/play-bow loop (400ms/frame) unrelated to tour step state. Listens for `window:scroll` in the **capture phase** — scroll events on an inner scrollable container (e.g. `.landing-scroll`) don't bubble to `window`, so a plain `HostListener('window:scroll')` would miss them. `sceneStyle()` computes the bubble's clamped position against both viewport edges, choosing above/below placement based on available space below the target. Escape closes it.
- `shared/highlight-tour/highlight-tour.service.ts` — `HighlightTourService` (root): the tour state machine. `start(type, { shouldStillShow? })` is wrapped entirely in `untracked()` — see "Critical gotcha — signal-tracking leak through a called method" above for the exact bug this fixes. `next()`'s last-step button calls `confirm()` (marks seen locally + server-side); `close()`/early exit calls `dismiss()` (server-side dismissal count only). `resolveCurrentTarget()` polls the registry up to 10×100ms for the next step's element, calling `scrollIntoView({block:'center', behavior:'smooth'})` only on mobile; auto-skips a step whose target never resolves.
- `shared/highlight-tour/highlight-tours.config.ts` — `HighlightStep` interface + `HIGHLIGHT_TOURS: Record<HighlightType, HighlightStep[]>` — the only shipped tour is `landing_welcome` (2 steps: `login-btn` → `ai-plan-btn`). Adding a new tour is a data-only change here plus a new `HighlightType` union member.

### shared/pipes

- `shared/pipes/duration.pipe.ts` — `DurationPipe` (`duration`): formats a minutes count as `"Nh Mmin"` / `"Nh"` / `"Mmin"`. Used wherever `estimatedMinutes` is displayed.

### shared/plan-slideshow

- `shared/plan-slideshow/plan-slideshow.component.ts` — `PlanSlideshowComponent` (`app-plan-slideshow`): fullscreen presentation-mode overlay (the "🎞️ Presentación del plan" feature). Takes a pre-built `items: SlideshowItem[]` input; auto-advances every 6s (paused/restarted on manual nav), keyboard arrows/Escape, touch swipe (50px threshold), dot/arrow nav, caption with start–end date-time plus a `.ps-caption-desc` line (line-clamped) when the item has a `description`. Falls back to an icon tile when an item has no `imageUrl`.
- `shared/plan-slideshow/plan-slideshow.util.ts` — `buildPlanSlideshowItems(stops, transits, locale)`: flattens every timed `PlannedAttraction` across all stops plus every `TransitLeg` segment into a single chronologically-sorted `SlideshowItem[]` (unparseable/missing times sort last). Resolves name/icon/image via `getAttractions()`/`findCuratedAttraction()`, computing end time from `estimatedMinutes` when no explicit `endTime` exists, and `description` via `localizedDescription(attraction, locale)` (null for transit segments and unmatched attractions). Feeds `DayTimelineComponent`'s whole-trip slideshow button — its per-day slideshow (`daySlideItems`) duplicates the same attraction-mapping inline rather than calling this function, so it resolves `description` the same way independently (2026-08-20, see `docs/superpowers/plans/2026-08-20-fix-otp-lightbox-profile-email-bugs.md`). All three call sites (`DayTimelineComponent`, `AiPlanningComponent`, `SharedTripComponent`) inject `LocaleService` and pass `locale.current()`.

### shared/time-picker

- `shared/time-picker/time-picker.component.ts` — `TimePickerComponent` (`app-time-picker`): implements the flatpickr blur/commit-timing workaround documented in "`TimePickerComponent` — flatpickr only commits on blur/Enter/arrows" above — `ngAfterViewInit` attaches raw `input` listeners directly to `this.fp.hourElement`/`minuteElement` alongside flatpickr's own `onChange`, emitting `timeChange` on every keystroke once both fields parse as numbers. Reuses the same custom viewport-clamped `position` function pattern as `DateRangeComponent`.

### shared/toast

- `shared/toast/toast.component.ts` — `ToastComponent` (`app-toast`): single-purpose confirmation toast (`✓ {{message}}`), `message` input required, auto-emits `done` after a fixed 2400ms. Rendered by `ShellComponent`, driven by `ToastService`.

### shared/touch-drag-ghost

- `shared/touch-drag-ghost/touch-drag-ghost.component.ts` — `TouchDragGhostComponent` (`app-touch-drag-ghost`): purely presentational fixed-position pill rendering `TouchDragGhostService.ghost()` — see "Day-timeline drag-and-drop" above for the full mechanism. Mounted once at root in `ShellComponent`.
