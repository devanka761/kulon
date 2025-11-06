import cloud_items from "../../../../public/json/items/cloud_items.json"
import SaveList from "../data/SaveList"
import TextMessage from "../Events/TextMessage"
import MapList from "../data/MapList"
import { GameMap } from "./GameMap"
import SceneTransition from "./SceneTransition"
import Choices from "../Events/Choice"
import Phone from "../Events/Phone"
import { eroot } from "../lib/kel"
import waittime from "../lib/waittime"
import Missions from "../Events/Missions"
import notip from "../lib/notip"
import db from "../data/db"
import LocalList from "../data/LocalList"
import Payout from "../Events/Payout"
import socket from "../lib/Socket"
import chat from "../manager/Chat"
import modal from "../lib/modal"
import peers from "../data/Peers"
import lang from "../data/language"
import minigamelist from "../data/minigames"
import audio from "../lib/AudioHandler"
import TitleScreen from "../pages/TitleScreen"
import localSave from "../manager/storage"
import Mails from "../Contents/Mails"
import backsong from "../APIs/BackSongAPI"
import JumpScare from "../Events/JumpScare"
import Setting from "../Contents/Setting"
import { IObjectEvent } from "../types/maps.types"
import { Game } from "./Game"
import { Person } from "./Person"
import { paperAdd, paperGet } from "../data/notes"
import Paper from "../Events/Paper"
import { Prop } from "./Prop"
import { Interactable } from "./Interactable"
import xhr from "../lib/xhr"
import { IUser } from "../types/db.types"
import { checkHint, setHint } from "../Events/Hint"

type Resolve = (val?: string) => void

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

export class GameEvent {
  constructor(
    private game: Game,
    private event: IObjectEvent,
    private targetIdx?: number,
    private targetKey?: string
  ) {}

  titleScreen(resolve: Resolve): void {
    const gameStart = new TitleScreen({
      game: this.game,
      onComplete: () => resolve()
    })
    gameStart.init()
  }

  stand(resolve: Resolve): void {
    const { who, direction, time } = this.event
    if (!who) return resolve()

    const target = this.game.map.gameObjects[who] as Person

    if (target && typeof target.startBehavior === "function") {
      target.startBehavior(
        { map: this.game.map },
        {
          type: "stand",
          direction: direction || "down",
          time: time,
          onComplete: resolve
        }
      )
    } else {
      // console.warn(`Game object '${who}' is not found.`)
      resolve()
    }
  }

  walk(resolve: Resolve): void {
    const { who, direction } = this.event
    if (!who || !direction) return resolve()

    const target = this.game.map.gameObjects[who] as Person

    if (target && typeof target.startBehavior === "function") {
      target.startBehavior(
        { map: this.game.map },
        {
          type: "walk",
          direction: direction,
          onComplete: resolve
        }
      )
    } else {
      // console.warn(`Game object '${who}' is not found.`)
      resolve()
    }
  }

  changeMap(resolve: Resolve): void {
    const TILE_SIZE = 16

    if (!this.event.x || !this.event.y || !this.event.map) return resolve()

    if (this.event.door) audio.emit({ action: "play", type: "sfx", src: "door_open" })

    audio.emit({
      action: "stop",
      type: "ambient",
      options: { fadeOut: 1000 }
    })

    peers.send("playerMapChange", {
      mapId: this.event.map,
      x: this.event.x * TILE_SIZE,
      y: this.event.y * TILE_SIZE,
      direction: this.event.direction
    })

    const sceneTransition = new SceneTransition()
    sceneTransition.init(eroot(), async () => {
      if (!this.event.x || !this.event.y || !this.event.map) return resolve()

      const newMapConfig = MapList[this.event.map]
      this.game.map = new GameMap(newMapConfig)

      await this.game.map.loadPromise

      this.game.player = this.game.map.getPlayer()

      this.game.player.x = this.event.x * TILE_SIZE
      this.game.player.y = this.event.y * TILE_SIZE
      this.game.player.direction = this.event.direction || "down"

      this.game.camera.mapWidth = this.game.map.bottomImage.width
      this.game.camera.mapHeight = this.game.map.bottomImage.height

      this.game.lastTriggeredCutsceneKey = null

      sceneTransition.fadeOut()
      if (this.event.door) audio.emit({ action: "play", type: "sfx", src: "door_close" })
      resolve()
    })
  }

  textMessage(resolve: Resolve): void {
    const { text, who } = this.event
    if (!text) return resolve()

    const message = new TextMessage({ text, who, onComplete: () => resolve() })
    message.init()
  }

