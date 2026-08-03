const CACHE_NAME = 'transafrik-static-v2'
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)

  // Les pages, les API et les bundles Next doivent toujours venir du réseau.
  // Les mettre en cache provoque des écrans périmés et des CSS/JS désynchronisés
  // après un déploiement.
  if (
    requestUrl.origin === self.location.origin &&
    (event.request.mode === 'navigate' ||
      requestUrl.pathname.startsWith('/_next/') ||
      requestUrl.pathname.startsWith('/api/'))
  ) {
    return
  }

  // Pour les quelques ressources statiques de la PWA, le réseau reste prioritaire.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
