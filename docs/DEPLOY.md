# Deployment

Since this app consists entirely of static files (HTML, CSS, JS), it can be hosted on almost any free static hosting provider.

## Vercel / Netlify / Cloudflare Pages / GitHub Pages
Simply connect your repository to any of these services and configure the "publish directory" to the root of the repository (or whichever folder contains `index.html`).

**Note on Routing:**
This application uses hash-based routing (`/#dashboard`, `/#transactions`). This means you **do not** need to configure single-page-app rewrite rules (like redirecting all traffic to `index.html`). The browser handles hash routing natively.

## HTTPS Required
For the Service Worker (PWA offline capabilities) to function, the application **must** be served over HTTPS. All major static hosting providers mentioned above provide free SSL certificates automatically.
