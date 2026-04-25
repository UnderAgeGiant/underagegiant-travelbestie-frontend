# TravelingBestie — Frontend

Angular 18 standalone SPA for planning multi-destination trips. Users build an itinerary, explore curated attractions per city, and leave comments on every stop. Connects to the [travelbestie-manager](https://github.com/UnderAgeGiant/underagegiant-travelbestie-manager) REST API via JWT auth.

## Tech stack

- Angular 18 · standalone components · Signal-based state
- `@angular/localize` for i18n (es-CL default, en-US supported)
- Angular HttpClient + JWT interceptor
- Deployed on Vercel (static output)

## Development server

```bash
ng serve                        # Spanish — http://localhost:4200 (default)
ng serve --configuration=en-US  # English — http://localhost:4200
```

The app reloads automatically on file changes.

## i18n — locales

| Locale | Language | Command |
|--------|----------|---------|
| `es-CL` | Spanish (Chile) — **default** | `ng serve` |
| `en-US` | English (US) | `ng serve --configuration=en-US` |

Translatable strings are marked with `i18n="@@id"` in templates and `$localize` in TypeScript. English translations live in `src/locale/messages.en-US.xlf`.

After adding new strings to a template, regenerate the source file:

```bash
ng extract-i18n --output-path src/locale
```

Then add the corresponding `<trans-unit>` entries to `src/locale/messages.en-US.xlf`.

Date format for es-CL is `dd/MM/yyyy` (e.g. `25/04/2026`).

## Build

```bash
ng build --configuration=es-CL  # Spanish production build → dist/
ng build --configuration=en-US  # English production build → dist/
```

## Tests

```bash
ng test      # Karma unit tests
npx jest     # Jest unit tests
```

## Code scaffolding

```bash
ng generate component features/<name>/<name>
ng generate service core/<name>/<name>
```

## Project structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # City, Trip, Comment interfaces
│   │   ├── auth/            # AuthService, AuthInterceptor, AuthGuard
│   │   └── api/             # ApiService (real + mock)
│   ├── data/
│   │   ├── cities.data.ts   # 120+ world cities
│   │   └── attractions.data.ts
│   ├── shared/              # Toast, BackgroundSlider, CityCombobox
│   ├── features/
│   │   ├── nav/
│   │   ├── welcome/
│   │   ├── trip/            # StopList, AddStopModal, TripService
│   │   └── destination/     # DestinationView, AttractionCard, CommentModal
│   ├── app.component.ts
│   ├── app.config.ts        # Locale registration (es-CL, en-US)
│   └── app.routes.ts
└── locale/
    └── messages.en-US.xlf   # English translations
```
