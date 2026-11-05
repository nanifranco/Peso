// Service worker sencillo: red primero, caché como respaldo (funciona sin internet).
// Solo guarda archivos de la app; tus registros viven en localStorage y nunca se tocan aquí.
const CACHE = 'peso-v2'
self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  // La página (index.html) siempre se pide fresca para no quedarse en una versión vieja
  const fresh = e.request.mode === 'navigate'
  e.respondWith(
    fetch(e.request, fresh ? { cache: 'no-store' } : undefined)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(e.request, copy))
        return res
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./')))
  )
})
