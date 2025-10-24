import { ISival } from "../types/lib.types"

type IAnyFunc = (ev?: ISival) => void

export class KeyPressListener {
  private keydownFunction: IAnyFunc
  private keyupFunction: IAnyFunc
  constructor(keyCode: string, callback: IAnyFunc) {
    let keySafe = true
    this.keydownFunction = function (event: KeyboardEvent) {
      if (event.key?.toLowerCase() === keyCode || event.code?.toLowerCase() === keyCode) {
        if (keySafe) {
          keySafe = false
          callback()
        }
      }
    }
    this.keyupFunction = function (event: KeyboardEvent) {
      if (event.key?.toLowerCase() === keyCode || event.code?.toLowerCase() === keyCode) {
        keySafe = true
      }
    }
    window.addEventListener("keydown", this.keydownFunction)
    window.addEventListener("keyup", this.keyupFunction)
  }

  unbind(): void {
    window.removeEventListener("keydown", this.keydownFunction)
    window.removeEventListener("keyup", this.keyupFunction)
  }
}
