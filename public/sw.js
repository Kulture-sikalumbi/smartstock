// Minimal Service Worker for Smart Stock IMS.
// Precaches core assets on install. The HTML document and manifest.json
// are served network-first (see fetch handler below) so metadata like iOS
// splash screen tags always stay fresh; other static assets are served
// cache-first, falling back to the network, so the app shell stays usable
// offline. Bump this version string on every deploy that changes cached
// assets so old caches get cleared and clients pick up the new build
// automatically.
const CACHE_NAME = "smart-stock-static-v3";

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Network-first for the HTML document itself (and manifest.json): these
// must always reflect the latest deploy -- e.g. the <link
// rel="apple-touch-startup-image"> tags iOS reads from the document's
// <head> to pick a launch splash screen. Serving a stale cached document
// here means iOS silently falls back to a blank/dark launch screen even
// after the splash assets and metadata have shipped. Static, content-hashed
// assets (JS/CSS/images/fonts) are safe to serve cache-first since their
// filenames change on every build.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigation =
    request.mode === "navigate" || request.destination === "document";
  const isManifest = url.pathname === "/manifest.json";

  if (isNavigation || isManifest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  const isStaticAsset =
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font";

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      });
    })
  );
});
