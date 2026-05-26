import cloud_items from "../../../../public/json/items/cloud_items.json"
import db from "../data/db"
import chat from "../manager/Chat"
import peers from "../data/Peers"
import { Person } from "../main/Person"
import SaveList from "../data/SaveList"
import LocalList from "../data/LocalList"
import { Game } from "../main/Game"
import { IAny } from "../types/LibTypes"
import Prologue from "../Events/Prologue"
import Phone from "../Events/Phone"
import MapList from "../data/MapList"
import notip from "./notip"
import { paperAdd } from "../data/notes"
import { Interactable } from "../main/Interactable"
import lang from "../data/language"
import { checkHint, setHint } from "../Events/Hint"
import waittime from "./waittime"

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class PeerMessage {
  private game!: Game
  chatMessage(data: IAny): void {
    chat.add(data.from, data.text)
  }
  prologueSkip(data: IAny): void {
    if (db.pmc?.id === "prologue") {
      const pmc = db.pmc as Prologue
      pmc.updateSkipped(data.from)
      return
    }

    db.waiting.add({ id: "prologueskip", userId: data.from })
  }
  prologueTimeOut(data: IAny): void {
    if (db.pmc?.id === "prologue") {
      const pmc = db.pmc as Prologue
      pmc.forceSkipped()
      return
    }

    db.waiting.add({ id: "prologuetimeout", userId: data.from })
  }
  async addStates(data: IAny): Promise<void> {
    if (!data.states) return
    if (!Array.isArray(data.states)) return

    data.states.forEach((state: string) => (SaveList[state] = true))

    if (data.text) {
      chat.add(data.from, data.text[LocalList.lang!], true)
    }

    checkHint(data.states)

    await waittime(1000)
    this.game.kulonUI?.phone.updateUnread()
  }
  removeStates(data: IAny): void {
    if (!data.states) return
    if (!Array.isArray(data.states)) return

    data.states.forEach((state: string) => delete SaveList[state])
  }
  addItem(data: IAny): void {
    const { itemId, amount } = data
    if (!itemId || !amount) return
    const item = cloud_items.find((itm) => itm.id === itemId)
    if (!item) return

    db.job.setItem({ id: itemId, amount })

    notip({
      ic: "backpack",
      a: item.name[LocalList.lang!],
      b: `+${amount}`
    })
  }

  lobbyConfirm(data: IAny): void {
    chat.add(data.from, lang.LB_JOINED, true)
    this.requestPosition(data)
  }

  requestPosition(data: IAny): void {
    peers.sendOne(data.from, "playerMapChange", {
      mapId: this.game.map.mapId,
      x: this.game.player.x,
      y: this.game.player.y,
      direction: this.game.player.direction
    })
  }

  playerMove(data: IAny): void {
    const myMap = this.game.map.mapId

    const remotePlayer = this.game.map.gameObjects[`crew_${data.from}`] as Person
    const peerData = peers.get(data.from)

    if (peerData) {
      peerData.setX(data.x)
      peerData.setY(data.y)
      peerData.setDirection(data.direction)
      peerData.setMapId(data.mapId)
    }

    if (!remotePlayer) return

    if (data.mapId === myMap) {
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

  playerAttack(data: IAny): void {
    const myMap = this.game.map.mapId
    if (data.mapId !== myMap) return

    const remotePlayer = this.game.map.gameObjects[`crew_${data.from}`] as Person

    if (remotePlayer) {
      remotePlayer.x = data.x
      remotePlayer.y = data.y
      remotePlayer.direction = data.direction
      remotePlayer.attack()
    }
  }

  npcMove(data: IAny): void {
    if (data.npcId === "hero") return

    const myMap = this.game.map.mapId

    if (MapList[data.mapId] && MapList[data.mapId].configObjects[data.npcId]) {
      MapList[data.mapId].configObjects[data.npcId].x = data.x / 16
      MapList[data.mapId].configObjects[data.npcId].y = data.y / 16
      MapList[data.mapId].configObjects[data.npcId].direction = data.direction
      MapList[data.mapId].configObjects[data.npcId].health = data.health
      MapList[data.mapId].configObjects[data.npcId].following = data.following
      MapList[data.mapId].configObjects[data.npcId].enemy = data.enemy
    }

    if (data.mapId !== myMap) return

    const npc = this.game.map.gameObjects[data.npcId] as Person
    if (npc) {
      npc.x = data.x
      npc.y = data.y
      npc.direction = data.direction
      npc.targetX = data.targetX
      npc.targetY = data.targetY
      npc.health = data.health
      npc.following = data.following
      npc.enemy = data.enemy
    }
  }

  npcDefeat(data: IAny): void {
    if (data.npcId === "hero") return

    const myMap = this.game.map.mapId

    if (MapList[data.mapId] && MapList[data.mapId].configObjects[data.npcId]) {
      MapList[data.mapId].configObjects[data.npcId].x = -1000
      MapList[data.mapId].configObjects[data.npcId].y = -1000
      MapList[data.mapId].configObjects[data.npcId].direction = "down"
      MapList[data.mapId].configObjects[data.npcId].following = false
      MapList[data.mapId].configObjects[data.npcId].health = undefined
      delete MapList[data.mapId].configObjects[data.npcId].health
    }

    if (data.mapId !== myMap) return

    const npc = this.game.map.gameObjects[data.npcId] as Person
    if (npc) {
      npc.x = -1000
      npc.y = -1000
      npc.targetX = -1000
      npc.targetY = -1000
      npc.direction = "down"
      npc.following = false
      npc.health = undefined
    }
  }

  objMapChange(data: IAny): void {
    const { who, mapId, x, y } = data
    if (!who || !mapId || !x || !y) return

    const propObject = this.game.map.gameObjects[who] as Interactable

    if (mapId === this.game.map.mapId) {
      if (propObject) {
        propObject.x = x * 16
        propObject.y = y * 16
      }
    } else if (MapList[mapId].configObjects[who]) {
      MapList[mapId].configObjects[who].x = x
      MapList[mapId].configObjects[who].y = y
    }
  }

  playerMapChange(data: IAny): void {
    if (db.pmc?.id === "phone") {
      const pmc = db.pmc as Phone
      pmc.updateScoreBoard(data.from, data.mapId)
    }

    const myMap = this.game.map.mapId

    const remotePlayerObject = this.game.map.gameObjects[`crew_${data.from}`] as Person
    const peerData = peers.get(data.from)

    const wasHost = this.game.map.isHost()

    if (peerData) {
      peerData.setX(data.x)
      peerData.setY(data.y)
      peerData.setDirection(data.direction)
      peerData.setMapId(data.mapId)
    }

    if (data.mapId === myMap) {
      if (myMap === "kulonSafeHouse") return
      if (wasHost) {
        this.game.map.broadcastAllNpcs(data.from)
      }

      if (!remotePlayerObject) {
        const peer = peers.get(data.from)!.user
        if (peer) {
          const newPeerObject = new Person(
            {
              type: "Person",
              x: data.x,
              y: data.y,
              direction: data.direction,
              src: Object.values(peer.skin),
              isRemote: true
            },
            this.game.map.footstep
          )
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
  addNote(data: IAny): void {
    if (!data) return

    const { key, mapId, index } = data
    if (!key || !mapId || typeof index !== "number" || index < 0) return

    const target = MapList[mapId]?.configObjects?.[key]?.talk?.[index]?.events
    if (!target) return

    const evt = target.find((evt) => evt.type === "addnote")
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
  async addHint(data: IAny): Promise<void> {
    if (!data) return

    const { key, mapId, index } = data
    if (!key || !mapId || typeof index !== "number" || index < 0) return

    const target = MapList[mapId]?.configObjects?.[key]?.talk?.[index]?.events
    if (!target) return

    const events = target.filter((evt) => evt.type === "addHint")
    if (events.length < 1) return

    events.forEach((evt) => {
      const { text, idx, id, states, instant } = evt
      if (!id || !text || !states) return

      setHint({
        idx: typeof idx === "number" ? idx : 761,
        id,
        states,
        text,
        instant
      })
    })

    await waittime(1000)
    this.game.kulonUI?.phone.updateUnread()
  }
  onInteract(data: IAny): void {
    if (!data.posX || !data.posY) return
    if (db.pmx && db.pmx.onInteract) {
      db.pmx.onInteract(data.posX, data.posY, true, data)
    }
  }
  run(data: IAny): void {
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
