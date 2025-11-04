/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="webworker" />

const CACHE_NAME = "kulon-assets-cache-v1"
const ASSETS_TO_CACHE = ["/json/audio/audio.json", "/json/skins/skin_list.json"]

self.addEventListener("install", (event) => {
  // @ts-expect-error no default types
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(ASSETS_TO_CACHE)

        const cacheDynamicAssets = async (jsonUrl: string, type: string, pathKey: string) => {
          const response = await cache.match(jsonUrl)
          if (response) {
            const items = await response.json()
            const filesToCache = items.map((item: any) => item[pathKey])

            await Promise.allSettled(filesToCache.map((url: string) => cache.add(url).catch((_e) => {})))
          }
        }

        await cacheDynamicAssets("/json/audio/audio.json", "audio", "path")
        await cacheDynamicAssets("/json/skins/skin_list.json", "skin image", "path")
      })
      // @ts-expect-error no default types
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  // @ts-expect-error no default types
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
          return Promise.resolve()
        })
      )
    })
  )
  // @ts-expect-error no default types
  return self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // @ts-expect-error no default types
  const requestUrl = new URL(event.request.url)
  const src = requestUrl.pathname

  const isAssetRequest = !src.includes("json") && !src.includes("outdoor_amb") && !src.includes("Kulon_Hero") && (src.includes("/audio/") || src.includes("/assets/characters/") || src.includes("/assets/items/cloud/") || src.includes("/assets/minigames/") || src.includes("/assets/unlisted/jumpscare/"))

  if (isAssetRequest) {
    // @ts-expect-error no default types
    event.respondWith(
      // @ts-expect-error no default types
      caches.match(event.request).then((response) => {
        if (response) {
          return response
        }
        // @ts-expect-error no default types
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse
          }
          return caches.open(CACHE_NAME).then((cache) => {
            // @ts-expect-error no default types
            cache.put(event.request, networkResponse.clone())
            return networkResponse
          })
        })
      })
    )
  }
})
