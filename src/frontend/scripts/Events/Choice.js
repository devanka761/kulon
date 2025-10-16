import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"

export default class Choices {
  constructor({ options, text, who, onComplete }) {
    this.onComplete = onComplete
    this.options = options
    this.who = who
    this.text = text
    this.choiceElements = []
    this.keyHandler = this._handleKeyDown.bind(this)
  }
  createElement() {
    this.el = kel("div", "TextMessage v2")
    this.el.innerHTML = `
    <div class="TextMessage_box">
      <div class="choices">
      </div>
      ${this.who ? '<div class="who"><p>' + this.who + "</p></div>" : ""}
      <p class="TextMessage_p">${this.text[LocalList.lang]}</p>
      <div class="TextMessage_actions">
        <span class="keyinfo">enter</span>
        <button class="TextMessage_button">Next</button>
      </div>
    </div>`
    this.eChoices = qutor(".choices", this.el)
  }
  choiceListener() {
    this.options.forEach((opt) => {
      const eChoice = kel("button", "choice")
      eChoice.role = "button"
      eChoice.innerHTML = opt.text[LocalList.lang]
      eChoice.onmouseover = () => {
        eChoice.focus()
      }

      this.eChoices.appendChild(eChoice)
      this.choiceElements.push(eChoice)
      eChoice.onclick = () => {
        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
        if (opt.cancel) this.destroy(null)
        else this.destroy("LANJUT")
      }
    })

    if (this.choiceElements.length > 0) {
      setTimeout(() => {
        this.choiceElements[0].focus()
        document.addEventListener("keydown", this.keyHandler)
      }, 300)
    }
  }

  _handleKeyDown(e) {
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

  destroy(condition) {
    document.removeEventListener("keydown", this.keyHandler)
    this.el.remove()
    this.onComplete(condition)
  }
  run() {
    this.createElement()
    eroot().appendChild(this.el)
    this.choiceListener()
  }
}
