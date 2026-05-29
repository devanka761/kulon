import asset from "../data/assets"
import { Game } from "../main/Game"

interface ILeaf {
  x: number
  y: number
  speedX: number
  speedY: number
  row: number
  frameX: number
  frameTimer: number
}

export class Wind {
  leaves: ILeaf[] = []
  game!: Game
  image: HTMLImageElement | null = null
  isLoaded: boolean = false
  animInterval: number = 0.13

  constructor() {}

  init(game: Game): void {
    this.game = game
    const imageSrc = asset["weatherWind"].src
    this.image = new Image()
    this.image.src = imageSrc
    this.image.onload = () => {
      this.isLoaded = true
    }

    for (let i = 0; i < 14; i++) {
      this.leaves.push(this.createLeaf(true))
    }
  }

  createLeaf(randomizeY = false): ILeaf {
    const canvasWidth = this.game.canvas.width || 400
    const canvasHeight = this.game.canvas.height || 300
    const camX = this.game.camera ? this.game.camera.x : 0
    const camY = this.game.camera ? this.game.camera.y : 0

    return {
      x: camX + Math.random() * (canvasWidth + 200) - 50,
      y: camY + (randomizeY ? Math.random() * canvasHeight : -20),
      speedX: -(Math.random() * 20 + 10),
      speedY: Math.random() * 20 + 10,
      row: Math.floor(Math.random() * 2),
      frameX: Math.floor(Math.random() * 11),
      frameTimer: 0
    }
  }

  update(deltaTime: number): void {
    if (!this.game || !this.game.camera) return
    const canvasWidth = this.game.canvas.width || 400
    const canvasHeight = this.game.canvas.height || 300
    const camX = this.game.camera.x
    const camY = this.game.camera.y

    this.leaves.forEach((leaf) => {
      leaf.x += leaf.speedX * deltaTime
      leaf.y += leaf.speedY * deltaTime

      leaf.frameTimer += deltaTime
      if (leaf.frameTimer >= this.animInterval) {
        leaf.frameTimer = 0
        leaf.frameX = (leaf.frameX + 1) % 11
      }

      if (leaf.x < camX - 50) {
        leaf.x = camX + canvasWidth + 50
        leaf.y = camY + Math.random() * canvasHeight
      } else if (leaf.x > camX + canvasWidth + 100) {
        leaf.x = camX - 30
        leaf.y = camY + Math.random() * canvasHeight
      }

      if (leaf.y > camY + canvasHeight + 50) {
        leaf.y = camY - 30
        leaf.x = camX + Math.random() * canvasWidth
      } else if (leaf.y < camY - 50) {
        leaf.y = camY + canvasHeight + 30
        leaf.x = camX + Math.random() * canvasWidth
      }
    })
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded || !this.image) return

    this.leaves.forEach((leaf) => {
      ctx.drawImage(this.image!, leaf.frameX * 16, leaf.row * 16, 16, 16, Math.round(leaf.x), Math.round(leaf.y), 16, 16)
    })
  }
}
