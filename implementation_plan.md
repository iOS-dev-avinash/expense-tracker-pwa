# Expense Tracker PWA - Implementation Plan

## Architecture Overview
- **App Shell**: index.html loads once, SW caches everything
- **Router**: Hash-based SPA router (no server needed)
- **Storage**: IndexedDB via database.js + repositories.js
- **State**: Simple reactive store pattern
- **Charts**: Locally bundled Chart.js (downloaded or vendored)

## File Generation Order
1. CSS files (base, theme, layout, components, responsive)
2. Utils (constants, helpers, formatter, storage)
3. DB layer (database, repositories, models)
4. Services (transaction, category, report, settings)
5. UI components (modal, toast, fab, navbar, cards)
6. UI views (dashboard, transactions, reports, categories, settings)
7. Core (router, app, seed)
8. PWA (manifest, sw, icons)
9. Docs
