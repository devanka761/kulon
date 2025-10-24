import RevealingText from "../main/RevealingText"
import { KeyPressListener } from "../main/KeyPressListener"
import LocalList from "../data/LocalList"
import { eroot, futor, kel, qutor } from "../lib/kel"
import { IPMCConfig } from "../types/db.types"
import { ILocale } from "../types/lib.types"

interface ITextMessageConfig extends IPMCConfig {
  text: ILocale
  who?: string
}

export default class TextMessage {
  id: string = "appearance"
  onComplete: () => void
  private text: ILocale
  private who?: string

  private el!: HTMLDivElement
  protected revealingText!: RevealingText

  private actionListener?: KeyPressListener

  constructor(config: ITextMessageConfig) {
    this.text = config.text
    this.who = config.who
    this.onComplete = config.onComplete
    this.actionListener = undefined
  }

  private createElement(): void {
    this.el = kel("div", "TextMessage")

    this.el.innerHTML = `
    <div class="TextMessage_box">
      ${this.who ? '<div class="who"><p>' + this.who + "</p></div>" : ""}
      <p class="TextMessage_p"></p>
      <div class="TextMessage_actions">
        <span class="keyinfo">enter</span>
        <button class="TextMessage_button">Next</button>
      </div>
    </div>`

    this.revealingText = new RevealingText({
      element: qutor(".TextMessage_p", this.el) as HTMLParagraphElement,
      text: this.text[LocalList.lang!]
    })

    futor("button", this.el).addEventListener("click", () => {
      this.done()
    })

    this.actionListener = new KeyPressListener("enter", () => {
      this.done()
    })
  }

  done(): void {
    if (this.revealingText.isDone) {
      this.el.remove()
      this.actionListener?.unbind()
      this.onComplete()
    } else {
      this.revealingText.warpToDone()
    }
  }

  init(): void {
    this.createElement()
    eroot().appendChild(this.el)
    this.revealingText.init()
  }
}
