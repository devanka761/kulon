import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import sdate from "../lib/sdate"
import socket from "../lib/Socket"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import chat from "../manager/Chat"
import { IPMC, IPMCConfig, IUser } from "../types/db.types"
import { IMissionList } from "../types/job.types"
import Prologue from "./Prologue"

let launchInterval: ReturnType<typeof setInterval> | null = null

function playerCard(s: IUser): HTMLDivElement {
  const card = kel("div", "player")
  card.setAttribute("x-uid", s.id)
  card.innerHTML = `
  <div class="usr">${s.username}</div>
  <div class="avatar">
    <div class="hero">
    </div>
  </div>
  <div class="status">${lang.PRP_NOT_READY}</div>`
  const eskin = futor(".avatar .hero", card)
  Object.values(s.skin).forEach((sk) => {
    const img = new Image()
    img.src = asset[sk].src
    img.alt = sk
    eskin.append(img)
  })
  return card
}

interface IPrepareConfig extends IPMCConfig {
  onComplete: () => void
  startTime: number
  mission: IMissionList
  game: Game
}

export default class Prepare implements IPMC {
  id: string = "prepare"
  isLocked: boolean = false
  onComplete: () => void

  private startTime: number
  private mission: IMissionList
  private game: Game

  private meReady: boolean = false
  private readylist: string[] = []
  private isAborted: boolean = false

  private el!: HTMLDivElement

  private elist!: HTMLDivElement
  private launchNote!: HTMLDivElement
  private enter?: KeyPressListener

  constructor(config: IPrepareConfig) {
    this.startTime = config.startTime
    this.onComplete = config.onComplete
    this.mission = config.mission
    this.game = config.game
  }
  private createElement(): void {
    this.el = kel("div", "Prepare")
    this.el.innerHTML = `
      <div class="box">
        <div class="nav">
          <div class="nav-desc text">${lang.PRP_MISSION_TITLE}:</div>
          <div class="nav-title text"></div>
        </div>
        <div class="con">
        </div>
        <div class="actions">
          <div class="ts">
            <i></i>
          </div>
          <div class="btn btn-ready"><span class="keyinfo">enter</span> ${lang.PRP_BE_READY}</div>
        </div>
      </div>`
    this.elist = qutor(".con", this.el) as HTMLDivElement
    this.launchNote = qutor(".actions .ts i", this.el) as HTMLDivElement
  }
  private writeDetail(): void {
    db.onduty = 2
    const etitle = futor(".nav-title", this.el)
    etitle.innerHTML = this.mission.name
    let isValid = sdate.remain(this.startTime, true)
    this.launchNote.innerHTML = `${lang.PRP_TS_TEXT} ${isValid}`

    launchInterval = setInterval(() => {
      isValid = sdate.remain(this.startTime, true)
      this.launchNote.innerHTML = isValid ? `${lang.PRP_TS_TEXT} ${isValid}` : ""
      if (!isValid) {
        clearInterval(launchInterval!)
        launchInterval = null
        return this.launch()
      }
    }, 1000)
  }
  private writePlayers(): void {
    const users = [...db.job.users!]
    users.forEach((usr) => {
      const card = playerCard(usr)
      this.elist.append(card)
    })
  }
  private btnListener(): void {
    const eready = futor(".btn-ready", this.el)

    eready.onclick = () => {
      if (this.meReady) return
      if (this.isLocked || chat.formOpened) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.meReady = true
      this.updatePlayerStatus(db.me.id)
      eready.classList.add("done")
      eready.innerHTML = lang.PRP_WAITING
      socket.send("prepareReady")
    }

    this.enter = new KeyPressListener("enter", () => {
      eready.click()
    })
  }
  updatePlayerStatus(userId: string): void {
    const card = qutor(`.player[x-uid="${userId}"] .status`, this.elist)
    if (card) {
      card.classList.add("g")
      card.innerHTML = lang.PRP_BE_READY
    }
    this.readylist.push(userId)
  }

  updateQueue(): void {
    const waitExit = db.waiting.get("jobexit")
    const waitReady = db.waiting.getMany("prepareready")

    if (waitExit) {
      this.aborted(waitExit.user)
      db.waiting.remove("jobexit")
      db.waiting.reset()
      return
    }

    if (waitReady.length >= 1) {
      waitReady.forEach((usr) => this.updatePlayerStatus(usr.userId))
      db.waiting.removeMany("prepareready")
      return
    }
  }
  async aborted(user: IUser): Promise<void> {
    this.isAborted = true
    this.isLocked = true
    await modal.alert(lang.PRP_ON_LEFT.replace("{user}", user.username))
    this.isLocked = false
    db.onduty = 1
    db.job.reset()
    this.resumeMap()
    this.destroy()
  }
  async launch(): Promise<void> {
    if (launchInterval) {
      clearInterval(launchInterval)
      launchInterval = null
    }
    this.launchNote.innerHTML = 'LAUNCHING <i class="fa-solid fa-circle-notch fa-spin"></i>'
    const bag = this.mission.bag
    if (bag) bag.forEach((itm) => db.job.setItem(itm))
    db.invites.reset()
    const prologue = new Prologue({
      onComplete: this.onComplete,
      game: this.game,
      mission: this.mission
    })
    audio.emit({ action: "play", type: "bgm", src: "mission_completed_bgm", options: { fadeIn: 1000, fadeOut: 1000, volume: 1 } })
    audio.emit({ action: "play", type: "ui", src: "act_done", options: { id: "act_done" } })
    if (db.pmx) db.pmx.init(this.startTime)
    this.destroy(prologue)
  }
  private resumeMap(): void {
    this.game.pause()
    this.game.resume()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (launchInterval) {
      clearInterval(launchInterval)
      launchInterval = null
    }
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    await waittime()
    this.meReady = false
    this.readylist = []
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (this.isAborted) next = undefined
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.writeDetail()
    this.writePlayers()
    this.btnListener()
  }
}
