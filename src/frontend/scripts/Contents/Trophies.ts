import trophy_list from "../../../../public/json/main/trophies.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import sdate from "../lib/sdate"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import xhr from "../lib/xhr"
import Rewards from "../Props/Rewards"
import audio from "../lib/AudioHandler"
import { IAchievement, ITrophy } from "../types/trohpy.types"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ISival } from "../types/lib.types"

let currentPage: string = "1"

function itemCard(itm_id: string, s: IAchievement): HTMLDivElement {
  const tdb = db.trophies.get(itm_id) || ({} as Partial<ITrophy>)
  const tdbDisplay = Math.floor(((tdb.taken || 0) / s.taken) * s.display)
  const card = kel("div", "card")
  card.setAttribute("x-trp", itm_id)
  const isDone = tdb.ts
  const isClaimed = tdb.claimed
  if (isClaimed) {
    card.classList.add("claimed")
  } else if (isDone) {
    card.classList.add("done")
  }
  card.innerHTML = `
  <div class="detail">
    <div class="card-title">${s.group === "3" && !isDone ? "???" : s.title[LocalList.lang!]}</div>
    <div class="card-desc">${s.group === "3" && !isDone ? "???" : s.desc[LocalList.lang!]}</div>
    ${tdb.ts ? '<div class="card-done">' + sdate.datetime(tdb.ts) + "</div>" : ""}
  </div>
  <div class="reward">
    <div class="reqs"></div>
    <div class="item">
      <div class="item-card">
        <img src="${asset["perismato"].src}" alt="perisma"/>
        <div class="amount">${s.reward}</div>
      </div>
    </div>
  </div>`
  const ereqs = futor(".reward .reqs", card)
  const ereward = futor(".reward", card)
  if (tdb.ts && !tdb.claimed) {
    const btnClaim = kel("div", "btn btn-claim")
    btnClaim.innerHTML = lang.MAIL_ACT_CLAIM
    ereqs.append(btnClaim)
    const claimHelp = kel("span", "keyinfo", { e: "enter" })
    ereward.prepend(claimHelp)
  } else {
    ereqs.innerHTML = `<span>${tdbDisplay || 0}/${s.display}</span>`
  }

  return card
}

interface ITrophiesConfig extends IPMCConfig {
  onComplete: () => void
}
interface ITrophiesGroups {
  [key: string]: boolean
}
interface ITrophiesPageList {
  [key: string]: HTMLDivElement[]
}

export default class Trophies implements IPMC {
  id: string = "trophies"
  isLocked: boolean = false
  onComplete: () => void
  classBefore?: IPMC
  private navKeyHandler?: (...args: ISival) => ISival

  private el!: HTMLDivElement
  private eboard!: HTMLDivElement

  private esc?: KeyPressListener
  private enter?: KeyPressListener

