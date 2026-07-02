/*
 * RoadTrip Trivia — app-shell service worker (Phase 5b).
 *
 * Hand-written (no Serwist/webpack) so it works alongside Next's Turbopack
 * build. Precaches the shell and runtime-caches static chunks so the app boots
 * offline; saved/completed quizzes then read from IndexedDB (see src/lib/db).
 *
 * Strategies:
 *   - navigations  → network-first, fall back to cached page (or "/")
 *   - /_next/static & assets → cache-first (content-hashed, immutable)
 *   - other GETs   → stale-while-revalidate
 */

const VERSION = "v1";
const CACHE = `rtt-shell-${VERSION}`;
const PRECACHE = ["/", "/explore", "/saved", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // skip Supabase & other origins

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          cachePut(req, res.clone());
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/"))),
    );
    return;
  }

  const isAsset =
    url.pathname.startsWith("/_next/static") ||
    /\.(?:css|js|woff2?|png|svg|ico|jpe?g|webp)$/.test(url.pathname);

  if (isAsset) {
    event.respondWith(
      caches.match(req).then(
        (c) =>
          c ||
          fetch(req).then((res) => {
            cachePut(req, res.clone());
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          cachePut(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

function cachePut(req, res) {
  if (!res || res.status !== 200 || res.type === "opaque") return;
  caches
    .open(CACHE)
    .then((c) => c.put(req, res))
    .catch(() => {});
}
