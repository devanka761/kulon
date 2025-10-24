import db from "../data/db"
import lang from "../data/language"
import MatchMaking from "../Events/MatchMaking"
import { kel } from "../lib/kel"
import modal from "../lib/modal"
import socket from "../lib/Socket"
import { IUser } from "../types/db.types"

const USER_STATUS = {
  INITIAL: ["h", ""],
  INVITED: ["y", "INVITED"],
  JOINED: ["j", "JOINED"],
  BUSY: ["b", "BUSY"],
  INVITING: ["y", "INVITING"],
  ONLINE: ["gb", "ONLINE"],
  OFFLINE: ["o", "OFFLINE"]
}

interface IMemberBuilderConfig {
  matchmaking: MatchMaking
  user: IUser
  type: "friend" | "crew"
  host: boolean
  isLocked: () => boolean
}

export default class MemberBuilder {
  private matchmaking: MatchMaking
  user: IUser
  id: string
  username: string
  type: "friend" | "crew"
  host: boolean
  isLocked: () => boolean

  private el!: HTMLDivElement
  private desc?: HTMLDivElement | HTMLElement
  constructor(config: IMemberBuilderConfig) {
    this.matchmaking = config.matchmaking
    this.user = config.user
    this.id = config.user.id
    this.username = config.user.username
    this.type = config.type
    this.host = config.host
    this.isLocked = config.isLocked
    this.run()
  }
  private createElement(): void {
    this.el = kel("div", "card usr")
    this.el.setAttribute(this.type === "friend" ? "x-fl" : "x-pl", this.id)
    this.el.innerHTML = `<span>${this.username}</span>`
    if (this.type === "friend") {
      this.desc = kel("div", "st")
      if (db.job.playerExists(this.id)) {
        this.desc.classList.add("j")
        this.desc.innerHTML = "JOINED"
      } else {
        this.desc.classList.add("h")
        this.desc.innerHTML = "IDLE"
      }
      this.el.append(this.desc)
    } else {
      if (this.host) {
        this.desc = kel("div", "st")
        this.desc.innerHTML = "HOST"
        this.el.append(this.desc)
      } else if (db.job.host === db.me.id) {
        this.desc = kel("i", "fa-duotone fa-circle-xmark")
        this.el.append(this.desc)
      }
    }
  }
  updateStatus(statusId: keyof typeof USER_STATUS): void {
    if (!this.desc) return
    const classess = Object.values(USER_STATUS).map((status) => status[0])
    this.desc.classList.remove(...classess)
    this.desc.classList.add(USER_STATUS[statusId][0])
    this.desc.innerHTML = USER_STATUS[statusId][1]
  }
  click(): void {
    this.el.click()
  }
  async kick(): Promise<void> {
    this.matchmaking.lock()
    if (db.job.host !== db.me.id) {
      await modal.alert(lang.MM_KICK_NOT_HOST)
      this.matchmaking.unlock()
      return
    }
    if (this.id === db.me.id) {
      await modal.alert(lang.MM_ALERT_SELF_KICK)
      this.matchmaking.unlock()
      return
    }
    const kickConfirm = await modal.confirm(lang.MM_CONFIRM_KICK.replace("{user}", this.username))
    if (!kickConfirm) {
      this.matchmaking.unlock()
      return
    }
    socket.send("jobKick", { to: this.id, jobId: db.job.id })
    this.matchmaking.unlock()
    this.matchmaking.updateCrew(this.user, true)
  }
  async invite(): Promise<void> {
    if (db.job.playerExists(this.id)) return
    if (db.job.invite! >= 3 && db.job.host !== db.me.id) {
      this.matchmaking.lock()
      await modal.alert(lang.MM_NOTIP_HOST_INV)
      this.matchmaking.unlock()
      return
    }
    this.updateStatus("INVITED")
    socket.send("jobInvite", { to: this.id, jobId: db.job.id })
  }
  onClick(): void {
    this.el.onclick = () => {
      if (this.matchmaking.getLocked()) return
      if (this.type === "friend") return this.invite()
      this.kick()
    }
  }
  select(): void {
    this.el.classList.add("selected")
  }
  deselect(): void {
    this.el.classList.remove("selected")
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(): void {
    this.el.onclick = null
    this.el.remove()
  }
  run(): MemberBuilder {
    this.createElement()
    this.onClick()
    return this
  }
}
