const STATIC_CACHE = "freeclouds-static-v3";
const IS_DEV = ["localhost", "127.0.0.1", "::1"].includes(self.location.hostname);

const PRECACHE_URLS = ["/", "/manifest.json", "/logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (IS_DEV) return;

  const url = new URL(request.url);

  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Cache-first ONLY for immutable hashed build assets. Everything else must
  // hit the network so Refresh actually reloads data.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Never intercept API, share links, uploads, or optimized images — caching
  // these served stale file/folder lists forever on refresh.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/s/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/_next/image")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/").then((cached) => cached || Response.error()),
      ),
    );
    return;
  }

  // Other same-origin GETs (manifest, logo, sw.js refresh): network-first,
  // fall back to cache only when offline.
  event.respondWith(
    fetch(request).catch(() =>
      caches.match(request).then((cached) => cached || Response.error()),
    ),
  );
});