import { kel } from "../../lib/kel"

export default class Participant {
  private took: number = 0
  private el: HTMLDivElement = kel("div", "player")
  private name: HTMLSpanElement = kel("span", "name")
  private egg: HTMLSpanElement = kel("span", "egg")
  constructor(
    readonly id: string,
    username: string
  ) {
    this.name.innerHTML = username
    this.updateEgg()
    this.el.append(this.name, this.egg)
  }
  get eggs(): number {
    return this.took
  }
  updateEgg(): void {
    this.egg.innerHTML = this.took.toString()
  }
  addEgg(count: number = 1): void {
    this.took += count
    this.updateEgg()
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(): void {
    this.name.remove()
    this.egg.remove()
    this.el.remove()
  }
}
