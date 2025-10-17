import { InputHandler } from "./InputHandler"
import { Camera } from "./Camera"
import MapList from "../data/MapList"
import SaveList from "../data/SaveList"
import { GameEvent } from "./GameEvent"
import { KeyPressListener } from "./KeyPressListener"
import { GameMap } from "./GameMap"
import localSave from "../manager/storage"
import socketHandler from "../lib/SocketHandler"
import itemRun from "../Props/itemRun"
import remotes from "../data/remotes"
import peerMessage from "../lib/PeerMessage"
import db from "../data/db"
import chat from "../manager/Chat"
import introEvents from "../../../../public/json/main/intro.json"
import LocalList from "../data/LocalList"
import socket from "../lib/Socket"
import KulonUI from "../manager/KulonUI"
import KulonPad from "./KulonPad"
import { Prop } from "./Prop"

export class Game {
  constructor(canvas, viewportWidth) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext("2d")
    this.ctx.imageSmoothingEnabled = false
    this.VIEWPORT_WIDTH = viewportWidth

    this.map = null

    this.inputHandler = new InputHandler()
    this.kulonPad = new KulonPad(150)

    this.player = null
    this.camera = null

    this.isPaused = false
    this.isCutscenePlaying = false
    this.lastTriggeredCutsceneKey = null

    this.wasMoving = false
    this.lastMoveTime = 0

    this.keyListeners = []
    this.kulonUI = new KulonUI()

