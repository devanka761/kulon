import { futor, kel } from "../lib/kel"
import socket from "../lib/Socket"
import { IAny } from "../types/LibTypes"
import { IMapList } from "../types/MapsTypes"
import chat from "./Chat"
import setNewGame from "./setNewGame"

export default function startGame(data: IAny, nextMap: IMapList, isFirst: boolean = false): void {
  socket.updateData(data)
  chat.run()
  const canvas = kel("canvas", "game-canvas", { id: "game-canvas" })
  const container = futor(".app")
  container.prepend(canvas)
  setNewGame(nextMap, null, isFirst)
}
