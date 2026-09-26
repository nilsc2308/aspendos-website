// Service Worker der Aspendos-App (PWA). Wird von _build.py aus _sw-vorlage.js erzeugt –
// nicht direkt bearbeiten. VERSION ändert sich bei jeder inhaltlichen Änderung der Seite,
// dadurch holen sich installierte Apps automatisch den neuen Stand.
const VERSION = "80ad47db00";
const CACHE = "aspendos-" + VERSION;
const FILES = [
  "/",
  "/speisekarte/",
  "/kegelbahn/",
  "/ueber-uns/",
  "/kontakt/",
  "/impressum/",
  "/datenschutz/",
  "/css/styles.css",
  "/fonts/Inter-latin-1.woff2",
  "/fonts/Inter-latin-ext-0.woff2",
  "/fonts/PlayfairDisplay-latin-3.woff2",
  "/fonts/PlayfairDisplay-latin-ext-2.woff2",
  "/fonts/fonts.css",
  "/img/interior.jpg",
  "/img/kegelbahn.jpg",
  "/img/parkplatz.jpg",
  "/img/terrasse.jpg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  "/main.js",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/favicon.ico",
  "/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("aspendos-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return; // Google Maps u. Ä. unberührt

  if (req.mode === "navigate") {
    // Seiten: erst Netz (immer aktuell), ohne Netz die gespeicherte Fassung
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req, { ignoreSearch: true })
            .then((hit) => hit || caches.match(url.pathname.endsWith("/") ? url.pathname : url.pathname + "/"))
            .then((hit) => hit || caches.match("/"))
        )
    );
    return;
  }

  // Bilder, Schriften, CSS, JS: aus dem Speicher, sonst Netz
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
    )
  );
});
