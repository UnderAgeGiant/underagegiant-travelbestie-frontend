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
| `TripService` | In-memory trip state (stops, transits, active stop). Auto-saves to localStorage on every mutation via an `effect()`. Sorts stops by check-in date automatically. |
| `SavedPlansService` | Named saved trips per user stored in `localStorage` under `tb_saved_plans_<email>`. |
| `AuthService` | JWT token + current user stored in `localStorage`. Exposes `isLoggedIn` computed signal. |
| `AuthModalService` | Controls login modal visibility; supports a post-login callback pattern. |
| `KarmaService` | Per-user karma score, loaded from API/mock on login. |
| `VisitedPlacesService` | Map pins for visited places stored in `localStorage` per user. |

### Mock vs real API

`environment.useMocks` (default: `true` in dev) gates every HTTP call in `ApiService`. When `true`, all operations return hardcoded or localStorage-backed data — no backend needed. Set to `false` in `environment.production.ts`.

### Component tree

```
AppComponent
├── NavComponent            — auth modal trigger, profile button
├── StopListComponent       — left panel: trip stops + transit connectors
│   ├── TransitConnectorComponent  — between stops, and departure/arrival edges
│   └── DateRangeComponent  — flatpickr wrapper, emits dd/mm/yyyy strings
├── DestinationComponent    — right panel: attraction grid for active stop
│   ├── AttractionCardComponent
│   ├── AttractionDetailModalComponent
│   ├── CommentModalComponent
│   └── PlanTimeModalComponent
├── AddStopModalComponent   — city search + date picker
├── WelcomeComponent        — shown when no stops exist
├── ProfileComponent        — saved plans + visited places map
└── ToastComponent
```

### Transit legs

Transit data is stored as `TransitLeg[]` in `TripService._transits`. The key pattern is `fromCityId|toCityId`.

- Between two stops: key is `cityA|cityB`
- **Departure flight** (before first stop): key is `__start__|__start__`
- **Return flight** (after last stop): key is `__end__|__end__`

`TransitConnectorComponent` accepts `type` (`'default' | 'departure' | 'arrival'`) and `cityLabel` inputs to visually distinguish edge connectors from between-stop connectors.

### Date format

Dates throughout the app are `dd/mm/yyyy` strings (not `Date` objects or ISO strings). `TripService` parses these when sorting stops by check-in date. `DateRangeComponent` (flatpickr wrapper) always emits in this format.

### Data files

- `src/app/data/cities.data.ts` — `WORLD_CITIES`: 120+ cities with `id`, `name`, `country`, `flag`, `region`
- `src/app/data/attractions.data.ts` — `getAttractions(city)`: returns curated attractions for major cities or region-based templates otherwise

### CSS

All design tokens (colors, shadows, layout) are CSS custom properties in `src/styles.css` using `oklch()`. The prototype `TravelingBestie.html` at the repo root is the UI/UX reference. Transit connector styles (`.transit-*`) are global in `src/styles.css` since the component has no local `styles` array.

### i18n

Source locale is `es-CL` (all templates written in Spanish). After adding new `i18n="@@id"` or `i18n-<attr>="@@id"` attributes, run `ng extract-i18n` to regenerate `messages.xlf`, then add the matching `<trans-unit>` to `src/locale/messages.en-US.xlf`. TypeScript strings use `` $localize`...` ``.

## Git workflow

Work on `claude-dev` branch. Every task ends with a commit and PR opened against `main` using:
```bash
gh pr create --base main --head claude-dev --title "feat(<scope>): <what>"
```
