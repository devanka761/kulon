import { kel } from "../../lib/kel"
import sdate from "../../lib/sdate"
import Xoxo from "./Xoxo"

export default class Participant {
  private timeout: number = 300000
  private el: HTMLDivElement = kel("div", "player")
  private time: HTMLDivElement = kel("div", "time")
  private name: HTMLDivElement = kel("div", "name")

  private timeOutInterval?: ReturnType<typeof setInterval>
  constructor(
    readonly id: string,
    username: string,
    private xoxo: Xoxo
  ) {
    this.name.innerHTML = username
    this.el.append(this.time, this.name)
    this.updateTime()
  }
  updateTime(): void {
    this.time.innerHTML = sdate.remain(Date.now() + this.timeout, true) || "0"
  }
  get html(): HTMLDivElement {
    return this.el
  }
  resumeTime(): void {
    if (this.timeOutInterval) return
    this.el.classList.add("active")
    this.timeOutInterval = setInterval(() => {
      this.timeout -= 500
      this.updateTime()
      if (this.timeout <= 1) {
        this.xoxo.onTimeOut(this.id)
        this.destroy()
      }
    }, 500)
  }
  pauseTime(): void {
    if (!this.timeOutInterval) return
    this.el.classList.remove("active")
    clearInterval(this.timeOutInterval)
    this.timeOutInterval = undefined
  }
  syncTimeTo(newTimeOut: number): void {
    this.timeout = newTimeOut
  }
  getTime(): number {
    return this.timeout
  }
  destroy(): void {
    this.pauseTime()
    this.name.remove()
    this.time.remove()
    this.el.remove()
  }
}
