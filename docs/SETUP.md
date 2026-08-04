# Setup Guide

Since this is a client-side only Vanilla JS application, setup is incredibly simple.

## Local Development

1. **Clone/Download the repository**:
   Navigate into the project directory (`/expense-tracker`).

2. **Serve the files**:
   Because the application uses ES6 modules (`import`/`export`) and Service Workers, it must be served over `http://` or `https://` protocols, not `file://`.

   You can use any simple local web server. For example:

   **Using Python (3.x):**
   ```bash
   python3 -m http.server 8000
   ```

   **Using Node.js (http-server):**
   ```bash
   npx http-server -p 8000
   ```

   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:8000` in your web browser.

## First Run
On the very first launch, the app will:
1. Initialize the IndexedDB database.
2. Create default categories.
3. Inject a few sample transactions so the dashboard isn't completely empty. (You can delete these via Settings > Reset App or by deleting them individually).
