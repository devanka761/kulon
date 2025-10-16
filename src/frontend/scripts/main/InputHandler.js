const directions = {
  up: "w",
  down: "s",
  left: "a",
  right: "d"
}

export class InputHandler {
  constructor() {
    this.keys = { w: false, s: false, a: false, d: false }
    this.startWalkHandler = null
    this.stopWalkHandler = null
  }
  movePad(direction) {
    const ekey = directions[direction]
    if (ekey) this.keys[ekey] = true
  }
  releasePad(direction) {
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
        this.keys[e.key.toLowerCase()] = true
      }
    }
    window.addEventListener("keydown", this.startWalkHandler)
    this.stopWalkHandler = (e) => {
      if (!e.key) return
      if (Object.prototype.hasOwnProperty.call(this.keys, e.key.toLowerCase())) {
        this.keys[e.key.toLowerCase()] = false
      }
    }
    window.addEventListener("keyup", this.stopWalkHandler)
  }
}
