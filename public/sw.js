/* Minimal service worker — installability only.
 * Always prefer the network so schedule data stays fresh when online.
 * No offline editing cache.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Never intercept API or auth — always hit the network.
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-only so the board/admin always get fresh HTML.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response("Homeboard needs a network connection.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          }),
      ),
    );
  }
});
