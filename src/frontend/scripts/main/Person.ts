import asset from "../data/assets"
import peers from "../data/Peers"
import { playRandomFootstep } from "../manager/randomPlays"
import { IAny } from "../types/LibTypes"
import { DirectionType, IGameObjectPerson, IObjectEvent, IObjectTalk, MapGameObjects, MapWalls } from "../types/MapsTypes"
import { Game } from "./Game"
import { GameMap } from "./GameMap"
import { IKeyHold } from "./InputHandler"
import { Prop } from "./Prop"
import MapList from "../data/MapList"

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
  id?: string
  x: number
  y: number
  width = 16
  height = 32
  isLoaded: boolean = false
  images: GameObjectImages = {}
  talk?: IObjectTalk[]
  drops?: IObjectTalk[]
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
    "walk-down": { start: 18, end: 23, row: 2, interval: 0.14 },

    "hit-right": { start: 0, end: 5, row: 15, interval: 0.07 },
    "sword-right": { start: 0, end: 5, row: 0, interval: 0.07 },
    "hit-up": { start: 6, end: 11, row: 15, interval: 0.07 },
    "sword-up": { start: 6, end: 11, row: 0, interval: 0.07 },
    "hit-left": { start: 12, end: 17, row: 15, interval: 0.07 },
    "sword-left": { start: 12, end: 17, row: 0, interval: 0.07 },
    "hit-down": { start: 18, end: 23, row: 15, interval: 0.07 },
    "sword-down": { start: 18, end: 23, row: 0, interval: 0.07 },

    "hurt-right": { start: 0, end: 2, row: 19, interval: 0.1 },
    "hurt-up": { start: 3, end: 5, row: 19, interval: 0.1 },
    "hurt-left": { start: 6, end: 8, row: 19, interval: 0.1 },
    "hurt-down": { start: 9, end: 11, row: 19, interval: 0.1 }
  }
  private idleAnimationInterval: number = 0.18
  private frameTimer: number = 0

  collisionBox: ICollisionBox

  behaviorLoop: IPersonBehavior[] = []
  movingProgressRemaining: number = 0
  currentAnimationName: string
  walkStopTimer: ReturnType<typeof setTimeout> | null = null
  isHurting: boolean = false
  isAttacking: boolean = false
  hasLunged: boolean = false
  swordImage!: HTMLImageElement
  following: boolean = false
  enemy: boolean = false
  health?: number

  footstep: "a" | "b"
  constructor(config: IGameObjectPerson, footstep: "a" | "b") {
    this.id = config.id
    this.x = config.x || 0
    this.y = config.y || 0
    this.footstep = footstep

    const images = typeof config.src === "string" ? [config.src] : config.src

    const swordImage = new Image()
    swordImage.src = asset.Sword.src
    this.swordImage = swordImage

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
    this.targetX = this.x
    this.targetY = this.y

    this.following = config.following || false
    if (this.following) {
      this.speed = 60 * 0.5
    }
    this.enemy = config.enemy || false
    this.health = config.health
    this.drops = config.drops

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
    let actingRemote = this.isRemote
    const isPlayer = (this as IAny).isPlayer
    if (!isPlayer && !this.isRemote) {
      actingRemote = !game.map.isHost()
    }

    if (actingRemote) {
      this.updateRemote(deltaTime)
    } else {
      this.updateBehavior(deltaTime, game)
      this.targetX = this.x
      this.targetY = this.y
    }
    this.animate(deltaTime, game)
  }

  updateRemote(deltaTime: number): void {
    const dx = this.targetX - this.x
    const dy = this.targetY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 1) {
      const moveAmount = Math.min(this.speed * deltaTime, distance)
      const ratio = moveAmount / distance
      this.x += dx * ratio
      this.y += dy * ratio
      this.isMoving = true
      if (this.walkStopTimer) {
        clearTimeout(this.walkStopTimer)
        this.walkStopTimer = null
      }
      this.walkStopTimer = setTimeout(() => {
        this.isMoving = false
      }, 100)
    }
  }

  updateBehavior(deltaTime: number, game: Game): void {
    if (this.movingProgressRemaining > 0) {
      this.updatePosition(deltaTime)
      return
    }

    if (this.behaviorLoop.length === 0) {
      if (this.following) {
        this.updateAI(game)
      }
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
        const targetX = this.x + (this.direction === "right" ? TILE_SIZE : this.direction === "left" ? -TILE_SIZE : 0)
        const targetY = this.y + (this.direction === "down" ? TILE_SIZE : this.direction === "up" ? -TILE_SIZE : 0)
        this.broadcastNpcMove(game, targetX, targetY)
      }
    } else if (behavior.type === "stand") {
      this.direction = behavior.direction!
      this.isMoving = false

      if (!behavior.isTimerStarted) {
        behavior.isTimerStarted = true
        this.broadcastNpcMove(game, this.x, this.y)
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

    if (this.isAttacking && this.swordImage) {
      const swordAnimName = `sword-${this.direction}`
      const swordAnim = this.animationFrames[swordAnimName]
      if (swordAnim) {
        const hitAnimName = `hit-${this.direction}`
        const hitAnim = this.animationFrames[hitAnimName]
        const progress = this.frameX - hitAnim.start
        const swordFrameX = swordAnim.start + progress
        ctx.drawImage(this.swordImage, this.width * swordFrameX, this.height * swordAnim.row, this.width, this.height, Math.round(this.x), Math.round(drawY), this.width, this.height)
      }
    }
  }

  animate(deltaTime: number, game: Game): void {
    this.frameTimer += deltaTime
    let animationName: keyof IAnimationFrames = this.isMoving ? `walk-${this.direction}` : `idle-${this.direction}`

    if (this.isAttacking) {
      animationName = `hit-${this.direction}`
    } else if (this.isHurting) {
      animationName = `hurt-${this.direction}`
    }

    if (this.currentAnimationName !== animationName) {
      this.currentAnimationName = animationName
      this.frameTimer = 0
      this.frameX = this.animationFrames[animationName].start
    }
    const currentAnimation = this.animationFrames[animationName]
    const interval = this.isMoving || this.isAttacking || this.isHurting ? currentAnimation.interval : this.idleAnimationInterval

    this.frameY = currentAnimation.row
    if (this.frameTimer >= interval) {
      this.frameTimer = 0
      this.frameX++
      if (this.frameX > currentAnimation.end) {
        if (this.isAttacking) {
          this.isAttacking = false
          this.frameX = currentAnimation.end
        } else if (this.isHurting) {
          this.isHurting = false
          this.frameX = currentAnimation.end
        } else {
          this.frameX = currentAnimation.start
        }
      }

      if (this.isAttacking && !this.hasLunged) {
        if (this.frameX === currentAnimation.start + 4) {
          this.hasLunged = true
          let nextX = this.x
          let nextY = this.y
          if (this.direction === "up") nextY -= 3
          if (this.direction === "down") nextY += 3
          if (this.direction === "left") nextX -= 3
          if (this.direction === "right") nextX += 3

          if (game && game.map && !this.isColliding(nextX, nextY, game.map.walls, game.map.gameObjects, game)) {
            this.x = nextX
            this.y = nextY
          }
        }
      }

      if (this.isMoving && !this.isAttacking && !this.isHurting && footsteps.includes(this.frameX)) {
        this.audioFootSteps()
      }
    }
  }

  audioFootSteps() {
    playRandomFootstep(this.footstep)
  }

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

  isColliding(nextX: number, nextY: number, walls: MapWalls, gameObjects: MapGameObjects, game?: Game, ignoreTriggers?: boolean): boolean {
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

      let objBox
      if (obj instanceof Person) {
        objBox = {
          x: obj.x + obj.collisionBox.xOffset,
          y: obj.y + obj.collisionBox.yOffset,
          width: obj.collisionBox.width,
          height: obj.collisionBox.height
        }
      } else {
        objBox = {
          x: obj.x - 3,
          y: obj.y,
          width: obj.collisionBox.width + 6,
          height: obj.collisionBox.height + 1
        }
      }

      if (characterBox.x < objBox.x + objBox.width && characterBox.x + characterBox.width > objBox.x && characterBox.y < objBox.y + objBox.height && characterBox.y + characterBox.height > objBox.y) {
        if (ignoreTriggers) return true

        const isThisPlayer = (this as IAny).isPlayer
        const isObjPlayer = (obj as IAny).isPlayer

        if (obj instanceof Person) {
          const isThisNPC = !isThisPlayer
          const isObjNPC = !isObjPlayer

          if ((isThisPlayer && isObjNPC) || (isThisNPC && isObjPlayer)) {
            const player = isThisPlayer ? this : obj
            const npc = isThisPlayer ? obj : this
            if (!npc.enemy) break

            const dx = player.x - npc.x
            const dy = player.y - npc.y

            let isFacingNPC = false
            if (player.direction === "up" && dy > 0 && Math.abs(dx) <= 16) isFacingNPC = true
            else if (player.direction === "down" && dy < 0 && Math.abs(dx) <= 16) isFacingNPC = true
            else if (player.direction === "left" && dx > 0 && Math.abs(dy) <= 16) isFacingNPC = true
            else if (player.direction === "right" && dx < 0 && Math.abs(dy) <= 16) isFacingNPC = true

            if (player.isAttacking && isFacingNPC) {
              npc.hurt()
              if (npc.health !== undefined && npc.health > 0) {
                npc.health -= 40
                if (npc.health <= 0 && npc.drops && game) {
                  npc.defeated(gameObjects, game, true)
                }
              }
            } else {
              player.hurt()
            }

            if (Math.abs(dx) > Math.abs(dy)) {
              const dir = dx >= 0 ? 1 : -1
              const pNextX = player.x + 16 * dir
              const nNextX = npc.x - 32 * dir

              if (!player.isColliding(pNextX, player.y, walls, gameObjects, game, true)) {
                player.x = pNextX
                player.targetX = player.x
              }
              if (!npc.isColliding(nNextX, npc.y, walls, gameObjects, game, true)) {
                npc.x = nNextX
                npc.targetX = npc.x
              }
            } else {
              const dir = dy >= 0 ? 1 : -1
              const pNextY = player.y + 16 * dir
              const nNextY = npc.y - 32 * dir

              if (!player.isColliding(player.x, pNextY, walls, gameObjects, game, true)) {
                player.y = pNextY
                player.targetY = player.y
              }
              if (!npc.isColliding(npc.x, nNextY, walls, gameObjects, game, true)) {
                npc.y = nNextY
                npc.targetY = npc.y
              }
            }

            if (game) {
              npc.broadcastNpcMove(game, npc.targetX, npc.targetY)
            }
          }
        }

        if (isThisPlayer && obj instanceof Person && obj.following) {
          if (typeof (this as IAny).onFollowingCollision === "function") {
            ;(this as IAny).onFollowingCollision(obj)
          }
          return true
        } else if (this.following && isObjPlayer) {
          if (typeof (obj as IAny).onFollowingCollision === "function") {
            ;(obj as IAny).onFollowingCollision(this)
          }
          return true
        }

        return true
      }
    }

    return false
  }

  defeated(gameObjects: MapGameObjects, game: Game, isCast?: boolean): void {
    const mapId = game.map.mapId
    const npcId = this.id

    if (!npcId) return

    if (isCast) peers.send("npcDefeat", { npcId, mapId })

    if (MapList[mapId] && MapList[mapId].configObjects[npcId]) {
      MapList[mapId].configObjects[npcId].x = -1000
      MapList[mapId].configObjects[npcId].y = -1000
      MapList[mapId].configObjects[npcId].direction = "down"
      MapList[mapId].configObjects[npcId].following = false
      MapList[mapId].configObjects[npcId].health = undefined
      delete MapList[mapId].configObjects[npcId].health
    }

    this.x = -1000
    this.y = -1000
    this.direction = "down"
    this.following = false
    this.health = undefined

    const targetKey = Object.keys(gameObjects).find((k) => gameObjects[k] === this)
    if (this.drops) game.findAndStartScenario(this.drops, targetKey)
  }

  isNextTileColliding(game: Game): boolean {
    let nextX = this.x
    let nextY = this.y
    const TILE_SIZE = 16
    if (this.direction === "up") nextY -= TILE_SIZE / 2
    if (this.direction === "down") nextY += TILE_SIZE / 2
    if (this.direction === "left") nextX -= TILE_SIZE / 2
    if (this.direction === "right") nextX += TILE_SIZE / 2
    return this.isColliding(nextX, nextY, game.map.walls, game.map.gameObjects, game)
  }

  startBehavior(_state: { map: GameMap }, behavior: IPersonBehavior): void {
    this.behaviorLoop.push(behavior)
  }

  attack(): void {
    if (this.isAttacking || this.isHurting) return
    this.isAttacking = true
    this.hasLunged = false
    this.frameTimer = 0
    this.currentAnimationName = `hit-${this.direction}`
    this.frameX = this.animationFrames[this.currentAnimationName].start
  }

  hurt(): void {
    if (this.isHurting || this.isAttacking) return
    this.isHurting = true
    this.frameTimer = 0
    this.currentAnimationName = `hurt-${this.direction}`
    this.frameX = this.animationFrames[this.currentAnimationName].start
  }

  broadcastNpcMove(game: Game, targetX: number, targetY: number): void {
    if (!this.id) return
    const isPlayer = (this as IAny).isPlayer
    if (isPlayer || this.id === "hero") return

    const mapId = game.map.mapId
    if (MapList[mapId] && MapList[mapId].configObjects[this.id]) {
      MapList[mapId].configObjects[this.id].x = this.x / 16
      MapList[mapId].configObjects[this.id].y = this.y / 16
      MapList[mapId].configObjects[this.id].direction = this.direction
      MapList[mapId].configObjects[this.id].health = this.health
      MapList[mapId].configObjects[this.id].following = this.following
      MapList[mapId].configObjects[this.id].enemy = this.enemy
    }

    peers.send("npcMove", {
      npcId: this.id,
      mapId: mapId,
      x: this.x,
      y: this.y,
      direction: this.direction,
      targetX,
      targetY,
      health: this.health,
      following: this.following,
      enemy: this.enemy
    })
  }

  updateAI(game: Game): void {
    if (!game.player || game.isCutscenePlaying || game.isPaused || this.isRemote) return

    let closestPlayer: { x: number; y: number } | null = null
    let minDistance = 120

    const checkPlayer = (p: { x: number; y: number }) => {
      const dx = p.x - this.x
      const dy = p.y - this.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < minDistance) {
        minDistance = distance
        closestPlayer = p
      }
    }

    if (game.player) checkPlayer(game.player)

    for (const key in game.map.gameObjects) {
      if (key.startsWith("crew_")) {
        const remotePlayer = game.map.gameObjects[key]
        if (remotePlayer) checkPlayer(remotePlayer)
      }
    }

    if (closestPlayer) {
      const p = closestPlayer as { x: number; y: number }
      const dx = p.x - this.x
      const dy = p.y - this.y
      const preferredDir: DirectionType = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up"

      if (minDistance <= 8) {
        if (minDistance > 0) {
          this.direction = preferredDir
        }
        return
      }

      if (preferredDir) {
        this.direction = preferredDir
        if (!this.isNextTileColliding(game)) {
          if (this.walkStopTimer) {
            clearTimeout(this.walkStopTimer)
            this.walkStopTimer = null
          }
          this.movingProgressRemaining = TILE_SIZE
          const targetX = this.x + (this.direction === "right" ? TILE_SIZE : this.direction === "left" ? -TILE_SIZE : 0)
          const targetY = this.y + (this.direction === "down" ? TILE_SIZE : this.direction === "up" ? -TILE_SIZE : 0)
          this.broadcastNpcMove(game, targetX, targetY)
        } else {
          const secondaryDir: DirectionType = preferredDir === "right" || preferredDir === "left" ? (dy > 0 ? "down" : "up") : dx > 0 ? "right" : "left"

          this.direction = secondaryDir
          if (!this.isNextTileColliding(game)) {
            if (this.walkStopTimer) {
              clearTimeout(this.walkStopTimer)
              this.walkStopTimer = null
            }
            this.movingProgressRemaining = TILE_SIZE
            const targetX = this.x + (this.direction === "right" ? TILE_SIZE : this.direction === "left" ? -TILE_SIZE : 0)
            const targetY = this.y + (this.direction === "down" ? TILE_SIZE : this.direction === "up" ? -TILE_SIZE : 0)
            this.broadcastNpcMove(game, targetX, targetY)
          } else {
            this.direction = preferredDir
          }
        }
      }
    }
  }
}
