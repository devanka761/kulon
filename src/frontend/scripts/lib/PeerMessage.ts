import cloud_items from "../../../../public/json/items/cloud_items.json"
import db from "../data/db"
import chat from "../manager/Chat"
import peers from "../data/Peers"
import { Person } from "../main/Person"
import SaveList from "../data/SaveList"
import LocalList from "../data/LocalList"
import { Game } from "../main/Game"
import { ISival } from "../types/lib.types"
import Prologue from "../Events/Prologue"
import Phone from "../Events/Phone"
import MapList from "../data/MapList"
import notip from "./notip"
import { paperAdd } from "../data/notes"

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class PeerMessage {
  private game!: Game
  chatMessage(data: ISival): void {
    chat.add(data.from, data.text)
  }
  prologueSkip(data: ISival): void {
    if (db.pmc?.id === "prologue") {
      const pmc = db.pmc as Prologue
      pmc.updateSkipped(data.from)
      return
    }

    db.waiting.add({ id: "prologueskip", userId: data.from })
  }

  addStates(data: ISival): void {
    if (!data.states) return
    if (!Array.isArray(data.states)) return

    data.states.forEach((state: string) => (SaveList[state] = true))

    if (data.text) {
      chat.add(data.from, data.text[LocalList.lang!], true)
    }
  }
  removeStates(data: ISival): void {
    if (!data.states) return
    if (!Array.isArray(data.states)) return

    data.states.forEach((state: string) => delete SaveList[state])
  }

  requestPosition(data: ISival): void {
    peers.sendOne(data.from, "playerMapChange", {
      mapId: this.game.map.mapId,
      x: this.game.player.x,
      y: this.game.player.y,
      direction: this.game.player.direction
    })
  }

  playerMove(data: ISival): void {
    const remotePlayer = this.game.map.gameObjects[`crew_${data.from}`] as Person
    const peerData = peers.get(data.from)

    if (peerData) {
      peerData.setX(data.x)
      peerData.setY(data.y)
      peerData.setDirection(data.direction)
      peerData.setMapId(data.mapId)
    }

    if (!remotePlayer) return

    if (data.mapId === this.game.map.mapId) {
      remotePlayer.targetX = data.x
      remotePlayer.targetY = data.y
      remotePlayer.direction = data.direction
      // remotePlayer.isMoving = data.isMoving
    } else {
      remotePlayer.targetX = -1000
      remotePlayer.targetY = -1000
      remotePlayer.direction = data.direction
      // remotePlayer.isMoving = data.isMoving
    }
  }

  playerMapChange(data: ISival): void {
    if (db.pmc?.id === "phone") {
      const pmc = db.pmc as Phone
      pmc.updateScoreBoard(data.from, data.mapId)
    }

    const remotePlayerObject = this.game.map.gameObjects[`crew_${data.from}`] as Person
    const peerData = peers.get(data.from)

    if (peerData) {
      peerData.setX(data.x)
      peerData.setY(data.y)
      peerData.setDirection(data.direction)
      peerData.setMapId(data.mapId)
    }

    if (data.mapId === this.game.map.mapId) {
      if (!remotePlayerObject) {
        const peer = db.job.getUser(data.from)
        if (peer) {
          const newPeerObject = new Person({
            type: "Person",
            x: data.x,
            y: data.y,
            direction: data.direction,
            src: Object.values(peer.skin),
            isRemote: true
          })
          this.game.map.gameObjects[`crew_${peer.id}`] = newPeerObject
          newPeerObject.targetX = data.x
          newPeerObject.targetY = data.y
        }
      } else {
        remotePlayerObject.x = data.x
        remotePlayerObject.y = data.y
        remotePlayerObject.direction = data.direction
        remotePlayerObject.targetX = data.x
        remotePlayerObject.targetY = data.y
        remotePlayerObject.isMoving = false
      }
    } else if (remotePlayerObject) {
      remotePlayerObject.x = -1000
      remotePlayerObject.y = -1000
      remotePlayerObject.targetX = -1000
      remotePlayerObject.targetY = -1000
      remotePlayerObject.direction = data.direction
    }
  }
  addNote(data: ISival): void {
    if (!data || !data.paperId) return

    const map = Object.values(MapList).find((world) => world.configObjects[data.paperId])
    if (!map) return

    const gameObj = map.configObjects[data.paperId]

    const talk = gameObj.talk
    if (!talk) return

    const scenario = talk.find((scenario) => scenario.events.length >= 1)
    if (!scenario) return

    const evt = scenario.events.find((evt) => evt.type === "addnote")
    if (!evt) return

    const { pages, id, text } = evt
    if (!id || !pages || !text) return

    const item = cloud_items.find((itm) => itm.id === "J00006")
    if (!item) return

    paperAdd(id, pages, text)

    db.job.setItem({ id, amount: 1, itemId: "J00006" })

    notip({
      ic: "backpack",
      a: text[LocalList.lang!],
      b: `+${1}`
    })
  }
  onInteract(data: ISival): void {
    if (!data.posX || !data.posY) return
    if (db.pmx && db.pmx.onInteract) {
      db.pmx.onInteract(data.posX, data.posY, true, data)
    }
  }
  run(data: ISival): void {
    if (!this.game || !data.type || !data.from) return
    if (INVALID_CONTROLS.find((control) => control === data.type)) return

    const type = data.type as keyof PeerMessage

    if (this[type]) {
      this[type](data)
    }
  }
  init(game: Game) {
    this.game = game
  }
}

const peerMessage = new PeerMessage()
export default peerMessage
