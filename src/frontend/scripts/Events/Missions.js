import cloud_items from "../../../../public/json/items/cloud_items.json"
import modal from "../lib/modal"
import lang from "../data/language"
import xhr from "../lib/xhr"
import { eroot, kel, qutor } from "../lib/kel"
import db from "../data/db"
import LocalList from "../data/LocalList"
import { KeyPressListener } from "../main/KeyPressListener"
import waittime from "../lib/waittime"
import itemRun from "../Props/itemRun"
import audio from "../lib/AudioHandler"

const localeMode = {
  0: "SOLO",
  1: "COOP",
  2: "VS"
}

function missionCard(s) {
  const price = cloud_items.find((citm) => citm.id === s.price[0])

  const card = kel("div", "card")
  if (!s.ready) card.classList.add("dev")
  card.innerHTML = `
  <div class="card-title">${s.name}</div>
  <div class="card-req">
    <div class="req req-mode">
      <i>${s.min === s.max ? s.max + "P" : s.min + "P - " + s.max + "P"}</i>
      <i>(${localeMode[s.mode.toString()]}) ${s.ready ? "" : " UNDER DEVELOPMENT"}</i>
    </div>
    <div class="req req-price">
      <img src="./assets/items/cloud/${price.src}.png" alt="${price.name[LocalList.lang]}" />
      <i>${s.price[1].toString()}</i>
    </div>
  </div>`
  return card
}
function loadingCard(text) {
  const card = kel("div", "card")
  card.innerHTML = `<div class="card-title">${text ? text : '<i class="fa-solid fa-circle-notch fa-spin"></i> LOADING'}</div>`
  return card
}

