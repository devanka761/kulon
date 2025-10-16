import asset from "../data/assets"
import SaveList from "../data/SaveList"

const TILE_SIZE = 16

export class Interactable {
  constructor(config) {
    this.x = config.x || 0
    this.y = config.y || 0
    this.talk = config.talk
    this.states = config.states
    this.isLoaded = false

    this.image = new Image()
    this.image.onload = () => {
      this.isLoaded = true
      this.offArea = [this.image.width / (config.offset?.[0] || 1), this.image.height / ((config.offset?.[1] || 0) + 1)]
      this.offCentre = [this.offArea[0] / 2 - 8, this.offArea[1] - 16 * 2]
    }
    this.image.src = asset[config.src].src

    this.offArea = [this.image.width / (config.offset?.[0] || 1), this.image.height / ((config.offset?.[1] || 0) + 1)]
    this.offCentre = [this.offArea[0] / 2 - 8, this.offArea[1] - 16 * 2]

    this.animationFrames = {
      unused: { start: 0, end: (config.offset?.[0] || 1) - 1, row: 0 },
      used: { start: 0, end: (config.offset?.[0] || 1) - 1, row: 1 }
    }
    this.animationInterval = 0.14
    this.frameTimer = 0
    this.currentAnimationName = "unused"

    this.frameX = 0
    this.frameY = this.animationFrames[this.currentAnimationName].row

    this.collisionBox = {
      xOffset: 0,
      yOffset: 0,
      width: TILE_SIZE,
      height: TILE_SIZE
    }
  }

  update(deltaTime) {
    this.checkAnimationState()
    this.animate(deltaTime)
  }

  checkAnimationState() {
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

  animate(deltaTime) {
    this.frameTimer += deltaTime
    const currentAnimation = this.animationFrames[this.currentAnimationName]
    const interval = currentAnimation.interval || this.animationInterval

    this.frameY = currentAnimation.row
    if (this.frameTimer >= interval) {
      this.frameTimer = 0
      this.frameX++
      if (this.frameX > currentAnimation.end) {
        this.frameX = currentAnimation.start
      }
    }
  }

  draw(ctx) {
    if (!this.isLoaded) return

    const areaX = this.offArea[0]
    const areaY = this.offArea[1]
    const offsetX = this.offCentre[0]
    const offsetY = this.offCentre[1] + TILE_SIZE

    if (this.image) {
      ctx.drawImage(this.image, areaX * this.frameX, areaY * this.frameY, areaX, areaY, Math.round(this.x - offsetX), Math.round(this.y - offsetY), areaX, areaY)
    }
  }

  facePlayer() {}
}