    this.lastTime = 0
    this.animationFrameId = null
    window.addEventListener("resize", this.resizeCanvas.bind(this))
  }

  keypressAction() {
    this.keyListeners.push(new KeyPressListener("escape", () => this.openPhone()), new KeyPressListener("t", () => chat.open()), new KeyPressListener("e", this.checkForInteraction.bind(this)))

    this.kulonUI.phone.onClick(() => this.openPhone())
    this.kulonUI.chat.onClick(() => chat.open())
    this.kulonUI.gamepad.onClick(() => this.kulonPad.toggle())

    this.kulonPad.setOnMove((direction) => this.inputHandler.movePad(direction))
    this.kulonPad.setOnRelease((direction) => this.inputHandler.releasePad(direction))
    this.kulonPad.setOnInteract(this.checkForInteraction.bind(this))
  }

  pause() {
    this.isPaused = true
  }

  resume() {
    this.isPaused = false
  }

  openPhone() {
    if (!this.isCutscenePlaying && !db.pmc && !chat.formOpened) {
      this.startCutscene([{ type: "phone" }])
    }
  }

  async startGame() {
    this.inputHandler.init()

    this.map = new GameMap(MapList[localSave.mapId])
    await this.map.loadPromise

    this.player = this.map.getPlayer()
    this.camera = new Camera(this.canvas, this.map.bottomImage.width, this.map.bottomImage.height)
    this.resizeCanvas()

    this.gameLoop()

    socket.init(this)
    socketHandler.init(this)
    peerMessage.init(this)
    itemRun.init(this)
    remotes.init(this)

    this.kulonUI.init()
    this.keypressAction()

    if (db.onduty < 1) {
      db.onduty = 1
      const isDone = LocalList["GAME_MANUALS"]
      this.player.y = isDone ? 80 : 96
      await this.startCutscene(introEvents[LocalList["GAME_MANUALS"] ? "DONE" : "FIRST"])
      if (!isDone) {
        if (db.mails.getAll.length >= 1) {
          await this.startCutscene(introEvents.MAIL_INITIAL)
        }
        await this.startCutscene(introEvents.SECOND)
      }
    }
  }

  resizeCanvas() {
    const scale = window.innerWidth / this.VIEWPORT_WIDTH
    this.canvas.style.width = `${window.innerWidth}px`
    const newHeight = Math.floor(window.innerHeight / scale)
    this.canvas.style.height = `${window.innerHeight}px`
    this.canvas.width = this.VIEWPORT_WIDTH
    this.canvas.height = newHeight
    this.ctx.imageSmoothingEnabled = false
  }

  gameLoop(currentTime = 0) {
    if (!this.lastTime) {
      this.lastTime = currentTime
    }

    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    if (!this.isPaused) {
      this.update(deltaTime)
    }
    this.draw()

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this))
  }

  update(deltaTime) {
    Object.values(this.map.gameObjects).forEach((obj) => {
      obj.update(deltaTime, this.inputHandler.keys, this.map.walls, this)
    })
    this.camera.update(this.player)

    this.checkForCutscene()
  }

  checkForInteraction() {
    if (this.isCutscenePlaying || this.isPaused) {
      return
    }

    const TILE_SIZE = 16
    const { x, y, direction, collisionBox } = this.player

    let interactionX = x + collisionBox.xOffset + collisionBox.width / 2
    let interactionY = y + collisionBox.yOffset + collisionBox.height / 2

    if (direction === "up") interactionY -= TILE_SIZE
    else if (direction === "down") interactionY += TILE_SIZE
    else if (direction === "left") interactionX -= TILE_SIZE
    else if (direction === "right") interactionX += TILE_SIZE

    const interactionGridX = Math.floor(interactionX / TILE_SIZE)
    const interactionGridY = Math.floor(interactionY / TILE_SIZE)

    const target = Object.values(this.map.gameObjects).find((obj) => {
      if (obj === this.player) return false
      const objGridX = Math.floor(obj.x / TILE_SIZE)
      const objGridY = Math.floor(obj.y / TILE_SIZE)
      return objGridX === interactionGridX && objGridY === interactionGridY
    })

    if (target && target.talk && target instanceof Prop === false) {
      if (typeof target.facePlayer === "function") {
        target.facePlayer(this.player.direction)
      }
      this.findAndStartScenario(target.talk)
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (!this.map || !this.map.isLoaded) {
      return
    }

    this.ctx.save()
    this.camera.apply(this.ctx)
    this.map.drawBottomImage(this.ctx)

    const sortedGameObjects = Object.values(this.map.gameObjects).sort((a, b) => a.y - b.y)
    sortedGameObjects.forEach((obj) => obj.draw(this.ctx))

    this.map.drawTopImage(this.ctx)
    this.ctx.restore()
  }

  checkForCutscene() {
    if (this.isCutscenePlaying) {
      return
    }

    const TILE_SIZE = 16
    const playerFeetGridX = Math.floor((this.player.x + this.player.collisionBox.xOffset + this.player.collisionBox.width / 2) / TILE_SIZE)
    const playerFeetGridY = Math.floor((this.player.y + this.player.collisionBox.yOffset + this.player.collisionBox.height / 2) / TILE_SIZE)

    const key = `${playerFeetGridX},${playerFeetGridY}`

    const cutsceneTrigger = this.map.cutscenes && this.map.cutscenes[key]
    if (cutsceneTrigger && this.lastTriggeredCutsceneKey !== key) {
      this.lastTriggeredCutsceneKey = key
      this.findAndStartScenario(cutsceneTrigger)
      return
    }

    const propTrigger = Object.values(this.map.gameObjects).find((obj) => {
      if (obj instanceof Prop) {
        const propGridX = Math.floor(obj.x / TILE_SIZE)
        const propGridY = Math.floor(obj.y / TILE_SIZE)
        return propGridX === playerFeetGridX && propGridY === playerFeetGridY && obj.talk
      }
      return false
    })

    if (propTrigger && this.lastTriggeredCutsceneKey !== `prop_${propTrigger.x},${propTrigger.y}`) {
      this.lastTriggeredCutsceneKey = `prop_${propTrigger.x},${propTrigger.y}`
      this.findAndStartScenario(propTrigger.talk)
      return
    }

    if (!cutsceneTrigger && !propTrigger) {
      this.lastTriggeredCutsceneKey = null
    }
  }

  findAndStartScenario(scenarios) {
    for (const scenario of scenarios) {
      const requirementsMet = (scenario.local_req || scenario.required || []).every((state) => {
        return SaveList[state]
      })

      if (requirementsMet) {
        this.startCutscene(scenario.events)
        break
      }
    }
  }
  forceCutscene(newBool) {
    this.isCutscenePlaying = newBool
  }
  async startCutscene(events) {
    this.isCutscenePlaying = true
    this.kulonUI.hide()
    this.kulonPad.hide()

    this.player.isMoving = false

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new GameEvent(this, events[i])
      const result = await eventHandler.init()
      if (result === "BREAK") {
        break
      }
    }
    this.kulonUI.show()
    this.kulonPad.show()
    this.isCutscenePlaying = false
  }

  destroy() {
    window.removeEventListener("resize", this.resizeCanvas.bind(this))
    this.inputHandler.destroy()
    this.kulonPad.destroy()
    this.kulonUI.destroy()
    this.keyListeners.forEach((listener) => listener.unbind())
    this.keyListeners = []
    cancelAnimationFrame(this.animationFrameId)
  }
  async init() {
    await this.startGame()
  }
}
