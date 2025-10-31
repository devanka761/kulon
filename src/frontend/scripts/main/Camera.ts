import { Player } from "./Player"

export class Camera {
  x: number
  y: number
  mapWidth: number
  mapHeight: number
  constructor(
    private canvas: HTMLCanvasElement,
    mapWidth: number,
    mapHeight: number
  ) {
    // this.canvas = canvas
    this.x = 0
    this.y = 0
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
  }

  update(player: Player) {
    const focusPointX = player.x + player.width / 2
    const focusPointY = player.y + player.height / 2 + 8

    this.x = focusPointX - this.canvas.width / 2
    this.y = focusPointY - this.canvas.height / 2

    this.x = Math.max(0, Math.min(this.mapWidth - this.canvas.width, this.x))
    this.y = Math.max(0, Math.min(this.mapHeight - this.canvas.height, this.y))
  }

  apply(ctx: CanvasRenderingContext2D) {
    ctx.translate(Math.round(-this.x), Math.round(-this.y))
  }
}
