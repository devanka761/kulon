import asset from "../data/assets"
import audio from "../lib/AudioHandler"
import { eroot, kel } from "../lib/kel"
import waittime from "../lib/waittime"

export default class JumpScare {
  private onComplete: () => void
  private spriteInterval: ReturnType<typeof setInterval> | null = null
  private readonly grid = 64
  private frames = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1]
  ]
  private frame: number = 0

  private el: HTMLDivElement = kel("div", "jumpscare")
  private canvas: HTMLCanvasElement = kel("canvas", "icon")
  private ctx: CanvasRenderingContext2D

  private size: number

  constructor(config: { onComplete: () => void }) {
    this.onComplete = config.onComplete

    this.size = (window.innerWidth >= window.innerHeight ? window.innerWidth : window.innerHeight) / 2
    this.canvas.width = this.size
    this.canvas.height = this.size

    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
    this.ctx.imageSmoothingEnabled = false

    this.el.append(this.canvas)
  }
  get _spriteImage(): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = asset["LostSpirit"].src
    })
  }
  private async _createElement(): Promise<void> {
    const sprite = await this._spriteImage

    this.spriteInterval = setInterval(() => this._draw(sprite), 100)

    eroot().append(this.el)
  }
  private async _startJumpScare(): Promise<void> {
    this.el.classList.add("animate")
    await waittime(400)
    audio.emit({ action: "play", type: "sfx", src: "ghost", options: { volume: 1 } })
    await waittime(1500)
    this.destroy()
  }
  private _draw(img: HTMLImageElement): void {
    const [x, y] = this.frames[this.frame]
    this.frame++
    if (this.frame >= this.frames.length) this.frame = 0
    this.ctx.clearRect(0, 0, this.size, this.size)
    this.ctx.drawImage(img, x * this.grid, y * this.grid, this.grid, this.grid, 0, 0, this.size, this.size)
  }

  destroy(): void {
    if (this.spriteInterval) clearInterval(this.spriteInterval)
    this.canvas.remove()
    this.el.remove()
    this.onComplete()
  }
  init() {
    this._createElement()
    this._startJumpScare()
  }
}
