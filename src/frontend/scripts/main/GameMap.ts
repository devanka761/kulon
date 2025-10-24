import asset from "../data/assets"
import { Person } from "./Person"
import { Player } from "./Player"
import peers from "../data/Peers"
import { Interactable } from "./Interactable"
import { Teleporter } from "./Teleporter"
import audio from "../lib/AudioHandler"
import { Prop } from "./Prop"
import { ICutscenes, IGameObjectInteractable, IGameObjectPerson, IGameObjects, IGameObjectTeleporter, IMapConfig, IWalls, MapGameObjects, MapWalls } from "../types/maps.types"

type Resolve = (val?: string) => void

const TILE_SIZE = 16

export class GameMap {
  gameObjects: MapGameObjects = {}
  walls: MapWalls = {}
  cutscenes: ICutscenes
  mapId: string
  sound?: string
  footstep: "a" | "b"

  bottomImage: HTMLImageElement = new Image()
  topImage: HTMLImageElement = new Image()
  isLoaded: boolean = false

  loadPromise: Promise<unknown>
  constructor(config: IMapConfig) {
    this.cutscenes = config.cutscenes || {}
    this.mapId = config.id
    this.sound = config.sound
    this.footstep = config.footstep || "a"

    this.bottomImage.src = asset[config.lowerSrc].src

    this.topImage.src = asset[config.upperSrc].src

    this.isLoaded = false
    this.loadPromise = new Promise((resolve: Resolve) => {
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

  playSound(): void {
    audio.emit({
      action: "play",
      type: "ambient",
      src: this.sound,
      options: { fadeIn: 1000, fadeOut: 1000 }
    })
  }

  drawBottomImage(ctx: CanvasRenderingContext2D): void {
    if (this.isLoaded) {
      ctx.drawImage(this.bottomImage, 0, 0)
    }
  }

  drawTopImage(ctx: CanvasRenderingContext2D): void {
    if (this.isLoaded) {
      ctx.drawImage(this.topImage, 0, 0)
    }
  }

  mountWalls(wallsConfig: IWalls): void {
    if (wallsConfig) {
      for (const key in wallsConfig) {
        const [gridX, gridY] = key.split(",").map(Number)
        this.walls[key] = { x: gridX * TILE_SIZE, y: gridY * TILE_SIZE }
      }
    }
  }

  mountGameObjects(configObjects: IGameObjects): void {
    Object.keys(configObjects).forEach((key) => {
      const objectConfig = configObjects[key]

      let gameObject
      if (objectConfig.type === "Person") {
        const pixelConfig = {
          ...objectConfig,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        if ((pixelConfig as IGameObjectPerson).canControlled) {
          gameObject = new Player(pixelConfig as IGameObjectPerson, this.footstep)
        } else {
          gameObject = new Person(pixelConfig as IGameObjectPerson)
        }
      } else if (objectConfig.type === "Interactable") {
        const pixelConfig = {
          ...objectConfig,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Interactable(pixelConfig as IGameObjectInteractable)
      } else if (objectConfig.type === "Prop") {
        const pixelConfig = {
          ...objectConfig,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Prop(pixelConfig as IGameObjectInteractable)
      } else if (objectConfig.type === "Teleporter") {
        const pixelConfig = {
          ...objectConfig,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Teleporter(pixelConfig as IGameObjectTeleporter)
      }

      if (gameObject) {
        this.gameObjects[key] = gameObject
      }
    })
  }

  mountRemotePlayers(): void {
    peers.getAll().forEach((peer) => {
      if (peer.mapId === this.mapId) {
        const peerObject = new Person({
          type: "Person",
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
    return Object.values(this.gameObjects).find((obj) => obj instanceof Player) as Player
  }
}
