import { IAssetSkins } from "../types/lib.types"
import { IMapList } from "../types/maps.types"

interface InitialWorld {
  maps: IMapList | null
  assets: IAssetSkins[] | null
}

const initialWorld: InitialWorld = {
  maps: null,
  assets: null
}

export function setOfflineMaps(maps: IMapList): void {
  initialWorld.maps = maps
}

export function getOfflineMaps(): IMapList {
  return initialWorld.maps!
}

export function setOfflineAssets(assets: IAssetSkins[]): void {
  initialWorld.assets = assets
}

export function getOfflineAssets(): IAssetSkins[] {
  return initialWorld.assets!
}
