/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="webworker" />
import dvnkz_v from "../../config/version.json"
import dvnkz_b from "../../../public/json/build/buildNumber.json"

const DVNKZ_CACHE_NAME = `kulon-cache-${dvnkz_v.version}-${dvnkz_b.buildNumber}`
const DVNKZ_ASSET_BL = ["json", "Kulon_Hero", "outdoor_amb"]
const DVNKZ_ASSET_WL = ["/audio/", "/assets/characters/", "/assets/maps/mp_ehek/", "/assets/maps/props/", "/assets/items/", "/assets/minigames/", "/assets/unlisted/jumpscare/"]

self.addEventListener("install", (event) => {
  const cacheWhitelist = DVNKZ_CACHE_NAME
  // @ts-expect-error no default types
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist !== cacheName) {
            return caches.delete(cacheName)
          }
          return Promise.resolve()
        })
      )
    })
  )
  // @ts-expect-error no default types
  event.waitUntil(
    caches
      .open(DVNKZ_CACHE_NAME)
      .then(async (cache) => {
        const cacheDynamicAssets = async (jsonUrl: string, type: string, pathKey: string) => {
          const response = await cache.match(jsonUrl)
          if (response) {
            const items = await response.json()
            const filesToCache = items
              .map((item: any) => item[pathKey])
              .filter((url: string) => {
                const isBlackListed = DVNKZ_ASSET_BL.some((keyword) => url.includes(keyword))
                const isWhiteListed = DVNKZ_ASSET_WL.some((keyword) => url.includes(keyword))
                return !isBlackListed && isWhiteListed
              })

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
  const cacheWhitelist = DVNKZ_CACHE_NAME
  // @ts-expect-error no default types
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist !== cacheName) {
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

  const isBlackListed = DVNKZ_ASSET_BL.some((keyword) => src.includes(keyword))
  const isWhiteListed = DVNKZ_ASSET_WL.some((keyword) => src.includes(keyword))

  const isAssetRequest = !isBlackListed && isWhiteListed

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
          return caches.open(DVNKZ_CACHE_NAME).then((cache) => {
            // @ts-expect-error no default types
            cache.put(event.request, networkResponse.clone())
            return networkResponse
          })
        })
      })
    )
  }
})
