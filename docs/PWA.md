# Progressive Web App (PWA) Features

This application is built as a PWA, meaning it acts like a native mobile application while being delivered via the web.

## Offline Support
The `sw.js` (Service Worker) caches all necessary HTML, CSS, JS, and image assets during the initial load. 
If the user loses internet connection, the Service Worker intercepts network requests and serves the files directly from the local cache.
Since data is stored via IndexedDB locally, the app functions with 100% feature parity while completely offline.

## Installability
The `manifest.json` provides the browser with instructions on how to install the app.
- **Android/Chrome**: Prompts the user with an "Add to Home Screen" banner.
- **iOS/Safari**: Users must tap the Share button and select "Add to Home Screen".

Once installed, the app launches without a browser URL bar and runs in standalone mode.

## App Shell Architecture
The core structure (`index.html` + `css` + JS shell) loads instantly, presenting a loading skeleton, while the asynchronous data fetch (IndexedDB querying) happens in the background. This guarantees a fast perceived load time regardless of device performance.
