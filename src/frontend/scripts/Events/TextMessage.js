import RevealingText from "../main/RevealingText"
import { KeyPressListener } from "../main/KeyPressListener"
import LocalList from "../data/LocalList"
import { kel, qutor } from "../lib/kel"

export default class TextMessage {
  constructor({ text, who, onComplete }) {
    this.text = text
    this.who = who
    this.onComplete = onComplete
    this.el = null
    this.actionListener = null
  }

  createElement() {
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
      element: qutor(".TextMessage_p", this.el),
      text: this.text[LocalList.lang]
    })

    qutor("button", this.el).addEventListener("click", () => {
      this.done()
    })

    this.actionListener = new KeyPressListener("enter", () => {
      this.done()
    })
  }

  done() {
    if (this.revealingText.isDone) {
      this.el.remove()
      this.actionListener.unbind()
      this.onComplete()
    } else {
      this.revealingText.warpToDone()
    }
  }

  init(container) {
    this.createElement()
    container.appendChild(this.el)
    this.revealingText.init()
  }
}
