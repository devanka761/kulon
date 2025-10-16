import MapList from "../data/MapList"
import { qutor } from "../lib/kel"
import { Game } from "../main/Game"
import SetNextMap from "./SetNextMap"
import localSave from "./storage"

export default async function setNewGame(nextMap, gameInstance = null, isfirst = false, spawnRule = null) {
  gameInstance?.destroy()

  SetNextMap(nextMap, spawnRule)

  const firstMapId = isfirst ? "kulonSafeHouse" : Object.keys(MapList)[0]
  localSave.mapId = firstMapId

  const canvas = qutor("#game-canvas")
  const game = new Game(canvas, 328)
  await game.init()
  return game
}
