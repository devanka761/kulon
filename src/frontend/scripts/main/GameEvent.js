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

export class GameEvent {
  constructor(game, event) {
    this.game = game
    this.event = event
  }

  titleScreen(resolve) {
    const gameStart = new TitleScreen({
      game: this.game,
      onComplete: () => resolve()
    })
    gameStart.init()
  }

  stand(resolve) {
    const { who, direction, time } = this.event
    const target = this.game.map.gameObjects[who]

    if (target && typeof target.startBehavior === "function") {
      target.startBehavior(
        { map: this.game.map },
        {
          type: "stand",
          direction: direction,
          time: time,
          onComplete: resolve
        }
      )
    } else {
      console.warn(`Game object '${who}' is not found.`)
      resolve()
    }
  }

  walk(resolve) {
    const { who, direction } = this.event
    const target = this.game.map.gameObjects[who]

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
      console.warn(`Game object '${who}' is not found.`)
      resolve()
    }
  }

  changeMap(resolve) {
    const TILE_SIZE = 16

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
      const newMapConfig = MapList[this.event.map]
      this.game.map = new GameMap(newMapConfig)

      await this.game.map.loadPromise

      this.game.player = this.game.map.getPlayer()

      this.game.player.x = this.event.x * TILE_SIZE
      this.game.player.y = this.event.y * TILE_SIZE
      this.game.player.direction = this.event.direction

      this.game.camera.mapWidth = this.game.map.bottomImage.width
      this.game.camera.mapHeight = this.game.map.bottomImage.height

      this.game.lastTriggeredCutsceneKey = null

      sceneTransition.fadeOut()
      if (this.event.door) audio.emit({ action: "play", type: "sfx", src: "door_close" })
      resolve()
    })
  }

  textMessage(resolve) {
    const message = new TextMessage({
      text: this.event.text,
      who: this.event.who,
      onComplete: () => resolve()
    })
    message.init(eroot())
  }

  choices(resolve) {
    const menu = new Choices({
      options: this.event.options,
      noCancel: this.event.noCancel || false,
      who: this.event.who || null,
      text: this.event.text,
      onComplete: (didnext) => resolve(didnext ? "CONTINUE" : "BREAK")
    })
    menu.run()
  }
  addStates(resolve) {
    peers.send("addStates", { states: this.event.states, text: this.event.text })

    this.event.states.forEach((state) => (SaveList[state] = true))
    if (this.event.text) {
      chat.add(db.me.id, this.event.text[LocalList.lang], true)
    }
    resolve()
  }
  removeStates(resolve) {
    peers.send("removeStates", { states: this.event.states })

    this.event.states.forEach((state) => delete SaveList[state])
    resolve()
  }
  addLocalFlags(resolve) {
    this.event.states.forEach((state) => {
      SaveList[state] = true
    })
    resolve()
  }
  removeLocalFlags(resolve) {
    this.event.states.forEach((state) => {
      SaveList[state] = false
    })
    resolve()
  }
  addSetting(resolve) {
    this.event.states.forEach((state) => {
      LocalList[state] = true
    })
    localSave.save()
    resolve()
  }
  removeSetting(resolve) {
    this.event.states.forEach((state) => {
      delete LocalList[state]
    })
    localSave.save()
    resolve()
  }
  phone(resolve) {
    if (db.pmc || chat.formOpened) return resolve()
    const menu = new Phone({
      game: this.game,
      onComplete: () => {
        resolve()
      }
    })
    menu.init(eroot())
  }

  async teleport(resolve) {
    const TILE_SIZE = 16
    const { who, direction, x, y } = this.event
    const person = this.game.map.gameObjects[who]

    if (person) {
      person.x = x * TILE_SIZE
      person.y = y * TILE_SIZE
      person.direction = direction

      peers.send("playerMapChange", {
        mapId: this.game.map.mapId,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        direction: direction
      })
    }
    await waittime(500)
    resolve()
  }

  async teleportFromDirection(resolve) {
    const { who, teleporter } = this.event
    const player = this.game.map.gameObjects[who]

    if (player && teleporter && teleporter.from) {
      const playerDirection = player.direction
      const destination = teleporter.from[playerDirection]

      if (destination) {
        const TILE_SIZE = 16
        player.x = destination.x * TILE_SIZE
        player.y = destination.y * TILE_SIZE
        player.direction = destination.direction

        peers.send("playerMapChange", {
          mapId: this.game.map.mapId,
          x: destination.x * TILE_SIZE,
          y: destination.y * TILE_SIZE,
          direction: destination.direction
        })
      } else {
        console.warn(`No teleport destination found for direction: ${playerDirection}`)
      }
    } else {
      console.warn(`Teleport event is missing player or teleporter object.`)
    }

    await waittime(500)
    resolve()
  }

  additem(resolve) {
    const { id, amount } = this.event
    const item = cloud_items.find((itm) => itm.id === id)
    db.job.setItem({ id, amount })
    notip({
      ic: "backpack",
      a: item.name[LocalList.lang],
      b: `+${amount}`
    })
    resolve()
  }
  missionBoard(resolve) {
    const missionBoard = new Missions({
      game: this.game,
      isFirst: this.event.first || false,
      onComplete: () => {
        resolve()
      }
    })
    missionBoard.init()
  }
  async payout(resolve) {
    const events = db.job.finishScenes

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
  async playerLeft(resolve) {
    await modal.abort()
    await modal.alert(lang.PRP_ON_LEFT.replace("{user}", this.event.user.username))
    const payout = new Payout({ onComplete: () => resolve(), game: this.game, fail: true })
    payout.init()
  }

  mail(resolve) {
    const mails = new Mails({
      onComplete: () => resolve()
    })
    mails.init()
  }

  settingMenu(resolve) {
    const setting = new Setting({ game: this.game, onComplete: () => resolve() })
    setting.init()
  }

  minigame(resolve) {
    const mg = minigamelist[this.event.id]
    if (!mg) return resolve("BREAK")
    backsong.pause()
    mg.run({
      onComplete: (result) => {
        backsong.resume()
        resolve(result ? "CONTINUE" : "BREAK")
      }
    })
  }
  backsongControl(resolve) {
    if (this.event.action === "pause") {
      backsong.pause()
      resolve()
      return
    }
    backsong.resume()
    resolve()
  }
  async playSound(resolve) {
    audio.emit({ action: "play", type: this.event.which, src: this.event.src })
    if (!this.event.instant) await waittime(1000)
    resolve()
  }
  jumpScare(resolve) {
    const jumpscare = new JumpScare({ onComplete: () => resolve() })
    jumpscare.init()
  }
  init() {
    return new Promise((resolve) => {
      this[this.event.type](resolve)
    })
  }
}