  choices(resolve: Resolve): void {
    const { options, who, text } = this.event
    if (!options || !text) return resolve()

    const menu = new Choices({
      options,
      who,
      text,
      // noCancel: this.event.noCancel || false,
      onComplete: (didnext?: string | null) => resolve(didnext ? "CONTINUE" : "BREAK")
    })
    menu.init()
  }
  addClaims(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    socket.send("addClaims", { states })

    checkHint(states)

    resolve()
  }
  addStates(resolve: Resolve): void {
    const { states, text } = this.event

    if (!states) return resolve()
    peers.send("addStates", { states, text })

    states.forEach((state) => (SaveList[state] = true))
    if (text) {
      chat.add(db.me.id, text[LocalList.lang!], true)
    }

    checkHint(states)

    resolve()
  }
  removeStates(resolve: Resolve): void {
    const { states } = this.event

    peers.send("removeStates", { states })
    if (!states) return resolve()

    states.forEach((state) => delete SaveList[state])
    resolve()
  }
  addLocalFlags(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => {
      SaveList[state] = true
    })

    checkHint(states)

    resolve()
  }
  removeLocalFlags(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => {
      SaveList[state] = false
    })

    resolve()
  }
  addSetting(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => {
      LocalList[state] = true
    })

    localSave.save()

    checkHint(states)

    resolve()
  }
  removeSetting(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => {
      delete LocalList[state]
    })
    localSave.save()
    resolve()
  }
  addHint(resolve: Resolve): void {
    const { text, idx, id, states } = this.event
    if (!this.targetKey || !id || !text || !states) return resolve()

    setHint({
      idx: typeof idx === "number" ? idx : 761,
      id,
      states,
      text
    })

    peers.send("addHint", {
      key: this.targetKey,
      mapId: this.game.map.mapId,
      index: this.targetIdx
    })

    resolve()
  }
  phone(resolve: Resolve): void {
    if (db.pmc || chat.formOpened) return resolve()
    const menu = new Phone({
      game: this.game,
      onComplete: () => {
        resolve()
      }
    })
    menu.init()
  }

  async teleport(resolve: Resolve): Promise<void> {
    const TILE_SIZE = 16
    const { who, direction, x, y } = this.event

    if (!who || !x || !y) return resolve()

    const person = this.game.map.gameObjects[who]

    if (person instanceof Person) {
      person.x = x * TILE_SIZE
      person.y = y * TILE_SIZE
      person.direction = direction || "down"

      if (who === "hero") {
        peers.send("playerMapChange", {
          mapId: this.game.map.mapId,
          x: x * TILE_SIZE,
          y: y * TILE_SIZE,
          direction: direction
        })
      }
    } else if (person instanceof Prop || person instanceof Interactable) {
      person.x = x * TILE_SIZE
      person.y = y * TILE_SIZE

      peers.send("objMapChange", {
        who,
        mapId: this.game.map.mapId,
        x,
        y
      })
    }
    await waittime(500)
    resolve()
  }

  async teleportFromDirection(resolve: Resolve): Promise<void> {
    const { who, teleporter } = this.event
    if (!who || !teleporter) return resolve()

    const player = this.game.map.gameObjects[who]

    if (player instanceof Person && teleporter && teleporter.from) {
      const playerDirection = player.direction
      const destination = teleporter.from[playerDirection]

      if (destination) {
        const TILE_SIZE = 16
        player.x = destination.x * TILE_SIZE
        player.y = destination.y * TILE_SIZE
        player.direction = destination.direction || "down"

        peers.send("playerMapChange", {
          mapId: this.game.map.mapId,
          x: destination.x * TILE_SIZE,
          y: destination.y * TILE_SIZE,
          direction: destination.direction
        })
      } else {
        // console.warn(`No teleport destination found for direction: ${playerDirection}`)
      }
    } else {
      // console.warn(`Teleport event is missing player or teleporter object.`)
    }

    await waittime(500)
    resolve()
  }

  additem(resolve: Resolve): void {
    const { id, amount } = this.event
    if (!id || !amount) return
    const item = cloud_items.find((itm) => itm.id === id)
    if (!item) return resolve()

    peers.send("addItem", { itemId: id, amount })

    db.job.setItem({ id, amount })

    notip({
      ic: "backpack",
      a: item.name[LocalList.lang!],
      b: `+${amount}`
    })
    resolve()
  }
  addnote(resolve: Resolve): void {
    const { pages, text } = this.event
    if (!this.targetKey || !pages || !text) return resolve()

    const item = cloud_items.find((itm) => itm.id === "J00006")
    if (!item) return resolve()

    peers.send("addNote", {
      key: this.targetKey,
      mapId: this.game.map.mapId,
      index: this.targetIdx
    })

    paperAdd(this.targetKey, pages, text)

    db.job.setItem({ id: this.targetKey, amount: 1, itemId: "J00006" })

    notip({
      ic: "backpack",
      a: text[LocalList.lang!],
      b: `+${1}`
    })
    resolve()
  }
  readnote(resolve: Resolve): void {
    if (!this.targetKey) return resolve()

    const note = paperGet(this.targetKey)
    if (!note) return resolve()

    const paper = new Paper({
      onComplete: () => resolve(),
      name: note.name,
      text: note.text
    })
    paper.init()
  }
  missionBoard(resolve: Resolve): void {
    const missionBoard = new Missions({
      game: this.game,
      isFirst: this.event.first || false,
      onComplete: () => {
        resolve()
      }
    })
    missionBoard.init()
  }
  async payout(resolve: Resolve): Promise<void> {
    const events = db.job.finishScenes
    if (!events) return

    if (!this.event.crew) {
      socket.send("payout")
    }

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new GameEvent(this.game, events[i])
      const result = await eventHandler.init()
      if (result === "BREAK") {
        break
      }
    }

    const payout = new Payout({
      onComplete: () => resolve,
      game: this.game
    })
    payout.init()
  }

  async winner(resolve: Resolve): Promise<void> {
    const events = db.job.finishScenes
    if (!events) return

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new GameEvent(this.game, events[i])
      const result = await eventHandler.init()
      if (result === "BREAK") {
        break
      }
    }

    const { winners } = this.event
    const won = winners!.find((usr) => usr === db.me.id)

    const payout = new Payout({
      onComplete: () => resolve,
      game: this.game,
      fail: !won
    })
    payout.init()
  }

  async playerLeft(resolve: Resolve): Promise<void> {
    await modal.abort()
    await modal.alert(lang.PRP_ON_LEFT.replace("{user}", this.event.user!.username!))
    const payout = new Payout({ onComplete: () => resolve(), game: this.game, fail: true })
    payout.init()
  }

  mail(resolve: Resolve): void {
    const mails = new Mails({
      onComplete: () => resolve()
    })
    mails.init()
  }

  settingMenu(resolve: Resolve): void {
    const setting = new Setting({ game: this.game, onComplete: () => resolve() })
    setting.init()
  }

  minigame(resolve: Resolve): void {
    if (!this.event.id) return resolve("BREAK")

    const mg = minigamelist[this.event.id as keyof typeof minigamelist]
    if (!mg) return resolve("BREAK")
    backsong.pause()
    mg.run({
      onComplete: (result?: string | null) => {
        backsong.resume()
        resolve(result ? "CONTINUE" : "BREAK")
      }
    })
  }
  backsongControl(resolve: Resolve): void {
    if (this.event.action === "pause") {
      backsong.pause()
      resolve()
      return
    }
    backsong.resume()
    resolve()
  }
  async playSound(resolve: Resolve): Promise<void> {
    if (!this.event.which) return resolve()
    audio.emit({ action: "play", type: this.event.which, src: this.event.src })
    if (!this.event.instant) await waittime(1000)
    resolve()
  }
  jumpScare(resolve: Resolve): void {
    const jumpscare = new JumpScare({ onComplete: () => resolve() })
    jumpscare.init()
  }
  async lobby(resolve: Resolve): Promise<void> {
    resolve()
    if (db.lobby.status === true) return

    db.lobby.enable()

    const session = await xhr.get("/x/job/joinRandom")
    if (!session.ok || !session.data || !session.data.users) return

    const users = session.data.users as IUser[]
    users.forEach((usr) => {
      db.lobby.add(usr)
      const { remote } = peers.add(usr)!
      remote.onOpened(() => {
        remote.send({
          from: db.me.id,
          type: "lobbyConfirm"
        })
      })
      remote.call()
    })

    const key = session.data.key
    backsong.switch(2, 1)
    backsong.start(5000)
    notip({ a: `LOBBY ${key}`, b: "Entered Random Public Lobby", ic: "users-rays" })
  }
  init() {
    return new Promise((resolve: Resolve) => {
      if (!this.event.type) return resolve()

      if (INVALID_CONTROLS.find((control) => control === this.event.type)) return resolve()

      const type = this.event.type as keyof GameEvent
      if (!this[type]) return resolve()

      this[type](resolve)
    })
  }
}
