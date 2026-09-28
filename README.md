# Japanese Architecture Map (日本の建築マップ)

A browser-based map and database of architectural works in Japan, built with React/TypeScript and deployed as a static site on GitHub Pages.

日本の建築作品を地図と一覧で探せるWebアプリ（開発は2025年7月で停止しており、未完成の部分があります）。

## Status

**Unfinished prototype — development stopped in July 2025.** The building list, map and detail pages were deployed and work from pre-generated static JSON, but the architect pages, several filters and the CI pipeline were still being debugged when work stopped. It is not actively maintained.

✅ **Works (in the code / last deployment)**
- Building list, search and detail pages, backed by static JSON (`public/data/page_*.json`, 50 items per page)
- Map view with marker clustering (Leaflet)
- Dataset: **14,467 buildings**; almost all have coordinates, architect and year; about 2,400 have a text description and fewer than 300 have an image URL
- Japanese / English UI strings (i18next, `src/locales/ja|en`)
- GitHub Pages deployment via `.github/workflows/deploy-simple.yml` (the last deployment, on 2025-07-16, succeeded)

🚧 **Partial**
- Architect list and architect detail pages query an in-browser SQLite database (sql.js + chunked HTTP loading). The last commits (July 14–16, 2025) were still fixing this loading path, so these pages may not work reliably
- Research and Analytics pages: precomputed analytics JSON exists, but these pages were not reviewed or tested much
- Several alternative services and page variants (e.g. `Enhanced…`, `Optimized…`, `Simple…`) are still in the tree. It is not always clear which one is live

📝 **Not implemented**
- Architect filters by nationality, category and school (`SmartArchitectService.ts` logs "not implemented yet")
- Most buildings have no photos or descriptions

⚠️ **Known issues**
- Scheduled CI and E2E workflows on GitHub Actions fail on every recorded run (last run September 2025)
- Minification is disabled in the build to work around a runtime error (`'ge is not a function'`)
- Some service workers are registered at root paths (`/mobile-sw.js`, `/sw-performance.js`) that do not match the `/archi-site/` base path
- The repository root holds many generated reports (`*_SUMMARY.md`, `*_REPORT.md`, debug HTML files, logs). They came from AI-agent-assisted development. They describe intended results and are **not** verified documentation of the current state
- Data sources and licensing of the building data are not documented

## Demo

https://bob-takuya.github.io/archi-site/ — last deployed 2025-07-16. How well it works depends on the partial features listed above.

## Background

This started in March 2025 as a personal project: a map of Japanese architecture for architecture students. Most of the development happened in July 2025, with heavy use of AI coding agents (the many report files come from that process). Work stopped after July 2025.

## Development

Requires Node.js 18+.

```bash
npm install          # the deploy workflow uses: npm ci --legacy-peer-deps
npm run dev          # Vite dev server
npm run build        # production build into dist/
npm run prepare-static-db   # regenerate static DB files used for Pages
```

Tests exist (Jest unit tests under `tests/` and `src/**/__tests__`, many Playwright specs under `tests/e2e`), but they were not passing in CI when development stopped.

Main structure:

```
src/
  pages/        HomePage, ArchitecturePage, MapPage, ArchitectsPage, ResearchPage, AnalyticsPage, ...
  components/   UI, map, search, analytics components
  services/     data access (api/FastArchitectureService = static JSON; db/* = SQLite in browser)
  locales/      ja / en strings
public/data/    pre-generated JSON pages, search index, analytics
scripts/        DB preparation and deployment scripts
```

## Related

- [genshi-studio](https://github.com/bob-takuya/genshi-studio) — another project built with the same AI-agent workflow in July 2025
