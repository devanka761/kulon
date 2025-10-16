const initialWorld = {
  maps: null,
  assets: null
}
export function setOfflineMaps(maps) {
  initialWorld.maps = maps
}
export function getOfflineMaps() {
  return initialWorld.maps
}
export function setOfflineAssets(assets) {
  initialWorld.assets = assets
}
export function getOfflineAssets() {
  return initialWorld.assets
}
