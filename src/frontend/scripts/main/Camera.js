export class Camera {
  constructor(canvas, mapWidth, mapHeight) {
    this.canvas = canvas
    this.x = 0
    this.y = 0
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
  }

  update(player) {
    const focusPointX = player.x + player.width / 2
    const focusPointY = player.y + player.height / 2 + 8

    this.x = focusPointX - this.canvas.width / 2
    this.y = focusPointY - this.canvas.height / 2

    this.x = Math.max(0, Math.min(this.mapWidth - this.canvas.width, this.x))
    this.y = Math.max(0, Math.min(this.mapHeight - this.canvas.height, this.y))
  }

  apply(ctx) {
    ctx.translate(-this.x, -this.y)
  }
}
