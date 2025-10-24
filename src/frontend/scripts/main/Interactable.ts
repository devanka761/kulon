import asset from "../data/assets"
import SaveList from "../data/SaveList"
import { IGameObjectInteractable, IObjectTalk } from "../types/maps.types"

const TILE_SIZE = 16

type GameObjectImages = {
  [key: string]: HTMLImageElement
}

interface IAnimationFrames {
  [key: string]: { start: number; end: number; row: number }
}
type ICollisionBox = {
  xOffset: number
  yOffset: number
  width: number
  height: number
}

export class Interactable {
  x: number
  y: number
  width = 16
  height = 32
  isLoaded: boolean = false
  images: GameObjectImages = {}
  talk?: IObjectTalk[]

  frameX: number = 18
  frameY: number = 1

  states?: string[]

  image: HTMLImageElement
  offArea: [number, number]

  animationFrames: IAnimationFrames

  animationInterval: number = 0.14
  frameTimer: number = 0
  currentAnimationName: string = "unused"

  collisionBox?: ICollisionBox

  collisionXStart: number
  collisionYStart: number
  collisionWidth: number
  collisionHeight: number

  constructor(config: IGameObjectInteractable) {
    this.x = config.x || 0
    this.y = config.y || 0
    this.talk = config.talk
    this.states = config.states
    this.isLoaded = false

    this.image = new Image()
    this.image.onload = () => {
      this.isLoaded = true
      this.offArea = [this.image.width / (config.offset?.[0] || 1), this.image.height / ((config.offset?.[1] || 0) + 1)]
    }
    this.image.src = asset[config.src as string].src

    this.offArea = [this.image.width / (config.offset?.[0] || 1), this.image.height / ((config.offset?.[1] || 0) + 1)]

    this.animationFrames = {
      unused: { start: 0, end: (config.offset?.[0] || 1) - 1, row: 0 },
      used: { start: 0, end: (config.offset?.[0] || 1) - 1, row: 1 }
    }
    this.frameX = 0
    this.frameY = this.animationFrames[this.currentAnimationName].row

    this.collisionXStart = config.collision?.[0] || 0

    this.collisionYStart = config.collision?.[1] || 0

    this.collisionWidth = config.collision?.[2] || 1

    this.collisionHeight = config.collision?.[3] || 1

    this.collisionBox = !config.collision
      ? undefined
      : {
          xOffset: this.collisionXStart * TILE_SIZE,
          yOffset: this.collisionYStart * TILE_SIZE,
          width: this.collisionWidth * TILE_SIZE,
          height: this.collisionHeight * TILE_SIZE
        }
  }

  update(deltaTime: number): void {
    this.checkAnimationState()
    this.animate(deltaTime)
  }

  checkAnimationState(): void {
    if (!this.states || this.states.length === 0) {
      return
    }

    const allStatesMet = this.states.every((state) => SaveList[state])

    if (allStatesMet) {
      this.currentAnimationName = "used"
    } else {
      this.currentAnimationName = "unused"
    }
  }

  animate(deltaTime: number): void {
    this.frameTimer += deltaTime
    const currentAnimation = this.animationFrames[this.currentAnimationName]
    const interval = this.animationInterval

    this.frameY = currentAnimation.row
    if (this.frameTimer >= interval) {
      this.frameTimer = 0
      this.frameX++
      if (this.frameX > currentAnimation.end) {
        this.frameX = currentAnimation.start
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded) return

    const areaX = this.offArea[0]
    const areaY = this.offArea[1]

    if (this.image) {
      const drawX = this.x - (this.collisionBox?.xOffset || 0)
      const drawY = this.y - (this.collisionBox?.yOffset || 0)

      ctx.drawImage(this.image, areaX * this.frameX, areaY * this.frameY, areaX, areaY, Math.round(drawX), Math.round(drawY), areaX, areaY)
    }
  }

  facePlayer() {}
}
