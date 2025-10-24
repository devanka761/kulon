import mission_list from "../../../../public/json/main/missions.json"
import cloud_items from "../../../../public/json/items/cloud_items.json"
import modal from "../lib/modal"
import lang from "../data/language"
import { eroot, futor, kel, qutor } from "../lib/kel"
import db from "../data/db"
import LocalList from "../data/LocalList"
import { KeyPressListener } from "../main/KeyPressListener"
import waittime from "../lib/waittime"
import itemRun from "../Props/itemRun"
import audio from "../lib/AudioHandler"
import { IMissionList } from "../types/job.types"
import { IPMC, IPMCConfig } from "../types/db.types"
import { Game } from "../main/Game"
import { ISival, SSKelement } from "../types/lib.types"

interface ILocaleMode {
  [key: string]: string
}

const localeMode: ILocaleMode = {
  0: "SOLO",
  1: "COOP",
  2: "VS"
}

function missionCard(s: IMissionList): HTMLDivElement {
  const price = cloud_items.find((citm) => citm.id === s.price[0])!

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
      <img src="./assets/items/cloud/${price.src}.png" alt="${price.name[LocalList.lang!]}" />
      <i>${s.price[1].toString()}</i>
    </div>
  </div>`
  return card
}
function loadingCard(text?: string): HTMLDivElement {
  const card = kel("div", "card")
  card.innerHTML = `<div class="card-title">${text ? text : '<i class="fa-solid fa-circle-notch fa-spin"></i> LOADING'}</div>`
  return card
}

interface IMissionsConfig extends IPMCConfig {
  onComplete: () => void
  isFirst?: boolean
  game: Game
}

export default class Missions implements IPMC {
  id: string = "missions"
  isLocked: boolean = false
  onComplete: () => void
  private isFirst?: boolean
  private game: Game

  private choosen?: string
  private boards: SSKelement[] = []
  private activeBoardIndex: number = 0

  private el!: HTMLDivElement
  private btnStart!: HTMLDivElement

  private esc?: KeyPressListener
  private enter?: KeyPressListener
  private navKeyHandler?: (...args: ISival) => ISival

  private eboard1!: SSKelement
  private eboard2!: SSKelement

  constructor(config: IMissionsConfig) {
    this.onComplete = config.onComplete
    this.game = config.game
    this.isFirst = config.isFirst
  }
  private createElement(): void {
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
          <div class="btn btn-start"><span class="keyinfo">enter</span> ${lang.TS_START}</div>
        </div>
      </div>
    </div>`
    this.btnStart = qutor(".actions", this.el) as HTMLDivElement
  }
  private btnListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
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
  private updateEconomies(): void {
    const estory = futor(".economies .eco-story span", this.el)
    const eminigame = futor(".economies .eco-minigame span", this.el)

    const xstory = db.bag
      .find("CL00003")
      .map((k) => k.amount || 0)
      .reduce((a, b) => a + b, 0)
    const xminigame = db.bag
      .find("CL00004")
      .map((k) => k.amount || 0)
      .reduce((a, b) => a + b, 0)

    estory.innerHTML = xstory.toString()
    eminigame.innerHTML = xminigame.toString()
  }
  private writeData(): void {
    this.eboard1 = futor(".boards .board .list-story", this.el)
    this.eboard2 = futor(".boards .board .list-minigame", this.el)
    const card1 = loadingCard()
    const card2 = loadingCard()
    this.eboard1.append(card1)
    this.eboard2.append(card2)
    card1.remove()
    card2.remove()
    this.writeStory()
    this.writeMinigames()
    this.boards = [this.eboard1, this.eboard2]
  }
  private writeStory(): void {
    const missions = mission_list.filter((k) => !k.beta && k.group === 1) as IMissionList[]
    const eboard = futor(".boards .board .list-story", this.el)

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
  private writeMinigames(): void {
    const missions = mission_list.filter((k) => k.group === 2) as IMissionList[]
    const eboard = futor(".boards .board .list-minigame", this.el)

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
  private updateChoices(card: HTMLDivElement, s: IMissionList): void {
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
  private navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (this.isLocked || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
      e.preventDefault()

      const currentBoard = this.boards[this.activeBoardIndex]
      if (!currentBoard) return

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        this.activeBoardIndex = this.activeBoardIndex === 0 ? 1 : 0
        const newBoard = this.boards[this.activeBoardIndex]
        const firstCard = qutor(".card", newBoard)
        if (firstCard) {
          firstCard.click()

          // @ts-expect-error no default types
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

      const nextCard = cards[nextIndex] as SSKelement
      if (nextCard) {
        nextCard.click()

        // @ts-expect-error no default types
        nextCard.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
    }

    document.addEventListener("keydown", this.navKeyHandler)
  }
  async startJob(): Promise<void> {
    this.isLocked = true
    const job = mission_list.find((k) => k.id === this.choosen) as IMissionList
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
      }) as IPMC
    )
  }

  private async tutorial(): Promise<void> {
    await waittime(1000)
    await modal.alert(lang.MB_TR_01)
    await waittime(750)
    await modal.alert(lang.MB_TR_02)
    this.destroy()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.choosen = undefined
    this.esc?.unbind()
    this.enter?.unbind()
    if (this.navKeyHandler) {
      document.removeEventListener("keydown", this.navKeyHandler)
      this.navKeyHandler = undefined
    }
    this.boards = []
    this.activeBoardIndex = 0
    await waittime()
    this.game.resume()
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.game.pause()
    this.createElement()
    eroot().append(this.el)
    this.updateEconomies()
    this.writeData()
    if (this.isFirst) {
      this.tutorial()
      return
    }
    this.btnListener()
    this.navKeyListener()
  }
}
