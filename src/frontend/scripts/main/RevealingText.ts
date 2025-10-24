import audio from "../lib/AudioHandler"
import { kel } from "../lib/kel"

interface IConfig {
  element: HTMLParagraphElement
  text: string
  speed?: number
}

interface ICharacters {
  span: HTMLSpanElement
  delayAfter: number
}

export default class RevealingText {
  private el: HTMLParagraphElement
  private text: string
  private speed: number
  private revealId: string | null = null
  private timeout: ReturnType<typeof setTimeout> | null = null
  isDone: boolean = false
  constructor(config: IConfig) {
    this.el = config.element
    this.text = config.text
    this.speed = config.speed || 30
  }

  revealOneCharacter(list: ICharacters[]): void {
    const next = list.splice(0, 1)[0]
    next.span.classList.add("revealed")

    if (list.length > 0) {
      this.timeout = setTimeout(() => {
        this.revealOneCharacter(list)
      }, next.delayAfter)
    } else {
      audio.emit({ action: "stop", type: "ui", id: this.revealId! })
      audio.emit({
        action: "play",
        type: "ui",
        src: "dialogue_end",
        options: { id: Date.now().toString() }
      })
      this.isDone = true
    }
  }

  warpToDone(): void {
    clearTimeout(this.timeout!)
    audio.emit({ action: "stop", type: "ui", id: this.revealId! })
    audio.emit({
      action: "play",
      type: "ui",
      src: "dialogue_end",
      options: { id: Date.now().toString() }
    })
    this.isDone = true
    this.el.querySelectorAll("span").forEach((s) => {
      s.classList.add("revealed")
    })
  }

  init(): void {
    const characters: ICharacters[] = []
    this.text.split("").forEach((character) => {
      const span = kel("span")
      span.textContent = character
      this.el.appendChild(span)

      characters.push({
        span,
        delayAfter: character === " " ? 0 : this.speed
      })
    })
    this.revealId = Date.now().toString()
    this.revealOneCharacter(characters)
    audio.emit({
      action: "play",
      type: "ui",
      src: "dialogue_revealing",
      options: { id: this.revealId }
    })
  }
}
