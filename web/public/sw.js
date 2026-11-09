/* Viatge · service worker: abre sin conexión y guarda las fotos ya vistas. */
const CACHE = "viatge-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Páginas: primero la red (siempre la última versión); sin conexión, la copia guardada.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((k) => k.put("/", c)); return res; })
        .catch(() => caches.match("/")),
    );
    return;
  }
  // Código, fotos y fuentes: primero la copia guardada.
  const cacheable = url.origin === location.origin || url.hostname === "upload.wikimedia.org" || url.hostname.endsWith("gstatic.com") || url.hostname === "fonts.googleapis.com";
  if (!cacheable || url.pathname === "/manifest.webmanifest") return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok || res.type === "opaque") { const c = res.clone(); caches.open(CACHE).then((k) => k.put(req, c)); }
      return res;
    })),
  );
});
