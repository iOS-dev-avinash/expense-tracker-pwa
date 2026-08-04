# Architecture

The application strictly adheres to an MVC-like modular approach using ES6 Modules, designed to be scalable, future-ready, and maintainable.

## Directory Layout

```
expense-tracker/
├── index.html          # Main App Shell
├── manifest.json       # PWA Configuration
├── sw.js               # Service Worker
├── css/
│   ├── base.css        # Resets, variables, base tags
│   ├── theme.css       # Light/Dark mode tokens, colors
│   ├── layout.css      # Grid, flex utilities, page structures
│   ├── components.css  # Buttons, cards, inputs, dialogs
│   └── responsive.css  # Media queries, mobile optimizations
├── js/
│   ├── app.js          # App entry point, initialization
│   ├── router.js       # Hash-based SPA routing
│   ├── seed.js         # Initial mock data seeder
│   ├── utils/          # Pure functions, constants
│   ├── db/             # IndexedDB wrapper and repositories
│   ├── services/       # Business logic (Transactions, Categories, Reports)
│   ├── ui/             # Page controllers (Dashboard, Transactions, etc.)
│   └── components/     # Reusable UI renderers (Cards, Modals, Toasts)
├── icons/              # General SVG assets
├── favicon/            # PWA icons
└── docs/               # Documentation
```

## Layers
1. **DB Layer (`/js/db/`)**: Handles raw IndexedDB operations. Models define data structure and validation. Repositories handle CRUD for specific stores.
2. **Service Layer (`/js/services/`)**: The "Brain". Handles calculations, data aggregation for charts, and enforces business rules. Calls the repositories.
3. **UI Layer (`/js/ui/`)**: The "Controllers". Listens to user interactions, fetches data from services, and updates the DOM.
4. **Components Layer (`/js/components/`)**: Pure UI rendering functions and DOM manipulators (like modals and toasts) used across multiple UI controllers.
