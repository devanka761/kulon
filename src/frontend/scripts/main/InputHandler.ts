type IDirection = "up" | "down" | "left" | "right"
type IArrow = "w" | "s" | "a" | "d"

type IKeyPress = {
  [key in IDirection]: IArrow
}
export type IKeyHold = {
  [key in IArrow]: boolean
}

const directions: IKeyPress = {
  up: "w",
  down: "s",
  left: "a",
  right: "d"
}

export class InputHandler {
  keys: IKeyHold = { w: false, s: false, a: false, d: false }
  private startWalkHandler!: (ev: KeyboardEvent) => void
  private stopWalkHandler!: (ev: KeyboardEvent) => void
  constructor() {}
  movePad(direction: IDirection) {
    const ekey = directions[direction]
    if (ekey) this.keys[ekey] = true
  }
  releasePad(direction: IDirection) {
    const ekey = directions[direction]
    if (ekey) this.keys[ekey] = false
  }
  destroy() {
    window.removeEventListener("keydown", this.startWalkHandler)
    window.removeEventListener("keyup", this.stopWalkHandler)
  }
  init() {
    this.startWalkHandler = (e) => {
      if (!e.key) return
      if (Object.prototype.hasOwnProperty.call(this.keys, e.key.toLowerCase())) {
        this.keys[e.key.toLowerCase() as IArrow] = true
      }
    }
    window.addEventListener("keydown", this.startWalkHandler)
    this.stopWalkHandler = (e) => {
      if (!e.key) return
      if (Object.prototype.hasOwnProperty.call(this.keys, e.key.toLowerCase())) {
        this.keys[e.key.toLowerCase() as IArrow] = false
      }
    }
    window.addEventListener("keyup", this.stopWalkHandler)
  }
}
