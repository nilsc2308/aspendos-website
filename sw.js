// Abschalt-Service-Worker: Die App-Version (PWA) wurde am 26.09.2026 auf Wunsch wieder entfernt.
// Browser, die sie schon installiert hatten, holen sich diese Datei, löschen den gespeicherten
// Offline-Speicher, melden sich ab und laden die Seite normal neu. Datei einige Monate liegen lassen.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("aspendos-")).map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});
