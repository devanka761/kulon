import { eroot, kel } from "../lib/kel"

interface IKulonUIButtonConfig {
  name: "phone" | "chat" | "gamepad"
  className: string
  keyboard?: string
}

class KulonUIButton {
  private el!: HTMLButtonElement
  private name: "phone" | "chat" | "gamepad"
  private className: string
  private keyboard?: string
  private isDisabled: boolean = false
  constructor(config: IKulonUIButtonConfig) {
    this.name = config.name
    this.className = config.className
    this.keyboard = config.keyboard
    this._init()
  }
  private _createElement() {
    this.el = kel("button", `kui kui-${this.name}`)
    const eicon = kel("i", this.className)
    this.el.append(eicon)
    if (this.keyboard) {
      const ekeyboard = kel("span", "keyboard")
      ekeyboard.innerText = this.keyboard
      this.el.append(ekeyboard)
    }
  }
  get disabled(): boolean {
    return this.isDisabled
  }
  disable(): void {
    this.el.disabled = true
    this.isDisabled = true
  }
  enable(): void {
    this.el.disabled = false
    this.isDisabled = false
  }
  onClick(fn: () => void): void {
    this.el.onclick = null

    this.el.onclick = () => {
      if (this.isDisabled) return
      fn()
    }
  }
  get html(): typeof this.el {
    return this.el
  }
  destroy(): void {
    this.el.onclick = null
    this.isDisabled = false
    this.el.remove()
  }
  private _init(): void {
    this._createElement()
  }
}

export default class KulonUI {
  private el: HTMLDivElement = kel("div", "KulonUI")
  phone!: KulonUIButton
  chat!: KulonUIButton
  gamepad!: KulonUIButton
  private _createButtons(): void {
    this.phone = new KulonUIButton({
      name: "phone",
      className: "fa-etch fa-solid fa-mobile",
      keyboard: "esc"
    })

    this.chat = new KulonUIButton({
      name: "chat",
      className: "fa-jelly-fill fa-regular fa-comment-dots",
      keyboard: "t"
    })
    this.gamepad = new KulonUIButton({
      name: "gamepad",
      className: "fa-jelly-fill fa-regular fa-gamepad"
    })

    this.el.append(this.phone.html, this.chat.html, this.gamepad.html)
    eroot().append(this.el)
  }
  restore() {
    this.el.append(this.phone.html, this.chat.html, this.gamepad.html)
  }
  hide(): void {
    this.el.classList.add("hide")
  }
  show(): void {
    this.el.classList.remove("hide")
  }
  destroy(): void {
    this.phone.destroy()
    this.chat.destroy()
    this.gamepad.destroy()
    this.el.remove()
  }
  init(): void {
    this._createButtons()
  }
}
