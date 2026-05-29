import asset from "../data/assets"
import { Game } from "../main/Game"

interface ICloud {
  x: number
  y: number
  speedX: number
  speedY: number
}

export class Cloud {
  game!: Game
  image: HTMLImageElement | null = null
  isLoaded: boolean = false
  clouds: ICloud[] = []

  constructor() {}

  init(game: Game): void {
    this.game = game
    const imageSrc = asset["weatherCloud"].src
    this.image = new Image()
    this.image.src = imageSrc
    this.image.onload = () => {
      this.isLoaded = true
    }

    for (let i = 0; i < 4; i++) {
      this.clouds.push(this.createCloud(true))
    }
  }

  createCloud(randomizeX = false): ICloud {
    const canvasWidth = this.game.canvas.width || 400
    const canvasHeight = this.game.canvas.height || 300
    const camX = this.game.camera ? this.game.camera.x : 0
    const camY = this.game.camera ? this.game.camera.y : 0

    return {
      x: camX + (randomizeX ? Math.random() * (canvasWidth * 4) - canvasWidth : -(Math.random() * 50 + 150)),
      y: camY + Math.random() * canvasHeight,
      speedX: Math.random() * 10 + 5,
      speedY: -(Math.random() * 2 + 1)
    }
  }

  update(deltaTime: number): void {
    if (!this.game || !this.game.camera) return
    const canvasWidth = this.game.canvas.width || 400
    const canvasHeight = this.game.canvas.height || 300
    const camX = this.game.camera.x
    const camY = this.game.camera.y

    this.clouds.forEach((cloud) => {
      cloud.x += cloud.speedX * deltaTime
      cloud.y += cloud.speedY * deltaTime

      if (cloud.x > camX + canvasWidth + 150) {
        cloud.x = camX - 150 - Math.random() * 100
        cloud.y = camY + Math.random() * (canvasHeight * 0.6)
      } else if (cloud.x < camX - 250) {
        cloud.x = camX + canvasWidth + 100
        cloud.y = camY + Math.random() * (canvasHeight * 0.6)
      }

      if (cloud.y < camY - 150) {
        cloud.y = camY + canvasHeight + 50
        cloud.x = camX + Math.random() * canvasWidth
      } else if (cloud.y > camY + canvasHeight + 150) {
        cloud.y = camY - 100
        cloud.x = camX + Math.random() * canvasWidth
      }
    })
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded || !this.image) return

    this.clouds.forEach((cloud) => {
      ctx.save()
      ctx.drawImage(this.image!, Math.round(cloud.x), Math.round(cloud.y), 144, 96)
      ctx.restore()
    })
  }
}
