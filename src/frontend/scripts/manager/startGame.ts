import { futor, kel } from "../lib/kel"
import socket from "../lib/Socket"
import { ISival } from "../types/lib.types"
import { IMapList } from "../types/maps.types"
import chat from "./Chat"
import setNewGame from "./setNewGame"

export default function startGame(data: ISival, nextMap: IMapList, isFirst: boolean = false): void {
  socket.updateData(data)
  chat.run()
  const canvas = kel("canvas", "game-canvas", { id: "game-canvas" })
  const container = futor(".app")
  container.prepend(canvas)
  setNewGame(nextMap, null, isFirst)
}
