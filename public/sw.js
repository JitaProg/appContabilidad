/* Service worker de Tiquet.
 * Estrategia:
 *  - Navegaciones: red primero, con la página cacheada como respaldo offline.
 *  - Estáticos de Next e iconos: caché primero.
 *  - Resto de recursos propios: stale-while-revalidate.
 */

const VERSION = "tiquet-v3";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_ROUTES = [
  "/",
  "/receipts",
  "/receipts/new",
  "/stats",
  "/settings",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const PRECACHE_URLS = [...SHELL_ROUTES];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      // addAll falla por completo si un recurso falla; los añadimos uno a uno.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await shell.add(new Request(url, { cache: "reload" }));
          } catch (error) {
            console.warn("[sw] no se pudo precachear", url, error);
          }
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("tiquet-") && !key.startsWith(VERSION))
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Payloads RSC de Next (rutas con prerender parcial): red primero y caché
  // como respaldo para que el detalle de un ticket funcione sin conexión.
  if (url.searchParams.has("_rsc")) {
    event.respondWith(networkFirstRsc(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname === "/manifest.webmanifest") {
      event.respondWith(cacheFirst(request, SHELL_CACHE));
      return;
    }

    if (
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/")
    ) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      return;
    }

    if (/\.(?:css|js|png|jpe?g|webp|svg|woff2?)$/.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
      return;
    }
  }
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const fallback = await cache.match("/");
    if (fallback) return fallback;

    return new Response(
      "<!doctype html><html lang='es'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Tiquet</title><body style='font-family:system-ui;padding:2rem;text-align:center;color:#12211d;background:#f5f4ef'><h1>Tiquet</h1><p>No hay conexión y esta página aún no está guardada.</p><p>Abre la app una vez con conexión para poder usarla sin internet.</p></body></html>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

async function networkFirstRsc(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    return new Response("", {
      status: 200,
      headers: { "Content-Type": "text/x-component; charset=utf-8" },
    });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached ?? (await network) ?? Response.error();
}
