const CACHE_NAME = 'expense-tracker-v7';

const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  
  // CSS
  'css/base.css',
  'css/theme.css',
  'css/layout.css',
  'css/components.css',
  'css/responsive.css',
  
  // JS Core
  'js/app.js',
  'js/router.js',
  'js/seed.js',
  'js/utils/constants.js',
  'js/utils/helpers.js',
  'js/utils/formatter.js',
  'js/utils/storage.js',
  'js/utils/chart.js',
  
  // JS DB
  'js/db/database.js',
  'js/db/models.js',
  'js/db/repositories.js',
  
  // JS Services
  'js/services/transactionService.js',
  'js/services/categoryService.js',
  'js/services/reportService.js',
  'js/services/settingsService.js',
  
  // JS UI
  'js/ui/dashboard.js',
  'js/ui/transactions.js',
  'js/ui/categories.js',
  'js/ui/reports.js',
  'js/ui/settings.js',
  
  // JS Components
  'js/components/navbar.js',
  'js/components/fab.js',
  'js/components/cards.js',
  'js/components/modal.js',
  'js/components/toast.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      // Use addAll for known reliable assets. 
      // For a real production app, we might want to handle failures per-file gracefully,
      // but this is standard boilerplate.
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Some assets failed to cache on install, moving on.', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response and cache it dynamically
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If offline and not in cache, and it's a navigation request, return index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
