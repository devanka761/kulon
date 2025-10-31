import MapList from "../data/MapList"
import { futor } from "../lib/kel"
import { Game } from "../main/Game"
import { IMapList, ISpawnRule } from "../types/maps.types"
import SetNextMap from "./SetNextMap"
import localSave from "./storage"

export default async function setNewGame(nextMap: IMapList, gameInstance: Game | null = null, isfirst: boolean = false, spawnRule: ISpawnRule | null = null): Promise<Game> {
  gameInstance?.destroy()

  SetNextMap(nextMap, spawnRule)

  const firstMapId = isfirst ? "kulonSafeHouse" : Object.keys(MapList)[0]
  localSave.mapId = firstMapId

  const canvasSize = spawnRule?.size || 344

  const canvas = futor("#game-canvas") as HTMLCanvasElement
  const game = new Game(canvas, canvasSize)
  await game.init()
  return game
}
