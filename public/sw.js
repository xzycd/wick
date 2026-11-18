// Wick service worker — makes the app installable and fully offline.
//
// Strategy, by request type (all same-origin; the app has no backend):
//   • /assets/*  → cache-first. Vite content-hashes these, so a given URL is
//                  immutable; once cached it never needs the network again.
//   • navigations → network-first for freshness, falling back to the cached
//                   app shell when offline.
//   • everything else (icons, manifest) → stale-while-revalidate.
// The shell is precached on install so a cold offline launch still renders.

const CACHE = 'wick-v2'
const SHELL = ['/', '/flame.svg', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(SHELL)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req))
  } else if (req.mode === 'navigate') {
    event.respondWith(networkFirstNav(req))
  } else {
    event.respondWith(staleWhileRevalidate(req))
  }
})

async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) cache.put(req, res.clone())
  return res
}

async function networkFirstNav(req) {
  const cache = await caches.open(CACHE)
  try {
    const fresh = await fetch(req)
    cache.put('/', fresh.clone())
    return fresh
  } catch {
    return (await cache.match(req)) || (await cache.match('/')) || Response.error()
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  const fetching = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => hit)
  return hit || fetching
}
