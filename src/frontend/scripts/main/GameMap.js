import asset from "../data/assets"
import { Person } from "./Person"
import { Player } from "./Player"
import peers from "../data/Peers"
import { Interactable } from "./Interactable"
import { Teleporter } from "./Teleporter"
import audio from "../lib/AudioHandler"

const TILE_SIZE = 16

export class GameMap {
  constructor(config) {
    this.gameObjects = {}
    this.walls = {}
    this.cutscenes = config.cutscenes || {}
    this.mapId = config.id
    this.sound = config.sound
    this.footstep = config.footstep || "a"

    this.bottomImage = new Image()
    this.bottomImage.src = asset[config.lowerSrc].src

    this.topImage = new Image()
    this.topImage.src = asset[config.upperSrc].src

    this.isLoaded = false
    this.loadPromise = new Promise((resolve) => {
      const bottomPromise = new Promise((res) => {
        this.bottomImage.onload = res
        this.bottomImage.onerror = res
      })
      const topPromise = new Promise((res) => {
        this.topImage.onload = res
        this.topImage.onerror = res
      })

      Promise.all([bottomPromise, topPromise]).then(() => {
        this.isLoaded = true
        resolve()
      })
    })

    this.mountWalls(config.walls)
    this.mountGameObjects(config.configObjects)
    this.mountRemotePlayers()
    this.playSound()
  }

  playSound() {
    audio.emit({
      action: "play",
      type: "ambient",
      src: this.sound,
      options: { fadeIn: 1000, fadeOut: 1000 }
    })
  }

  drawBottomImage(ctx) {
    if (this.isLoaded) {
      ctx.drawImage(this.bottomImage, 0, 0, this.bottomImage.width, this.bottomImage.height)
    }
  }

  drawTopImage(ctx) {
    if (this.isLoaded) {
      ctx.drawImage(this.topImage, 0, 0, this.topImage.width, this.topImage.height)
    }
  }

  mountWalls(wallsConfig) {
    if (wallsConfig) {
      for (const key in wallsConfig) {
        const [gridX, gridY] = key.split(",").map(Number)
        this.walls[key] = { x: gridX * TILE_SIZE, y: gridY * TILE_SIZE }
      }
    }
  }

  mountGameObjects(configObjects) {
    Object.keys(configObjects).forEach((key) => {
      const objectConfig = configObjects[key]

      let gameObject
      if (objectConfig.type === "Person") {
        const pixelConfig = {
          ...objectConfig,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        if (pixelConfig.canControlled) {
          gameObject = new Player(pixelConfig, this.footstep)
        } else {
          gameObject = new Person(pixelConfig)
        }
      } else if (objectConfig.type === "Interactable") {
        const pixelConfig = {
          ...objectConfig,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Interactable(pixelConfig)
      } else if (objectConfig.type === "Teleporter") {
        const pixelConfig = {
          ...objectConfig,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Teleporter(pixelConfig)
      }

      if (gameObject) {
        this.gameObjects[key] = gameObject
      }
    })
  }

  mountRemotePlayers() {
    peers.getAll().forEach((peer) => {
      if (peer.mapId === this.mapId) {
        const peerObject = new Person({
          x: peer.x,
          y: peer.y,
          direction: peer.direction,
          src: Object.values(peer.skin),
          isRemote: true
        })
        this.gameObjects[`crew_${peer.user.id}`] = peerObject
      }
    })
  }

  getPlayer() {
    return Object.values(this.gameObjects).find((obj) => obj instanceof Player)
  }
}
