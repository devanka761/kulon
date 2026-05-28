import db from "../data/db"
import { futor, kel } from "../lib/kel"
import socket from "../lib/Socket"
import { IAny } from "../types/LibTypes"
import { IMapList } from "../types/MapsTypes"
import chat from "./Chat"
import setNewGame from "./setNewGame"

export function startGame(data: IAny, nextMap: IMapList, isFirst: boolean = false, immi?: boolean): void {
  socket.updateData(data, immi)
  chat.run()
  const canvas = kel("canvas", "game-canvas", { id: "game-canvas" })
  const container = futor(".app")
  container.prepend(canvas)

  if (immi) {
    db.me.skin = {
      Bodies: "Body_03",
      Outfits: "Outfit_16_01",
      Hairstyles: "Hairstyle_26_07"
    }
  }

  setNewGame(nextMap, null, isFirst, null, immi)
}
