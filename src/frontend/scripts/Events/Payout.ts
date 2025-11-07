import mission_list from "../../../../public/json/main/missions.json"
import backsong from "../APIs/BackSongAPI"
import { transformBagPage } from "../Contents/Bag"
import db from "../data/db"
import lang from "../data/language"
import peers from "../data/Peers"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel } from "../lib/kel"
import LoadAssets from "../lib/LoadAssets"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import chat from "../manager/Chat"
import { getOfflineAssets, getOfflineMaps } from "../manager/initialWorld"
import setNewGame from "../manager/setNewGame"
import { IPMC } from "../types/db.types"
import { IMissionList } from "../types/job.types"
import { SSKelement } from "../types/lib.types"
import { resetHint } from "./Hint"

interface IStatus {
  0: string
  1: string
}

const STATUS: [IStatus, IStatus] = [
  { 0: "PAYOUT_FAILED", 1: "PAYOUT_COMPLETED" },
  { 0: "PAYOUT_LOST", 1: "PAYOUT_WON" }
]

interface IPayoutConfig {
  onComplete: () => void
  game: Game
  fail?: boolean
}

export default class Payout implements IPMC {
  id: string = "payout"
  isLocked: boolean = false
  onComplete: () => void
  private game: Game
  private fail?: boolean

  private canvas = futor(".game-canvas") as HTMLCanvasElement
  private mission = mission_list.find((itm) => itm.id === db.job.mission)! as IMissionList

  private title: string

  private multiple: number = db.job.host === db.me.id ? 3 : 1
  private eco1: number
  private eco2: number

  private el!: HTMLDivElement
  private elcrews!: SSKelement
  private etitle!: SSKelement
  private box!: SSKelement

  private crews!: NodeListOf<HTMLDivElement>
  private currCrew!: number

  private ecos!: NodeListOf<HTMLDivElement>
  private currEco!: number

