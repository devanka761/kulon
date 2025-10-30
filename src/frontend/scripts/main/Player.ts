import chat from "../manager/Chat"
import peers from "../data/Peers"
import { Person } from "./Person"
import { playRandomFootstep } from "../manager/randomPlays"
import { IGameObjectPerson, MapWalls } from "../types/maps.types"
import { Game } from "./Game"
import { IKeyHold } from "./InputHandler"

export class Player extends Person {
  footstep: "a" | "b"
  constructor(config: IGameObjectPerson, footstep: "a" | "b") {
    super(config)
    this.footstep = footstep
  }

  update(deltaTime: number, keys: IKeyHold, walls: MapWalls, game: Game): void {
    if (game.isCutscenePlaying) {
      this.updateBehavior(deltaTime, game)
      this.animate(deltaTime)
      return
    }

    const handlePlayerMovement = () => {
      if (chat.formOpened) {
        this.isMoving = false
        return
      }
      let moveX = 0
      let moveY = 0
      if (keys["w"]) {
        moveY = -1
        this.direction = "up"
      } else if (keys["s"]) {
        moveY = 1
        this.direction = "down"
      }
      if (keys["a"]) {
        moveX = -1
        this.direction = "left"
      } else if (keys["d"]) {
        moveX = 1
        this.direction = "right"
      }

      const oldX = this.x
      const oldY = this.y

      if (moveX === 0 && moveY === 0) {
        this.isMoving = false
        return
      }

      const length = Math.sqrt(moveX * moveX + moveY * moveY)
      if (length > 1) {
        moveX /= length
        moveY /= length
      }

      const desiredNextX = this.x + moveX * this.speed * deltaTime
      const desiredNextY = this.y + moveY * this.speed * deltaTime

      if (!this.isColliding(desiredNextX, this.y, walls, game.map.gameObjects)) {
        this.x = desiredNextX
      }
      if (!this.isColliding(this.x, desiredNextY, walls, game.map.gameObjects)) {
        this.y = desiredNextY
      }

      this.isMoving = this.x !== oldX || this.y !== oldY
    }

    if (this.movingProgressRemaining > 0 || this.behaviorLoop.length > 0) {
      this.updateBehavior(deltaTime, game)
    } else {
      handlePlayerMovement()
    }

    this.animate(deltaTime)

    const now = Date.now()

    if (this.isMoving !== game.wasMoving || (this.isMoving && now - game.lastMoveTime > 100)) {
      peers.send("playerMove", {
        x: this.x,
        y: this.y,
        mapId: game.map.mapId,
        direction: this.direction,
        isMoving: this.isMoving
      })
      game.wasMoving = this.isMoving
      game.lastMoveTime = now
    }
  }
  audioFootSteps(): void {
    playRandomFootstep(this.footstep)
  }
}
