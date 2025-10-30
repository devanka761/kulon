import asset from "../data/assets"
import { DirectionType, IGameObjectPerson, IObjectEvent, IObjectTalk, MapGameObjects, MapWalls } from "../types/maps.types"
import { Game } from "./Game"
import { GameMap } from "./GameMap"
import { IKeyHold } from "./InputHandler"
import { Prop } from "./Prop"

const TILE_SIZE = 16

const footsteps = [2, 5, 8, 11, 14, 17, 19, 22]

type GameObjectImages = {
  [key: string]: HTMLImageElement
}

type ICollisionBox = {
  xOffset: number
  yOffset: number
  width: number
  height: number
}

interface IAnimationFrames {
  [key: string]: { start: number; end: number; row: number; interval: number }
}

interface IPersonBehavior extends IObjectEvent {
  direction: DirectionType
  onComplete(): void
  isTimerStarted?: boolean
}

export class Person {
  x: number
  y: number
  width = 16
  height = 32
  isLoaded: boolean = false
  images: GameObjectImages = {}
  talk?: IObjectTalk[]
  speed = 60
  isRemote: boolean
  targetX: number = 0
  targetY: number = 0

  frameX: number = 18
  frameY: number = 1
  direction: DirectionType
  isMoving: boolean = false

  animationFrames: IAnimationFrames = {
    "idle-right": { start: 0, end: 5, row: 1, interval: 0.18 },
    "idle-up": { start: 6, end: 11, row: 1, interval: 0.18 },
    "idle-left": { start: 12, end: 17, row: 1, interval: 0.18 },
    "idle-down": { start: 18, end: 23, row: 1, interval: 0.18 },
    "walk-right": { start: 0, end: 5, row: 2, interval: 0.14 },
    "walk-up": { start: 6, end: 11, row: 2, interval: 0.14 },
    "walk-left": { start: 12, end: 17, row: 2, interval: 0.14 },
    "walk-down": { start: 18, end: 23, row: 2, interval: 0.14 }
  }
  private idleAnimationInterval: number = 0.18
  private frameTimer: number = 0

  collisionBox: ICollisionBox

  behaviorLoop: IPersonBehavior[] = []
  movingProgressRemaining: number = 0
  currentAnimationName: string
  walkStopTimer: ReturnType<typeof setTimeout> | null = null

  constructor(config: IGameObjectPerson) {
    this.x = config.x || 0
    this.y = config.y || 0

    const images = typeof config.src === "string" ? [config.src] : config.src
    const imagePromises = images
      .filter((src) => src)
      .map((src, i) => {
        return new Promise((resolve) => {
          const image = new Image()
          image.src = asset[src].src
          this.images[i] = image
          image.onload = resolve
          image.onerror = resolve
        })
      })

    Promise.all(imagePromises).then(() => {
      this.isLoaded = true
    })
    this.talk = config.talk
    this.speed = 60

    this.isRemote = config.isRemote || false
    if (this.isRemote) {
      this.targetX = this.x
      this.targetY = this.y
    }

    this.frameX = 18
    this.frameY = 1
    this.direction = config.direction || "down"
    this.isMoving = false

    this.idleAnimationInterval = 0.18
    this.frameTimer = 0

    this.collisionBox = {
      xOffset: 4,
      yOffset: 8,
      width: 8,
      height: 8
    }

    this.behaviorLoop = []
    this.movingProgressRemaining = 0
    this.currentAnimationName = `idle-${this.direction}`
    this.walkStopTimer = null
  }

  update(deltaTime: number, keys: IKeyHold, walls: MapWalls, game: Game): void {
    if (this.isRemote) {
      this.updateRemote(deltaTime)
    } else {
      this.updateBehavior(deltaTime, game)
    }
    this.animate(deltaTime)
  }

  updateRemote(_deltaTime: number): void {
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const lerpFactor = 0.2

    if (distance > 1) {
      this.x += dx * lerpFactor
      this.y += dy * lerpFactor
      this.isMoving = true
      if (this.walkStopTimer) {
        clearTimeout(this.walkStopTimer)
        this.walkStopTimer = null
      }
      this.walkStopTimer = setTimeout(() => {
        this.isMoving = false
      }, 100)
    }
    // else {
    //   setTimeout(() => (this.isMoving = false), 150)
    // }
  }

  updateBehavior(deltaTime: number, game: Game): void {
    if (this.movingProgressRemaining > 0) {
      this.updatePosition(deltaTime)
      return
    }

    if (this.behaviorLoop.length === 0) {
      return
    }

    const behavior = this.behaviorLoop[0]

    if (behavior.type === "walk") {
      this.direction = behavior.direction
      if (!this.isNextTileColliding(game)) {
        if (this.walkStopTimer) {
          clearTimeout(this.walkStopTimer)
          this.walkStopTimer = null
        }
        this.movingProgressRemaining = TILE_SIZE
      }
    } else if (behavior.type === "stand") {
      this.direction = behavior.direction!
      this.isMoving = false

      if (!behavior.isTimerStarted) {
        behavior.isTimerStarted = true
        setTimeout(() => {
          const completedBehavior = this.behaviorLoop.shift()
          if (completedBehavior && completedBehavior.onComplete) {
            completedBehavior.onComplete()
          }
        }, behavior.time || 0)
      }
    }
  }

