import LocalList from "../data/LocalList"
import { eroot, kel } from "../lib/kel"
import localSave from "../manager/storage"

interface IBasePosition {
  x: number
  y: number
}
interface IStickPosition {
  x: number
  y: number
}
interface ILastState {
  x: number
  y: number
}

type TouchCallBack = (direction: DirectionType) => void

type DirectionType = "up" | "down" | "left" | "right"

export default class KulonPad {
  private el: HTMLDivElement = kel("div", "KulonInteract")
  private canvas: HTMLCanvasElement = kel("canvas", "KulonPad")
  private ctx: CanvasRenderingContext2D = this.canvas.getContext("2d") as CanvasRenderingContext2D

  private onMove?: TouchCallBack
  private onRelease?: TouchCallBack

  private size: number = 75
  private radius: number = this.size / 2
  private stickRadius: number = this.radius / 2.5

  private isActive: boolean = false
  private basePosition: IBasePosition = { x: 0, y: 0 }
  private stickPosition: IStickPosition = { x: 0, y: 0 }
  private lastFiredState: ILastState = { x: 0, y: 0 }

  private animationFrameId: number | null = null

  private boundResizeHandler: () => void
  private boundHandleDown: (event: PointerEvent) => void
  private boundHandleMove: (event: PointerEvent) => void
  private boundHandleUp: () => void

  constructor(initialSize?: number) {
    if (initialSize) this.size = Math.max(initialSize, 75)

    this.boundResizeHandler = this._onResize.bind(this)
    this.boundHandleDown = this._handleDown.bind(this)
    this.boundHandleMove = this._handleMove.bind(this)
    this.boundHandleUp = this._handleUp.bind(this)

    this._init()
  }

  private _createElement(): void {
    eroot().append(this.canvas, this.el)
  }
  private _setupCanvas(): void {
    this.radius = this.size / 2
    this.stickRadius = this.radius / 2.5
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  private _calculatePositions(): void {
    const padding_left = LocalList.kulonpad_x as number
    const padding_bottom = LocalList.kulonpad_y as number
    this.basePosition = {
      x: this.radius + padding_left,
      y: this.canvas.height - this.radius - padding_bottom
    }

    this.stickPosition = { ...this.basePosition }
  }

  private _onResize(): void {
    this._setupCanvas()
    this._calculatePositions()
    this._draw()
  }

  private _bindEvents(): void {
    window.addEventListener("resize", this.boundResizeHandler)

    this.canvas.addEventListener("pointerdown", this.boundHandleDown)
    this.canvas.addEventListener("pointermove", this.boundHandleMove)
    this.canvas.addEventListener("pointerup", this.boundHandleUp)
    this.canvas.addEventListener("pointerleave", this.boundHandleUp)
  }

  private _getEventPosition(event: PointerEvent): IStickPosition | null {
    if ("clientX" in event && event.clientX && event.clientY) {
      return { x: event.clientX, y: event.clientY }
    }

    return null
  }

  private _handleDown(event: PointerEvent): void {
    event.preventDefault()
    const pos = this._getEventPosition(event)
    if (!pos) return

    const dx = pos.x - this.basePosition.x
    const dy = pos.y - this.basePosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= this.radius) {
      this.isActive = true
      if (!this.animationFrameId) {
        this._startAnimationLoop()
      }
    }
  }

  private _handleMove(event: PointerEvent): void {
    if (!this.isActive) return

    event.preventDefault()
    const pos = this._getEventPosition(event)
    if (!pos) return

    const dx = pos.x - this.basePosition.x
    const dy = pos.y - this.basePosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > this.radius - this.stickRadius) {
      const angle = Math.atan2(dy, dx)
      this.stickPosition.x = this.basePosition.x + Math.cos(angle) * (this.radius - this.stickRadius)
      this.stickPosition.y = this.basePosition.y + Math.sin(angle) * (this.radius - this.stickRadius)
    } else {
      this.stickPosition.x = pos.x
      this.stickPosition.y = pos.y
    }

