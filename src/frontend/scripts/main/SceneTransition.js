import { kel } from "../lib/kel"

export default class SceneTransition {
  constructor() {
    this.el = null
  }
  createElement() {
    this.el = kel("div", "SceneTransition")
  }

  fadeOut() {
    this.el.classList.add("fade-out")
    this.el.addEventListener(
      "animationend",
      () => {
        this.el.remove()
      },
      { once: true }
    )
  }

  init(container, callback) {
    this.createElement()
    container.appendChild(this.el)

    this.el.addEventListener(
      "animationend",
      () => {
        callback()
      },
      { once: true }
    )
  }
}
