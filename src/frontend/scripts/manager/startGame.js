import backsong from "../APIs/BackSongAPI"
import { kel, qutor } from "../lib/kel"
import socket from "../lib/Socket"
import chat from "./Chat"
import setNewGame from "./setNewGame"

export default function startGame(data, nextMap) {
  socket.updateData(data)
  chat.run()
  const canvas = kel("canvas", "game-canvas title-screen", { id: "game-canvas" })
  const container = qutor(".app")
  container.prepend(canvas)
  backsong.switch(1)
  backsong.start(1200)
  setNewGame(nextMap, null, true)
}
