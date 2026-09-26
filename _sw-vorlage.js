// Service Worker der Aspendos-App (PWA). Wird von _build.py aus _sw-vorlage.js erzeugt –
// nicht direkt bearbeiten. VERSION ändert sich bei jeder inhaltlichen Änderung der Seite,
// dadurch holen sich installierte Apps automatisch den neuen Stand.
const VERSION = "__VERSION__";
const CACHE = "aspendos-" + VERSION;
const FILES = __FILES__;

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
