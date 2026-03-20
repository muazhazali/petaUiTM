const CACHE_NAME = "peta-uitm-v1";

const PRECACHE_URLS = [
  "/",
];

// Install: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: claim clients and remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isDataRequest(url) {
  return url.pathname.startsWith("/data/") && url.pathname.endsWith(".json");
}

function isStaticAsset(url) {
  return (
    /\.(js|css|woff2?|ttf|otf|eot)$/.test(url.pathname) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/_next/static/")
  );
}

// Fetch: cache-first for static assets, network-first for data JSON
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin and tile/OSRM requests can bypass
  if (url.origin !== self.location.origin) {
    return;
  }

  if (isDataRequest(url)) {
    // Network-first for data JSON files
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
      )
    );
  } else {
    // Network-first for HTML pages
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
