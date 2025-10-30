import { kel } from "../lib/kel"

export default class SceneTransition {
  private el: HTMLDivElement = kel("div", "SceneTransition")
  fadeOut(): void {
    this.el.classList.add("fade-out")
    this.el.addEventListener(
      "animationend",
      () => {
        this.el.remove()
      },
      { once: true }
    )
  }

  init(container: HTMLDivElement, callback: () => void): void {
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
