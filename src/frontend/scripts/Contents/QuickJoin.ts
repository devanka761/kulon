import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import itemRun from "../Props/itemRun"
import { IPMC, IPMCConfig } from "../types/DBTypes"
import { IAny, SSKelement } from "../types/LibTypes"

interface IQuickJoinConfig extends IPMCConfig {
  onComplete: () => void
  classBefore: IPMC
  game: Game
}

type IQuickJoinType = "random" | "story" | "minigame"

type IQuickJoin = IQuickJoinType[]

const joinType: IQuickJoin = ["random", "story", "minigame"]

function cardOnList(id: string): HTMLDivElement {
  const text = `QK_${id.toUpperCase()}_SHORT`

  const card = kel("div", "card")
  card.innerHTML = `<div class="card-title">${lang[text]}</div>`
  return card
}

function fieldOnBard(id: string): HTMLDivElement {
  const text = `QK_${id.toUpperCase()}_LONG`

  const card = kel("div", "empty-board")
  card.innerHTML = `<div class="board-icon"><i class="fa-solid fa-play"></i></div><p>${lang[text]}</p><div class="btn btn-random"><span class="keyinfo">enter</span> ${lang.FR_BTN_FIND}</div>`
  return card
}

function loadingOnBoard(): HTMLDivElement {
  const card = kel("div", "empty-board")
  card.innerHTML = `<div class="board-icon"><i class="fa-regular fa-circle-notch fa-spin"></i></div><p>${lang.LOADING}</p>`
  return card
}

function cardHelp(): HTMLDivElement {
  const card = kel("div", "card-help")
  card.innerHTML = lang.ARROW_VERTICAL
  return card
}

export default class QuickJoin implements IPMC {
  id: string = "quickjoin"
  cardId: string = "-69"
  onComplete: () => void
  classBefore: IPMC
  isLocked: boolean = false
  private game: Game

  private el!: HTMLDivElement
  private cardlist!: SSKelement
  private eboard!: SSKelement

  private esc?: KeyPressListener
  private enter?: KeyPressListener
  private listNavHandler?: (...args: IAny) => IAny

  constructor(config: IQuickJoinConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.game = config.game
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-jobs")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-briefcase"></i> ${lang.JOB_RANDOM_FIND}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="con-list">
        </div>
        <div class="board empty">
        </div>
      </div>
    </div>`
    this.cardlist = futor(".con-list", this.el)
    this.eboard = futor(".board", this.el)
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  private listNavListener(): void {
    this.listNavHandler = (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
      if (this.isLocked) return

      e.preventDefault()

      const cards = Array.from(this.cardlist.querySelectorAll(".card")) as HTMLDivElement[]
      if (cards.length < 1) return

      const currentIndex = cards.findIndex((card) => card.classList.contains("ck"))

      let nextIndex
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cards.length
      } else {
        nextIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1
      }

      const nextCard = cards[nextIndex]
      if (nextCard) nextCard.click()
    }
    document.addEventListener("keydown", this.listNavHandler)
  }
  private updateList(): void {
    this.enter?.unbind()

    joinType.forEach((k, idx) => {
      const card = cardOnList(k)
      card.onclick = () => {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        this.writeInvite(k)
        this.cardlist.querySelector(".ck")?.classList.remove("ck")
        card.classList.add("ck")
      }
      this.cardlist.append(card)
      if (idx === 0) card.click()
    })
    this.cardlist.append(cardHelp())
  }
  private writeInvite(id: string): void {
    const fieldBefore = qutor(".empty-board", this.eboard)
    if (fieldBefore) fieldBefore.remove()

    const field = fieldOnBard(id)
    this.eboard.append(field)
    this.setClaimable(field, id)
  }
  private writeLoading(): void {
    const fieldBefore = qutor(".empty-board", this.eboard)
    if (fieldBefore) fieldBefore.remove()

    const field = loadingOnBoard()
    this.eboard.append(field)
  }
  private async setClaimable(field: HTMLDivElement, id: string): Promise<void> {
    const cardId = Date.now().toString()
    this.cardId = cardId
    this.enter?.unbind()

    const endpoint = `/x/job/random/${id}`

    const btnRandom = futor(".btn-random", field)
    btnRandom.onclick = async () => {
      if (this.isLocked || !db.pmc) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      this.writeLoading()

      db.waiting.reset()
      db.invites.reset()
      db.job.reset()
      if (db.pmx) {
        db.pmx.destroy()
        db.pmx = undefined
      }

      const job = await xhr.get(endpoint)

      await waittime(1000)

      if (!job.ok) {
        const text = lang[`QK_${id.toUpperCase()}_SHORT`].toLowerCase()
        this.writeInvite(id)
        await modal.alert(lang["QK_EMPTY"].replace("{job}", text))
        this.isLocked = false
        return
      }

      this.isLocked = false

      this.destroy(
        itemRun.run("joinRandom", {
          onComplete: this.onComplete,
          game: this.game,
          classBefore: this,
          job
        }) as IPMC
      )
    }

    await waittime(300, -5)
    if (this.cardId !== cardId) return

    this.enter = new KeyPressListener("enter", () => {
      btnRandom.click()
    })
  }
  async destroy(next?: IPMC) {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    this.esc?.unbind()
    document.removeEventListener("keydown", this.listNavHandler!)
    await waittime()
    this.enter?.unbind()
    this.esc?.unbind()
    this.el.remove()
    this.isLocked = false
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.updateList()
    this.btnListener()
    this.listNavListener()
  }
}
