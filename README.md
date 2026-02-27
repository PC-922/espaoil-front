# EspaOil Frontend

React web/PWA app to search nearby gas stations, compare by price or distance, and open directions in your preferred maps app.

## Main features

- Search nearby gas stations using the current location.
- Filter by fuel type and search radius.
- Sort by price or distance.
- Navigation with Google Maps, Apple Maps, or Waze (configurable).
- Local persistence of search state (filters, results, sorting).
- `About` screen with real app version, commit, and build date.

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind (utility classes in components)
- Vitest + Testing Library (unit tests)
- Semantic Release (automated versioning and changelog)

## Requirements

- Node.js 20+
- npm

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Run locally:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Available scripts

- `npm run dev`: start development server.
- `npm run build`: create production build.
- `npm run preview`: preview local production build.
- `npm run test`: run unit tests.
- `npm run test:watch`: run tests in watch mode.
- `npm run test:coverage`: run tests with coverage (global threshold 70%).
- `npm run release`: run automated release with semantic-release.
- `npm run release:dry`: simulate release.

## API and configuration

- Frontend consumes `'/api'` (see `config.ts`).
- In development, Vite proxies requests to `https://espaoil-server.onrender.com`.
- Default parameters:
   - `DEFAULT_SEARCH_RADIUS_KM = 20`
   - `DEFAULT_FUEL_TYPE = GASOLINA_95_E5`

## Testing and coverage

- Framework: Vitest.
- Test environment: `jsdom`.
- Coverage provider: `v8` with `text` + `html` reports.
- Global minimum thresholds: 70% for lines, functions, branches, and statements.

## Versioning and releases

The project uses `semantic-release` with `conventional commits`.

- Release branch: `main`.
- Tag format: `vX.Y.Z`.
- Automatically updates:
   - `package.json`
   - `package-lock.json`
   - `CHANGELOG.md`
- Publishes a GitHub release.

Workflow configured in `.github/workflows/release.yml`:

1. `npm ci`
2. `npm run test`
3. `npm run build`
4. `npm run release`

### Note about local release runs

`npm run release:dry` can fail locally if `GITHUB_TOKEN`/`GH_TOKEN` is missing or no Git remote is configured. In CI (GitHub Actions), `secrets.GITHUB_TOKEN` is used.

## Relevant structure

- `views/`: screens (`Home`, `About`, `Settings`).
- `hooks/`: application logic (`useHomeSearch`).
- `repositories/`: data access (`HttpGasStationRepository`).
- `services/`: compatibility facade and mocks.
- `utils/`: helpers (geo, maps, formatting).
- `components/`: reusable UI.

## Build metadata in the app

Injected at build time:

- `__APP_VERSION__`
- `__APP_COMMIT_SHA__`
- `__APP_BUILD_DATE__`

Shown in the `About` view.