    this._updateAndFireState()
  }

  private _handleUp(): void {
    if (!this.isActive) return

    this.isActive = false
    this.stickPosition = { ...this.basePosition }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this._clear()
    this._draw()

    this._updateAndFireState()
  }

  private _updateAndFireState(): void {
    if (!this.onMove || !this.onRelease) return

    const dx = this.stickPosition.x - this.basePosition.x
    const dy = this.stickPosition.y - this.basePosition.y

    const threshold = this.radius * 0.2

    const currentState = { x: 0, y: 0 }

    if (Math.abs(dx) > threshold) {
      currentState.x = Math.sign(dx)
    }

    if (Math.abs(dy) > threshold) {
      currentState.y = Math.sign(dy) * -1
    }

    if (currentState.x !== this.lastFiredState.x) {
      if (currentState.x === 1) {
        this.onMove("right")
      } else if (currentState.x === -1) {
        this.onMove("left")
      } else if (this.lastFiredState.x === 1) {
        this.onRelease("right")
      } else if (this.lastFiredState.x === -1) {
        this.onRelease("left")
      }
      this.lastFiredState.x = currentState.x
    }
    if (currentState.y !== this.lastFiredState.y) {
      if (currentState.y === 1) {
        this.onMove("up")
      } else if (currentState.y === -1) {
        this.onMove("down")
      } else if (this.lastFiredState.y === 1) {
        this.onRelease("up")
      } else if (this.lastFiredState.y === -1) {
        this.onRelease("down")
      }
      this.lastFiredState.y = currentState.y
    }
  }

  updateAnalog(): void {
    this._clear()
    this._setupCanvas()
    this._calculatePositions()
    this._draw()
  }
  updateInteract(): void {
    this.el.style.bottom = (LocalList["kulonbutton_y"] || 100) + "px"
    this.el.style.right = (LocalList["kulonbutton_x"] || 100) + "px"
  }
  private _draw(): void {
    this.ctx.beginPath()
    this.ctx.arc(this.basePosition.x, this.basePosition.y, this.radius, 0, Math.PI * 2)
    this.ctx.fillStyle = "#18223690"
    this.ctx.fill()

    this.ctx.beginPath()
    const waveAmplitude = this.stickRadius * 0.05
    const waveLength = 8

    for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 64) {
      const r = this.stickRadius + waveAmplitude * Math.sin(angle * waveLength)

      const x = this.stickPosition.x + r * Math.cos(angle)
      const y = this.stickPosition.y + r * Math.sin(angle)

      if (angle === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }
    this.ctx.closePath()

    this.ctx.fillStyle = "#a395e8"
    this.ctx.fill()
  }

  private _clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
  setOnMove(fn: TouchCallBack): void {
    this.onMove = fn
  }
  setOnRelease(fn: TouchCallBack): void {
    this.onRelease = fn
  }
  setOnInteract(fn: () => void): void {
    this.el.onpointerdown = null
    this.el.onpointerdown = () => fn()
  }
  hide(): void {
    this.canvas.classList.add("hide")
    this.el.classList.add("hide")
  }
  show(): void {
    this.canvas.classList.remove("hide")
    this.el.classList.remove("hide")
  }
  setEnable(): void {
    if (LocalList["kulonpad_disabled"]) {
      this.canvas.classList.add("disabled")
      this.el.classList.add("disabled")
      return
    }
    this.canvas.classList.remove("disabled")
    this.el.classList.remove("disabled")
  }
  toggle(): void {
    LocalList["kulonpad_disabled"] = !LocalList["kulonpad_disabled"]
    if (!LocalList["kulonpad_disabled"]) delete LocalList["kulonpad_disabled"]
    localSave.save()
    this.setEnable()
  }

  private _startAnimationLoop(): void {
    this._clear()
    this._draw()
    this.animationFrameId = requestAnimationFrame(this._startAnimationLoop.bind(this))
  }
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    window.removeEventListener("resize", this.boundResizeHandler)
    this.canvas.removeEventListener("pointerdown", this.boundHandleDown)
    this.canvas.removeEventListener("pointermove", this.boundHandleMove)
    this.canvas.removeEventListener("pointerup", this.boundHandleUp)
    this.canvas.removeEventListener("pointerleave", this.boundHandleUp)
    this.el.onpointerdown = null

    this.canvas.remove()
    this.el.remove()
    this.onMove = undefined
    this.onRelease = undefined
  }
  private _init(): void {
    this._createElement()
    this._setupCanvas()
    this._calculatePositions()
    this._bindEvents()
    this._draw()
    this.updateInteract()
    this.setEnable()
  }
}