  updatePosition(deltaTime: number): void {
    this.isMoving = true
    const moveAmount = Math.min(this.speed * deltaTime, this.movingProgressRemaining)

    let moveX = 0
    let moveY = 0
    if (this.direction === "up") moveY = -1
    if (this.direction === "down") moveY = 1
    if (this.direction === "left") moveX = -1
    if (this.direction === "right") moveX = 1

    this.x += moveX * moveAmount
    this.y += moveY * moveAmount
    this.movingProgressRemaining -= moveAmount

    if (this.movingProgressRemaining <= 0) {
      const behavior = this.behaviorLoop.shift()
      this.walkStopTimer = setTimeout(() => {
        this.isMoving = false
      }, 50)
      if (behavior && behavior.onComplete) {
        behavior.onComplete()
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded) return

    const drawY = this.y - 16
    Object.values(this.images).forEach((image) => {
      ctx.drawImage(image, this.width * this.frameX, this.height * this.frameY, this.width, this.height, Math.round(this.x), Math.round(drawY), this.width, this.height)
    })
  }

  animate(deltaTime: number): void {
    this.frameTimer += deltaTime
    const animationName: keyof IAnimationFrames = this.isMoving ? `walk-${this.direction}` : `idle-${this.direction}`

    if (this.currentAnimationName !== animationName) {
      this.currentAnimationName = animationName
      this.frameTimer = 0
      this.frameX = this.animationFrames[animationName].start
    }
    const currentAnimation = this.animationFrames[animationName]
    const interval = this.isMoving ? currentAnimation.interval : this.idleAnimationInterval

    this.frameY = currentAnimation.row
    if (this.frameTimer >= interval) {
      this.frameTimer = 0
      this.frameX++
      if (this.frameX > currentAnimation.end) {
        this.frameX = currentAnimation.start
      }

      if (this.isMoving && footsteps.includes(this.frameX)) {
        this.audioFootSteps()
      }
    }
  }

  audioFootSteps() {}

  facePlayer(playerDirection: DirectionType): void {
    const oppositeDirection = {
      up: "down",
      down: "up",
      left: "right",
      right: "left"
    }
    const newDirection = oppositeDirection[playerDirection] as DirectionType

    if (this.direction !== newDirection) {
      this.direction = newDirection
      this.frameTimer = 0
      this.frameX = this.animationFrames[`idle-${this.direction}`].start
    }
  }

  isColliding(nextX: number, nextY: number, walls: MapWalls, gameObjects: MapGameObjects): boolean {
    const characterBox = {
      x: nextX + this.collisionBox.xOffset,
      y: nextY + this.collisionBox.yOffset,
      width: this.collisionBox.width,
      height: this.collisionBox.height
    }

    for (const key in walls) {
      const wall = walls[key]
      const wallBox = {
        x: wall.x - 3,
        y: wall.y,
        width: TILE_SIZE + 6,
        height: TILE_SIZE + 1
      }

      if (characterBox.x < wallBox.x + wallBox.width && characterBox.x + characterBox.width > wallBox.x && characterBox.y < wallBox.y + wallBox.height && characterBox.y + characterBox.height > wallBox.y) {
        return true
      }
    }

    for (const id in gameObjects) {
      const obj = gameObjects[id]
      if (obj === this || !obj.collisionBox || (obj instanceof Person && obj.isRemote) || obj instanceof Prop) {
        continue
      }

      const objBox = {
        x: obj.x - 3,
        y: obj.y,
        width: obj.collisionBox.width + 6,
        height: obj.collisionBox.height + 1
      }

      if (characterBox.x < objBox.x + objBox.width && characterBox.x + characterBox.width > objBox.x && characterBox.y < objBox.y + objBox.height && characterBox.y + characterBox.height > objBox.y) {
        return true
      }
    }

    return false
  }

  isNextTileColliding(game: Game): boolean {
    let nextX = this.x
    let nextY = this.y
    const TILE_SIZE = 16
    if (this.direction === "up") nextY -= TILE_SIZE / 2
    if (this.direction === "down") nextY += TILE_SIZE / 2
    if (this.direction === "left") nextX -= TILE_SIZE / 2
    if (this.direction === "right") nextX += TILE_SIZE / 2
    return this.isColliding(nextX, nextY, game.map.walls, game.map.gameObjects)
  }

  startBehavior(_state: { map: GameMap }, behavior: IPersonBehavior): void {
    this.behaviorLoop.push(behavior)
  }
}
