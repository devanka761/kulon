import backsong from "../APIs/BackSongAPI"
import { transformBagPage } from "../Contents/Bag"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import peers from "../data/Peers"
import audio from "../lib/AudioHandler"
import { eroot, kel } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import chat from "../manager/Chat"
import setNewGame from "../manager/setNewGame"
import { IPMC, IPMCConfig, IUser } from "../types/db.types"
import { IMissionList } from "../types/job.types"
import { ISival } from "../types/lib.types"
import { resetHint, setHint } from "./Hint"

interface IPrologueConfig extends IPMCConfig {
  onComplete: () => void
  mission: IMissionList
  game: Game
  startTime?: number
}

export default class Prologue implements IPMC {
  id: string = "prologue"
  isLocked: boolean = false
  onComplete: () => void
  private mission: IMissionList
  private game: Game
  private startTime?: number

  private skipped: string[] = []
  private isAborted: ISival = null
  private isLaunching: boolean = false

  private el!: HTMLDivElement
  private box!: HTMLDivElement
  private sub!: HTMLDivElement
  private actions!: HTMLDivElement
  private desc!: HTMLDivElement
  private btnSkip!: HTMLDivElement
  private title?: HTMLDivElement

  private enter?: KeyPressListener

  constructor(config: IPrologueConfig) {
    this.onComplete = config.onComplete
    this.mission = config.mission
    this.game = config.game
    this.startTime = config.startTime
  }
  private createElement(): void {
    this.el = kel("div", "Prologue")

    this.box = kel("div", "box")
    this.el.append(this.box)

    this.sub = kel("div", "sub")
    this.box.append(this.sub)

    this.actions = kel("div", "actions")

    this.desc = kel("div", "desc")

    this.btnSkip = kel("div", "btn btn-skip", { e: `<div class="keyinfo">enter</div> ${lang.CHAR_CREATION_CONTINUE}` })
    this.actions.append(this.game.kulonUI.chat.html, this.desc, this.btnSkip)
  }
  private async writeDetail(): Promise<void> {
    this.game.pause()
    await waittime(1500)
    if (!this.mission.memory) {
      this.isLaunching = true
      return this.drop()
    }
    await this.setSub()
    this.setSkip()
    this.updateQueue()
  }
  private async setSub(): Promise<void> {
    const subs = this.mission.memory

    for (let i = 0; i < subs.length; i++) {
      const p = kel("div", "text")
      p.innerHTML = subs[i].text[LocalList.lang!]
      this.sub.append(p)
      await waittime(100)

      // @ts-expect-error no default types
      p.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      await waittime(750)
    }
  }
  updateSkipped(userId: string): void {
    if (!this.box.contains(this.actions)) {
      db.waiting.add({ id: "prologueskip", userId })
      return
    }
    if (this.skipped.find((usr) => usr === userId)) return
    audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
    this.skipped.push(userId)
    this.writeSkipped()
  }
  setSkip(): void {
    this.box.append(this.actions)
    this.writeSkipped()
    this.box.scrollTop = this.box.scrollHeight
    this.btnSkip.onclick = () => {
      if (this.isLocked || chat.formOpened) return
      if (db.pmc?.id !== "prologue") {
        this.enter?.unbind()
        return
      }

      this.updateSkipped(db.me.id)
      peers.send("prologueSkip")
      this.btnSkip.innerHTML = lang.PRP_WAITING
    }
    this.enter = new KeyPressListener("enter", () => {
      this.btnSkip.click()
    })
    this.updateQueue()
  }
  writeSkipped(): void {
    const amount = this.skipped.length
    const total = db.job?.players?.length || 69
    const text = `${amount}/${total}`
    this.desc.innerHTML = lang.PG_SKIPPED.replace("{player}", text)
    if (amount >= total) {
      if (db.pmx && this.startTime) db.pmx.init(Date.now())
      this.isLaunching = true
      this.drop()
    }
  }

  private async setTitle(): Promise<void> {
    this.title = kel("div", "title")
    const text = kel("div", "text")
    const bg = kel("div", "bg")
    const p = kel("p")
    p.innerHTML = this.mission.name

    await waittime(1000)
    audio.emit({ action: "play", type: "sfx", src: "text_intro", options: { id: "text_intro" } })
    await waittime(100)
    this.title.append(text)
    text.append(bg, p)
    this.box.append(this.title)
    await waittime(5000)
    await waittime(5000)
  }

  private async drop(): Promise<void> {
    const nextMap = db.job.nextMap
    audio.emit({ action: "stop", type: "bgm", options: { fadeOut: 1000 } })
    audio.emit({ action: "play", type: "ui", src: "act_done", options: { id: "act_done" } })
    this.isLaunching = true
    this.enter?.unbind()
    this.actions.classList.add("out")
    this.sub.classList.add("out")
    await waittime(1000)
    audio.emit({ action: "play", type: "ui", src: "act_start", options: { id: "act_start" } })
    this.actions.remove()
    this.sub.remove()
    await waittime(2000)

    if (this.isAborted) {
      if (db.pmx) {
        db.pmx.destroy()
        db.pmx = undefined
      }
      this.el.remove()
      return
    }

    const newGame = await setNewGame(nextMap!, this.game, false, this.mission.spawn)

    peers.setInitialMap(this.mission.spawn.area)
    db.job.clearMap()
    if (!this.isAborted) {
      if (db.pmc?.id === "prologue") db.pmc = undefined

      resetHint()

      const { clue } = this.mission
      if (clue) {
        setTimeout(() => {
          setHint(...clue)
          newGame.kulonUI?.phone.updateUnread()
        }, 4000)
      }
    }
    if (this.isAborted) {
      if (db.pmx) {
        db.pmx.destroy()
        db.pmx = undefined
      }
      newGame.startCutscene([{ type: "playerLeft", user: this.isAborted }])
      this.el.remove()
      return
    }
    backsong.switch(0)
    backsong.start(2000)
    this.el.classList.add("launch")
    db.job.status = 3
    transformBagPage("0")
    await this.setTitle()
    this.destroy()
  }
  updateQueue(): void {
    const waitExit = db.waiting.get("jobexit")
    const waitSkip = db.waiting.getMany("prologueskip")

    if (waitExit) {
      this.aborted(waitExit.user)
      db.waiting.reset()
      return
    }

    if (waitSkip.length >= 1) {
      waitSkip.forEach((usr) => this.updateSkipped(usr.userId))
      return
    }
  }
  private resumeMap(): void {
    this.game.pause()
    this.game.resume()
  }
  manualAborted(user: IUser): void {
    this.isAborted = user
  }
  async aborted(user: IUser): Promise<void> {
    if (this.isAborted) return
    this.isAborted = user
    this.isLocked = true
    await modal.alert(lang.PRP_ON_LEFT.replace("{user}", user.username))
    if (db.pmx) {
      db.pmx.destroy()
      db.pmx = undefined
    }
    this.isLocked = false
    db.onduty = 1
    if (!this.isLaunching) {
      db.job.reset()
    }
    audio.emit({ action: "stop", type: "bgm", options: { fadeOut: 1000 } })
    backsong.switch(2)
    backsong.start(2000)
    this.resumeMap()
    await this.destroy()
    this.game.kulonUI.restore()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    await waittime()
    this.game.kulonUI.restore()
    if (db.pmc?.id === "prologue") db.pmc = undefined
    this.skipped = []
    this.el.remove()
    this.isLocked = false
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.writeDetail()
  }
}
