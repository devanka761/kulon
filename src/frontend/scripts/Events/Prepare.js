import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import sdate from "../lib/sdate"
import socket from "../lib/Socket"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import chat from "../manager/Chat"
import Prologue from "./Prologue"

let launchInterval = null

function playerCard(s) {
  const card = kel("div", "player")
  card.setAttribute("x-uid", s.id)
  card.innerHTML = `
  <div class="usr">${s.username}</div>
  <div class="avatar">
    <div class="hero">
    </div>
  </div>
  <div class="status">${lang.PRP_NOT_READY}</div>`
  const eskin = qutor(".avatar .hero", card)
  Object.values(s.skin).forEach((sk) => {
    const img = new Image()
    img.src = asset[sk].src
    img.alt = sk
    eskin.append(img)
  })
  return card
}

export default class Prepare {
  constructor(config) {
    this.id = "prepare"
    this.startTime = config.startTime
    this.onComplete = config.onComplete
    this.mission = config.mission
    this.game = config.game
    this.meReady = false
    this.readylist = []
    this.isAborted = false
  }
  createElement() {
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
    this.etitle = qutor(".nav-title", this.el)
    this.eready = qutor(".btn-ready", this.el)
    this.elist = qutor(".con", this.el)
    this.launchNote = qutor(".actions .ts i", this.el)
  }
  writeDetail() {
    db.onduty = 2
    this.etitle.innerHTML = this.mission.name
    let isValid = sdate.remain(this.startTime, true)
    this.launchNote.innerHTML = `${lang.PRP_TS_TEXT} ${isValid}`

    launchInterval = setInterval(() => {
      isValid = sdate.remain(this.startTime, true)
      this.launchNote.innerHTML = isValid ? `${lang.PRP_TS_TEXT} ${isValid}` : ""
      if (!isValid) {
        clearInterval(launchInterval)
        launchInterval = null
        return this.launch()
      }
    }, 1000)
  }
  writePlayers() {
    const users = [...db.job.users]
    users.forEach((usr) => {
      const card = playerCard(usr)
      this.elist.append(card)
    })
  }
  btnListener() {
    this.eready.onclick = () => {
      if (this.meReady) return
      if (this.isLocked || chat.formOpened) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.meReady = true
      this.updatePlayerStatus(db.me.id)
      this.eready.classList.add("done")
      this.eready.innerHTML = lang.PRP_WAITING
      socket.send("prepareReady")
    }

    this.enter = new KeyPressListener("enter", () => {
      this.eready.click()
    })
  }
  updatePlayerStatus(userId) {
    const card = qutor(`.player[x-uid="${userId}"] .status`, this.elist)
    if (card) {
      card.classList.add("g")
      card.innerHTML = lang.PRP_BE_READY
    }
    this.readylist.push(userId)
  }

  updateQueue() {
    const waitExit = db.waiting.get("jobexit")
    const waitReady = db.waiting.getMany("prepareready")

    if (waitExit) {
      this.aborted(waitExit.user)
      db.waiting.remove("jobexit")
      db.waiting.reset()
      return
    }

    if (waitReady.length >= 1) {
      waitReady.forEach((usr) => this.updatePlayerStatus(usr))
      db.waiting.removeMany("prepareready")
      return
    }
  }
  async aborted(user) {
    this.isAborted = true
    this.isLocked = true
    await modal.alert(lang.PRP_ON_LEFT.replace("{user}", user.username))
    this.isLocked = false
    db.onduty = 1
    this.resumeMap()
    this.destroy()
  }
  async launch() {
    if (launchInterval) {
      clearInterval(launchInterval)
      launchInterval = null
    }
    this.launchNote.innerHTML = 'LAUNCHING <i class="fa-solid fa-circle-notch fa-spin"></i>'
    this.mission.bag.forEach((itm) => db.job.setItem(itm))
    db.invites.reset()
    const prologue = new Prologue({
      onComplete: this.onComplete,
      game: this.game,
      mission: this.mission
    })
    audio.emit({ action: "play", type: "bgm", src: "mission_completed_bgm", options: { fadeIn: 1000, fadeOut: 1000, volume: 1 } })
    audio.emit({ action: "play", type: "ui", src: "act_done", options: { id: "act_done" } })
    this.destroy(prologue)
  }
  resumeMap() {
    this.game.pause()
    this.game.resume()
  }
  async destroy(next) {
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
    db.pmc = null
    if (this.isAborted) next = null
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.writeDetail()
    this.writePlayers()
    this.btnListener()
  }
}
