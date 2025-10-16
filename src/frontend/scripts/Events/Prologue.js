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
import { KeyPressListener } from "../main/KeyPressListener"
import chat from "../manager/Chat"
import setNewGame from "../manager/setNewGame"

export default class Prologue {
  constructor(config) {
    this.id = "prologue"
    this.onComplete = config.onComplete
    this.mission = config.mission
    this.game = config.game
    this.skipped = []
    this.isAborted = null
    this.isLaunching = false
  }
  createElement() {
    this.el = kel("div", "Prologue")

    this.box = kel("div", "box")
    this.el.append(this.box)

    this.sub = kel("div", "sub")
    this.box.append(this.sub)

    this.actions = kel("div", "actions")

    this.desc = kel("div", "desc")

    this.btnSkip = kel("div", "btn btn-skip", { e: `<div class="keyinfo">enter</div> ${lang.CHAR_CREATION_CONTINUE}` })
    this.actions.append(this.desc, this.btnSkip)
  }
  async writeDetail() {
    this.game.pause()
    await waittime(1500)
    await this.setSub()
    this.setSkip()
    this.updateQueue()
  }
  async setSub() {
    const subs = this.mission.memory

    for (let i = 0; i < subs.length; i++) {
      const p = kel("p")
      p.innerHTML = subs[i].text[LocalList.lang]
      this.sub.append(p)
      await waittime(50)
      p.scrollIntoView({ behavior: "smooth", block: "end", container: "nearest" })
      await waittime(1000)
    }
  }
  updateSkipped(userId) {
    if (!this.box.contains(this.actions)) {
      db.waiting.add({ id: "prologueskip", userId })
      return
    }
    if (this.skipped.find((usr) => usr === userId)) return
    audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
    this.skipped.push(userId)
    this.writeSkipped()
  }
  setSkip() {
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
  writeSkipped() {
    const amount = this.skipped.length
    const total = db.job?.players?.length || 69
    const text = `${amount}/${total}`
    this.desc.innerHTML = lang.PG_SKIPPED.replace("{player}", text)
    if (amount >= total) return this.drop()
  }

  async setTitle() {
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

  async drop() {
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
    const newGame = await setNewGame(db.job.nextMap, this.game, false, this.mission.spawn)
    peers.setInitialMap(this.mission.spawn.area)
    db.job.clearMap()
    if (!this.isAborted) {
      db.pmc = null
    }
    if (this.isAborted) {
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
  updateQueue() {
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
  resumeMap() {
    this.game.pause()
    this.game.resume()
  }
  manualAborted(user) {
    this.isAborted = user
  }
  async aborted(user) {
    this.isAborted = user
    this.isLocked = true
    await modal.alert(lang.PRP_ON_LEFT.replace("{user}", user.username))
    this.isLocked = false
    db.onduty = 1
    if (!this.isLaunching) {
      db.job.reset()
    }
    this.resumeMap()
    this.destroy()
  }
  async destroy(next) {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    await waittime()
    this.skipped = []
    this.el.remove()
    this.isLocked = false
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.writeDetail()
  }
}
