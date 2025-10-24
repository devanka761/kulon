const CACHE_NAME = "kulon-audio-cache-v1"
const ASSETS_TO_CACHE = ["/json/audio/audio.json"]

self.addEventListener("install", (event) => {
  // @ts-expect-error no default for typescript
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        console.log("Service Worker: Caching audio assets")
        return cache.addAll(ASSETS_TO_CACHE).then(async () => {
          const response = await cache.match("/json/audio/audio.json")
          if (response) {
            const sounds = await response.json()
            const audioFiles = sounds.map((sound: { path: string }) => sound.path)
            return cache.addAll(audioFiles)
          }
        })
      }) // @ts-expect-error no default for typescript
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  // @ts-expect-error no default for typescript
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Service Worker: Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  ) // @ts-expect-error no default for typescript
  return self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // @ts-expect-error no default for typescript
  if (event.request.url.includes("/audio/") || event.request.url.includes("/json/audio/audio.json")) {
    // @ts-expect-error no default for typescript
    event.respondWith(
      // @ts-expect-error no default for typescript
      caches.match(event.request).then((response) => {
        if (response) {
          return response
        }
        // @ts-expect-error no default for typescript
        return fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            // @ts-expect-error no default for typescript
            cache.put(event.request, networkResponse.clone())
            return networkResponse
          })
        })
      })
    )
  }
})
