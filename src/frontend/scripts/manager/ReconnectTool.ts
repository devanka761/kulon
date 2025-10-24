import { IRepB } from "../types/lib.types"
import packageVersion from "../../../config/version.json"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, kel } from "../lib/kel"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"

export default class ReconnectTool {
  private attemp: number = 0
  private el: HTMLDivElement = kel("div")
  private icon: HTMLDivElement = kel("div", "icon")
  private title: HTMLDivElement = kel("div", "title")
  private createElement(): void {
    const box = kel("div", "box")
    this.updateStatus(0)
    box.append(this.icon, this.title)
    this.el.append(box)
  }
  private updateStatus(status: 0 | 1 | 2): void {
    if (status === 0) {
      this.el.className = "ReconnectTool disconnected"
      this.icon.innerHTML = `<i class="fa-solid fa-plug-circle-xmark"></i>`
      this.title.innerHTML = lang.DISCONNECTED
    } else if (status === 1) {
      this.el.className = "ReconnectTool connected"
      this.icon.innerHTML = `<i class="fa-solid fa-plug-circle-check"></i>`
      this.title.innerHTML = lang.CONNECTED
    } else {
      this.el.className = "ReconnectTool reconnecting"
      this.icon.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`
      this.title.innerHTML = lang.RECONNECTING.replace("{attemp}", this.attemp.toString())
      setTimeout(() => this.el.classList.remove("reconnecting"), 1000)
    }
  }
  private async _startReconnect(): Promise<IRepB> {
    this.attemp++
    await waittime(4000)
    if (this.attemp > 3) {
      await this.destroy()
      return { code: 400, ok: false, msg: "CLOUD_TIMEOUT" }
    }
    this.updateStatus(2)
    const userData = await xhr.get("/x/account/me")
    if (!userData.ok) {
      return await this._startReconnect()
    }

    const buildNumber = userData.data?.build || -69
    const clientVersion = userData.data?.package || "-0.0.1"

    if (db.version !== buildNumber || clientVersion !== packageVersion.version) {
      await waittime(2000)
      await this.destroy()
      return { code: 400, ok: false, msg: "CLOUD_OUTDATED" }
    }

    await waittime(3000)
    audio.emit({ action: "play", type: "ui", src: "phone_notification", options: { id: "reconnecting" } })
    this.updateStatus(1)
    await waittime(3000)
    await this.destroy()
    return userData
  }
  async destroy() {
    this.el.classList.add("out")
    await waittime(500)
    this.el.remove()
  }
  async run(): Promise<IRepB> {
    this.createElement()
    eroot().append(this.el)
    audio.emit({ action: "play", type: "ui", src: "phone_notification", options: { id: "reconnecting" } })
    return await this._startReconnect()
  }
}
