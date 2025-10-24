import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ILocale } from "../types/lib.types"
import { IChoiceOption } from "../types/maps.types"

interface IChoiceConfig extends IPMCConfig {
  text: ILocale
  who?: string
  options: IChoiceOption[]
}

export default class Choices implements IPMC {
  id: string = "choice"
  private text: ILocale
  private who?: string
  private options: IChoiceOption[]
  isLocked: boolean = false
  onComplete: (val?: boolean) => void

  private el!: HTMLDivElement
  private eChoices!: HTMLDivElement

  private choiceElements: HTMLButtonElement[] = []
  private keyHandler: (e: KeyboardEvent) => void

  constructor(config: IChoiceConfig) {
    this.onComplete = config.onComplete
    this.options = config.options
    this.who = config.who
    this.text = config.text
    this.keyHandler = this._handleKeyDown.bind(this)
  }
  private createElement(): void {
    this.el = kel("div", "TextMessage v2")
    this.el.innerHTML = `
    <div class="TextMessage_box">
      <div class="choices">
      </div>
      ${this.who ? '<div class="who"><p>' + this.who + "</p></div>" : ""}
      <p class="TextMessage_p">${this.text[LocalList.lang!]}</p>
      <div class="TextMessage_actions">
        <span class="keyinfo">enter</span>
        <button class="TextMessage_button">Next</button>
      </div>
    </div>`
    this.eChoices = qutor(".choices", this.el) as HTMLDivElement
  }
  private choiceListener(): void {
    this.options.forEach((opt) => {
      const eChoice = kel("button", "choice")
      eChoice.role = "button"
      eChoice.innerHTML = opt.text[LocalList.lang!]
      eChoice.onmouseover = () => {
        eChoice.focus()
      }

      this.eChoices.appendChild(eChoice)
      this.choiceElements.push(eChoice)
      eChoice.onclick = () => {
        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
        if (opt.cancel) this.destroy()
        else this.destroy(true)
      }
    })

    if (this.choiceElements.length > 0) {
      setTimeout(() => {
        this.choiceElements[0].focus()
        document.addEventListener("keydown", this.keyHandler)
      }, 300)
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
      return
    }
    e.preventDefault()

    const currentFocused = document.activeElement
    const currentIndex = this.choiceElements.findIndex((btn) => btn === currentFocused)

    if (currentIndex === -1) {
      this.choiceElements[0].focus()
      return
    }

    let nextIndex
    if (e.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % this.choiceElements.length
    } else {
      nextIndex = (currentIndex - 1 + this.choiceElements.length) % this.choiceElements.length
    }

    audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
    this.choiceElements[nextIndex].focus()
  }

  destroy(condition?: boolean): void {
    document.removeEventListener("keydown", this.keyHandler)
    this.el.remove()
    this.onComplete(!!condition)
  }
  init(): void {
    this.createElement()
    eroot().appendChild(this.el)
    this.choiceListener()
  }
}