  constructor(config: ITrophiesConfig) {
    this.id = "trophies"
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
  }
  createElement(): void {
    this.el = kel("div", "fuwi f-trophy")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-trophy-star"></i> ${lang.PHONE_TROPHY}</div>
          <div class="desc">
            ${db.trophies.doneList.length}/${Object.keys(trophy_list).length}
          </div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="board">
        </div>
        <div class="con-list">
          <div k-type="1" class="card selected">${lang.FW_TRP_GENERAL}</div>
          <div k-type="2" class="card">${lang.FW_TRP_JOURNEY}</div>
          <div k-type="3" class="card">${lang.FW_TRP_HIDDEN}</div>
          <div class="card-help">${lang.ARROW_ALL}</div>
        </div>
      </div>
    </div>`
    this.eboard = qutor(".board", this.el) as HTMLDivElement
  }
  async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    const btnChanges = this.el.querySelectorAll(".con-list .card") as NodeListOf<HTMLDivElement>

    btnChanges.forEach((btn) => {
      btn.onclick = () => {
        if (btn.getAttribute("k-type") === currentPage) return
        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: Date.now().toString() } })
        const attr = btn.getAttribute("k-type")!
        currentPage = attr
        this.activatedBtn(btn)
        this.writeItems(attr)
      }
    })

    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  activatedBtn(btn?: HTMLDivElement): void {
    const btnSelecteds = this.el.querySelectorAll(".con-list .card.selected")
    btnSelecteds.forEach((el) => el.classList.remove("selected"))
    if (!btn) btn = qutor(`.con-list .card[k-type="${currentPage}"]`, this.el) as HTMLDivElement
    btn.classList.add("selected")
  }
  updateBtn(): void {
    const unreads = db.trophies.unclaimeds.map((k) => k.id)
    const groups: ITrophiesGroups = {}
    unreads.forEach((k) => {
      const group = trophy_list[k as keyof typeof trophy_list].group
      groups[group] = true
    })

    const btns = this.el.querySelectorAll(".con-list .card")
    btns.forEach((btn) => {
      btn.classList.remove("unread")
      if (groups[btn.getAttribute("k-type")!]) {
        btn.classList.add("unread")
      }
    })
  }
  writeItems(ktype?: string): void {
    if (!ktype) ktype = currentPage
    const pageItems = Object.keys(trophy_list).filter((k) => trophy_list[k as keyof typeof trophy_list].group === ktype)
    const elistBefore = qutor(".item-list", this.el)
    if (elistBefore) elistBefore.remove()
    const elist = kel("div", "item-list")
    const pageList: ITrophiesPageList = { 1: [], 2: [], 3: [] }
    pageItems.forEach((itm) => {
      const card = itemCard(itm, trophy_list[itm as keyof typeof trophy_list])
      if (card.classList.contains("claimed")) {
        pageList[3].push(card)
      } else if (card.classList.contains("done")) {
        pageList[1].push(card)
        card.onclick = () => this.setClaim(itm, card)
      } else {
        pageList[2].push(card)
      }
      card.onmouseenter = () => {
        elist.querySelectorAll(".active").forEach((el) => el.classList.remove("active"))
        card.classList.add("active")
      }
    })
    Object.keys(pageList).forEach((k) => pageList[k].forEach((card) => elist.append(card)))
    this.eboard.append(elist)
    const firstCard = elist.firstElementChild
    if (firstCard) firstCard.classList.add("active")
  }
  navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) return
      if (this.isLocked) return
      e.preventDefault()

      const conList = this.el.querySelector(".con-list") as HTMLDivElement
      const boardList = this.el.querySelector(".board .item-list") as HTMLDivElement

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const buttons = Array.from(conList.querySelectorAll(".card")) as HTMLDivElement[]
        if (buttons.length < 1) return
        const currentIndex = buttons.findIndex((btn) => btn.classList.contains("selected"))
        let nextIndex
        if (e.key === "ArrowRight") {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % buttons.length
        } else {
          nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1
        }
        buttons[nextIndex]?.click()
        return
      }

      if (!boardList) return
      if (e.key === "Enter") {
        const activeCard = qutor(".card.active", boardList)
        activeCard?.click()
        return
      }

      const cards = Array.from(boardList.querySelectorAll(".card"))
      if (cards.length < 1) return
      const currentIndex = cards.findIndex((card) => card.classList.contains("active"))
      let nextIndex
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cards.length
      } else {
        nextIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1
      }
      cards[currentIndex]?.classList.remove("active")
      const nextCard = cards[nextIndex]
      if (nextCard) {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
        nextCard.classList.add("active")

        // @ts-expect-error no default types
        nextCard.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  async setClaim(itm_id: string, card: HTMLDivElement): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
    this.isLocked = true
    const trophyClaim = await modal.loading(xhr.post(`/x/account/trophy-claim/${itm_id}`))
    if (!trophyClaim.ok) {
      await modal.alert(lang[trophyClaim.msg] || lang.ERROR)
      this.isLocked = false
      return
    }

    db.bag.bulkUpdate(trophyClaim.data)

    const newTrophyData = db.trophies.get(itm_id)!
    db.trophies.update({
      ...newTrophyData,
      claimed: true,
      ts: Date.now()
    })

    card.classList.add("claimed")
    this.writeItems(currentPage)
    this.updateBtn()
    this.isLocked = false

    const rewardSplash = new Rewards({
      onComplete: this.onComplete,
      itemList: trophyClaim.data,
      classBefore: this
    })
    this.destroy(rewardSplash)
  }
  async writeDetail(): Promise<void> {
    this.activatedBtn()
    this.updateBtn()
    this.writeItems(currentPage)
    this.btnListener()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    this.el.classList.add("out")
    this.esc?.unbind()
    await waittime()
    this.el.remove()
    this.isLocked = false
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.writeDetail()
    this.navKeyListener()
  }
}