export default class Missions {
  constructor(config) {
    this.onComplete = config.onComplete
    this.game = config.game
    this.isLocked = false
    this.isFirst = config.isFirst
    this.choosen = null
    this.boards = []
    this.activeBoardIndex = 0
  }
  createElement() {
    this.el = kel("div", "fuwi f-missions")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-car-burst"></i> Mission Board</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="economies">
          <div class="eco eco-story">
            <img src="./assets/items/cloud/ticket_story.png" alt="story" />
            <span>0</span>
          </div>
          <div class="eco eco-minigame">
            <img src="./assets/items/cloud/ticket_minigame.png" alt="minigame" />
            <span>0</span>
          </div>
        </div>
        <div class="boards">
          <div class="board board-story">
            <div class="board-title">STORY MODE</div>
            <div class="board-list list-story">
            </div>
          </div>
          <div class="board board-minigames">
            <div class="board-title">MINI GAMES</div>
            <div class="board-list list-minigame">
            </div>
          </div>
        </div>
        <div class="actions disabled">
          <span class="keyinfo">enter</span>
          <div class="btn btn-start">${lang.TS_START}</div>
        </div>
      </div>
    </div>`
    this.btnStart = qutor(".actions", this.el)
  }
  btnListener() {
    const btnClose = qutor(".btn-close", this.el)
    btnClose.onclick = () => {
      this.destroy()
    }

    this.btnStart.onclick = async () => {
      if (this.isLocked) return
      this.startJob()
    }

    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
    this.enter = new KeyPressListener("enter", () => {
      this.btnStart.click()
    })
  }
  updateEconomies() {
    const estory = qutor(".economies .eco-story span", this.el)
    const eminigame = qutor(".economies .eco-minigame span", this.el)

    const xstory = db.bag
      .find("CL00003")
      .map((k) => k.amount || 0)
      .reduce((a, b) => a + b, 0)
    const xminigame = db.bag
      .find("CL00004")
      .map((k) => k.amount || 0)
      .reduce((a, b) => a + b, 0)

    estory.innerHTML = xstory
    eminigame.innerHTML = xminigame
  }
  async writeData() {
    this.eboard1 = qutor(".boards .board .list-story", this.el)
    this.eboard2 = qutor(".boards .board .list-minigame", this.el)
    const card1 = loadingCard()
    const card2 = loadingCard()
    this.eboard1.append(card1)
    this.eboard2.append(card2)
    this.mission_list = await xhr.get("/json/main/missions.json")
    card1.remove()
    card2.remove()
    this.writeStory()
    this.writeMinigames()
    this.boards = [this.eboard1, this.eboard2]
  }
  writeStory() {
    const missions = this.mission_list.filter((k) => !k.beta && k.group === 1)
    const eboard = qutor(".boards .board .list-story", this.el)

    missions.forEach((s, i) => {
      const card = missionCard(s)
      card.onclick = () => {
        if (this.isFirst || this.isLocked) return
        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: Date.now().toString() } })
        this.updateChoices(card, s)
      }
      eboard.append(card)
      if (i === 0) card.click()
    })
  }
  writeMinigames() {
    const missions = this.mission_list.filter((k) => k.group === 2)
    const eboard = qutor(".boards .board .list-minigame", this.el)

    missions.forEach((s) => {
      const card = missionCard(s)
      card.onclick = () => {
        if (this.isFirst || this.isLocked) return
        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: Date.now().toString() } })
        this.updateChoices(card, s)
      }
      eboard.append(card)
    })
  }
  updateChoices(card, s) {
    const selectedbefore = this.el.querySelectorAll(".boards .board .board-list .card.selected")
    selectedbefore.forEach((el) => el.classList.remove("selected"))
    card.classList.add("selected")
    if (s.ready) {
      this.btnStart.classList.remove("disabled")
    } else {
      this.btnStart.classList.add("disabled")
    }
    this.choosen = s.id
  }
  navKeyListener() {
    this.navKeyHandler = (e) => {
      if (this.isLocked || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
      e.preventDefault()

      const currentBoard = this.boards[this.activeBoardIndex]
      if (!currentBoard) return

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.activeBoardIndex = this.activeBoardIndex === 0 ? 1 : 0
        const newBoard = this.boards[this.activeBoardIndex]
        const firstCard = newBoard.querySelector(".card")
        if (firstCard) {
          firstCard.click()
          firstCard.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
        }
        return
      }

      const cards = Array.from(currentBoard.querySelectorAll(".card"))
      if (cards.length === 0) return

      const currentIndex = cards.findIndex((card) => card.classList.contains("selected"))
      let nextIndex

      if (e.key === "ArrowDown") {
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cards.length
      } else {
        nextIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1
      }

      const nextCard = cards[nextIndex]
      if (nextCard) {
        nextCard.click()
        nextCard.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
    }

    document.addEventListener("keydown", this.navKeyHandler)
  }
  async startJob() {
    this.isLocked = true
    const job = this.mission_list.find((k) => k.id === this.choosen)
    if (!job) {
      await modal.alert(lang.MM_JOB_INVALID)
      this.isLocked = false
      return
    }
    if (!job.ready) {
      await modal.alert(lang.MM_NOT_READY)
      this.isLocked = false
      return
    }
    this.isLocked = false
    this.destroy(
      itemRun.run("startJob", {
        onComplete: this.onComplete,
        game: this.game,
        classBefore: this,
        mission: job
      })
    )
  }

  async tutorial() {
    await waittime(1000)
    await modal.alert(lang.MB_TR_01)
    await waittime(750)
    await modal.alert(lang.MB_TR_02)
    this.destroy()
  }
  async destroy(next) {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.choosen = null
    this.esc?.unbind()
    this.enter?.unbind()
    if (this.navKeyHandler) document.removeEventListener("keydown", this.navKeyHandler)
    this.boards = []
    this.activeBoardIndex = 0
    await waittime()
    this.game.resume()
    this.el.remove()
    this.isLocked = false
    db.pmc = null
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  async init() {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.game.pause()
    this.createElement()
    eroot().append(this.el)
    this.updateEconomies()
    await this.writeData()
    if (this.isFirst) return this.tutorial()
    this.btnListener()
    this.navKeyListener()
  }
}