  constructor(config: IPayoutConfig) {
    this.onComplete = config.onComplete
    this.game = config.game
    this.fail = config.fail || false

    this.title = STATUS[this.mission.mode - 1][this.fail ? "0" : "1"]
    this.eco1 = this.mission.payout[this.fail ? "fail" : "success"][1].amount * this.multiple
    this.eco2 = this.mission.payout[this.fail ? "fail" : "success"][0].amount * this.multiple
  }
  private createElement(): void {
    this.el = kel("div", "Payout")
    if (this.fail) this.el.classList.add("fail")
    this.el.innerHTML = `
    <div class="box">
      <div class="completed">${lang[this.title]}</div>
      <div class="economies">
        <div class="eco">
          <i class="eco-desc">+${this.eco1}</i>
          <i class="eco-title">TOKEN</i>
        </div>
        <div class="eco">
          <i class="eco-desc">+${this.eco2}</i>
          <i class="eco-title">PERISMA</i>
        </div>
      </div>
      <div class="crews">
      </div>
    </div>
    <div class="changed"></div>`
    this.elcrews = futor(".crews", this.el)
    this.etitle = futor(".completed", this.el)
    this.box = futor(".box", this.el)
  }
  private writePlayers(): void {
    db.onduty = 3
    db.job
      .players!.sort((a, b) => {
        if (a.ts > b.ts) return 1
        if (a.ts < b.ts) return -1
        return 0
      })
      .forEach((player, i) => {
        const card = kel("div", "crew")
        card.innerHTML = `<i>${i + 1}</i> ${db.job.getUser(player.id)!.username}`
        this.elcrews.appendChild(card)
      })
  }
  private async writePayouts(): Promise<void> {
    this.canvas.classList.add("mission-complete")
    this.crews = this.el.querySelectorAll(".crew")
    this.currCrew = this.crews.length
    this.ecos = this.el.querySelectorAll(".eco")
    this.currEco = this.ecos.length
    audio.emit({ action: "play", type: "sfx", src: "text_trigger", options: { id: "text_trigger" } })
    audio.emit({ action: "play", type: "bgm", src: "mission_completed_bgm", options: { id: "mission_completed_bgm", fadeIn: 1000, volume: 1 } })
    await waittime(1000)
    await new Promise((resolve) => this.setTitle(resolve))
    await new Promise((resolve) => this.setCrew(resolve))
    await new Promise((resolve) => this.setEco(resolve))
    await waittime(3000)
    this.setBoxDown()
    this.setTransition()
    await waittime(1000)
    this.box.remove()
    this.setItems()
    await waittime(1000)
    this.canvas.classList.remove("mission-complete")
    this.backToOffline()
  }
  private async setItems(): Promise<void> {
    if (this.fail) return
    const eco2 = db.bag.findOne("69")!
    const eco1 = db.bag.findOne("420")!
    db.bag.update({ ...eco1, amount: eco1.amount + this.eco1 })
    db.bag.update({ ...eco2, amount: eco2.amount + this.eco2 })
    if (db.job.host === db.me.id) {
      const ticket = db.bag.get(db.job.itemId!)!
      db.bag.update({ ...ticket, amount: ticket.amount - this.mission.price[1] })
    }
  }
  private async setTitle(done: (val?: unknown) => unknown): Promise<void> {
    this.el.style.opacity = "1"
    await waittime(2000)
    audio.emit({ action: "play", type: "sfx", src: "text_drop", options: { id: "text_drop_" + Date.now() } })
    await waittime(150)
    this.etitle.style.transform = "translateY(0)"
    await waittime(3000)
    done()
  }
  private async setCrew(done: (val?: unknown) => unknown): Promise<unknown | void> {
    if (this.currCrew <= 0) {
      await waittime(2000)
      return done()
    }
    audio.emit({ action: "play", type: "sfx", src: "text_drop", options: { id: "text_drop_" + Date.now() } })
    await waittime(100)
    const currTranslate = Math.floor(((this.currCrew - 1) / this.crews.length) * 100)
    this.elcrews.style.transform = "translateY(-" + currTranslate + "%)"
    const currTitle = 100 / (this.currCrew + 1)
    this.etitle.style.transform = "translateY(calc(" + currTitle + "% - 1em))"
    await waittime(800)
    this.currCrew--
    this.setCrew(done)
  }
  private async setEco(done: (val?: unknown) => unknown): Promise<unknown | void> {
    if (this.currEco <= 0) {
      audio.emit({ action: "play", type: "sfx", src: "text_zoom", options: { id: "text_zoom" } })
      this.box.style.transform = "scale(1)"
      await waittime(3000)
      return done()
    }
    audio.emit({ action: "play", type: "sfx", src: "text_drop", options: { id: "text_drop_" + Date.now() } })
    this.ecos[this.currEco - 1].style.transform = "translateY(-50vh)"
    await waittime(250)
    this.ecos[this.currEco - 1].style.transition = "0.1s"
    this.ecos[this.currEco - 1].style.transform = "translateY(-7em)"
    await waittime(750)
    this.ecos[this.currEco - 1].style.transition = "0.5s"
    this.currEco--
    this.setEco(done)
  }
  private setTransition(): void {
    const echanged = futor(".changed", this.el)
    echanged.style.opacity = "1"
    audio.emit({ action: "stop", type: "bgm", options: { fadeOut: 1000 } })
  }
  private setBoxDown(): void {
    audio.emit({ action: "play", type: "sfx", src: "payout_out", options: { id: "payout_out" } })
    this.box.style.transform = "translateY(100vh)"
  }
  private async backToOffline(): Promise<void> {
    resetHint()
    peers.closeAll()
    db.job.reset()
    db.waiting.reset()
    db.invites.reset()
    db.onduty = 1
    transformBagPage("1")
    await new LoadAssets({ skins: getOfflineAssets() }).run()
    await setNewGame(getOfflineMaps(), this.game)
    this.destroy()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    db.onduty = 1
    this.el.classList.add("out")
    if (chat.formOpened) {
      chat.hide()
    }
    chat.clear()
    backsong.switch(1)
    backsong.start()
    await waittime(2000)
    db.pmc = undefined
    chat.add(db.me.id, lang.TC_LEFT, true)
    this.el.remove()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    backsong.destroy()
    audio.emit({ action: "stop", type: "ambient", options: { fadeOut: 300 } })
    this.game.pause()
    this.createElement()
    eroot().append(this.el)
    this.writePlayers()
    this.writePayouts()
    if (db.pmx) {
      db.pmx.destroy()
      db.pmx = undefined
    }
  }
}
