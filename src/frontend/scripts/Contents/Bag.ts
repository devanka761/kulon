import cloud_items from "../../../../public/json/items/cloud_items.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import { paperGet } from "../data/notes"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import sdate from "../lib/sdate"
import socket from "../lib/Socket"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import itemRun from "../Props/itemRun"
import { IPMC, IPMCConfig } from "../types/db.types"
import { IItem } from "../types/item.types"
import { ISival } from "../types/lib.types"

let currentPage: string = "1"
let expireInterval: ReturnType<typeof setInterval> | null = null

export function transformBagPage(newPage: string): void {
  if (!["0", "1", "2"].find((validPage) => validPage === newPage)) return
  currentPage = newPage
}

function itemCard(s: IItem): HTMLDivElement {
  const item = cloud_items.find((itm) => itm.id === s.itemId)!
  const card = kel("div", "card")
  card.innerHTML = `
  ${s.expiry ? '<div class="expire"></div>' : ""}
  <div class="icon"><img src="${asset[item.src].src}" alt="${item.name[LocalList.lang!]}"/></div>
  <div class="price">
    <span>${s.amount}</span>
  </div>`
  return card
}

function cardHelp(): HTMLDivElement {
  const card = kel("div", "card-help")
  card.innerHTML = lang.ARROW_ALL
  return card
}

interface IBagConfig extends IPMCConfig {
  classBefore: IPMC
}

interface IItemList {
  [key: string]: IItem
}

export class Bag implements IPMC {
  id: string = "bag"
  onComplete: () => void
  classBefore: IPMC
  isLocked: boolean = false
  private el!: HTMLDivElement

  private esc?: KeyPressListener
  private enter?: KeyPressListener
  private navKeyHandler?: (...args: ISival) => void

  private items?: IItemList
  private itemContainer!: HTMLDivElement
  private itemDetail!: HTMLDivElement
  private loaded: boolean = false

  constructor(config: IBagConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-shop f-backpack")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-backpack"></i> ${lang.PHONE_BACKPACK}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="con-list">
          <button k-type="0" class="card">${lang.ITM_BAR_JOURNEY}</button>
          <button k-type="1" class="card">${lang.ITM_BAR_PRECIOUS}</button>
          <button k-type="2" class="card">${lang.ITM_BAR_DECORATION}</button>
        </div>
        <div class="board">
          <div class="economies">
            <div class="eco eco-perisma">
              <img src="/assets/items/cloud/perismato.png" alt="perisma"/>
              <i>0</i>
            </div>
            <div class="eco eco-token">
              <img src="/assets/items/cloud/token.png" alt="token"/>
              <i>0</i>
            </div>
          </div>
          <div class="item-container">
            <div class="item-list">
            </div>
          </div>
          <div class="detail">
          </div>
        </div>
      </div>
    </div>`
    this.itemContainer = qutor(".item-container", this.el) as HTMLDivElement
    this.itemDetail = qutor(".detail", this.el) as HTMLDivElement
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)

    btnClose.onclick = () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
      this.destroy(this.classBefore)
    }

    const btnChanges = this.el.querySelectorAll(".con-list .card") as NodeListOf<HTMLDivElement>
    btnChanges.forEach((btn) => {
      btn.onclick = () => {
        if (btn.getAttribute("k-type") === currentPage) return

        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: Date.now().toString() } })
        currentPage = btn.getAttribute("k-type")!
        this.activatedBtn(btn)
        this.writeItems(btn.getAttribute("k-type")!)
      }
    })

    qutor(".con-list", this.el)?.append(cardHelp())

    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  private navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
      if (this.isLocked) return

      e.preventDefault()

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const buttons = Array.from(this.el.querySelectorAll(".con-list .card")) as HTMLDivElement[]
        if (buttons.length < 1) return

        const currentIndex = buttons.findIndex((btn) => btn.classList.contains("selected"))

        let nextIndex
        if (e.key === "ArrowDown") {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % buttons.length
        } else {
          nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1
        }

        const nextButton = buttons[nextIndex]
        if (nextButton) nextButton.click()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const cards = Array.from(this.el.querySelectorAll(".item-list .card")) as HTMLDivElement[]
        if (cards.length < 1) return
        const currentIndex = cards.findIndex((card) => card.classList.contains("selected"))
        let nextIndex
        if (e.key === "ArrowRight") {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cards.length
        } else {
          nextIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1
        }
        const nextCard = cards[nextIndex]
        if (nextCard) nextCard.click()
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  private updateEconomies(): void {
    const eperisma = futor(".economies .eco-perisma i", this.el)
    const etoken = futor(".economies .eco-token i", this.el)
    this.items = {}
    db.bag.getAll.forEach((item) => {
      this.items![item.id] = item
    })
    if (db.job && db.job.bag) {
      Object.keys(db.job.bag).forEach((k) => {
        this.items![k] = db.job.bag![k]
      })
    }

    const xperisma = db.bag.findOne("69")
    const xtoken = db.bag.findOne("420")

    eperisma.innerHTML = (xperisma?.amount || 0).toString()
    etoken.innerHTML = (xtoken?.amount || 0).toString()
  }
  private activatedBtn(btn?: HTMLDivElement): void {
    const btnSelecteds = this.el.querySelectorAll(".con-list .card.selected")
    btnSelecteds.forEach((el) => el.classList.remove("selected"))
    if (!btn) btn = qutor(`.con-list .card[k-type="${currentPage}"]`, this.el) as HTMLDivElement
    btn.classList.add("selected")
  }
  private writeItems(ktype: string): void {
    if (expireInterval) {
      clearInterval(expireInterval)
      expireInterval = null
    }
    const pageItems = Object.keys(this.items!).filter((k) => cloud_items.find((citm) => citm.id === this.items![k].itemId)!.group === ktype && (!this.items![k].expiry || this.items![k].expiry > Date.now()) && this.items![k].amount >= 1)

    const elistBefore = qutor(".item-list", this.el)
    if (elistBefore) elistBefore.remove()
    const elist = kel("div", "item-list")
    pageItems.forEach((itm) => {
      const card = itemCard(this.items![itm])
      card.onclick = () => {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        const cardSelecteds = this.el.querySelectorAll(".item-list .card.selected")
        cardSelecteds.forEach((el) => el.classList.remove("selected"))
        card.classList.add("selected")
        this.writeDesc({ ...this.items![itm] })

        // @ts-expect-error no default types
        card.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
      elist.append(card)
    })
    if (pageItems.length < 1) {
      elist.innerHTML = `<div class="center">~ ${lang.EMPTY} ~</div>`
    }
    this.itemContainer.append(elist)

    const firstElement = elist.firstElementChild as HTMLDivElement | null
    const isReady = firstElement && firstElement.classList.contains("card")

    if (!this.loaded && isReady) {
      setTimeout(() => firstElement.click(), 300)
      this.loaded = true
    } else if (isReady) {
      firstElement.click()
    } else {
      this.writeDesc()
    }
  }
  private writeDesc(s?: IItem): void {
    this.enter?.unbind()
    if (expireInterval) {
      clearInterval(expireInterval)
      expireInterval = null
    }
    if (!s) s = { itemId: "null", id: "null", amount: 0 }
    const fieldBefore = qutor(".field", this.itemDetail)
    if (fieldBefore) fieldBefore.remove()
    const item = { ...cloud_items.find((itm) => itm.id === s.itemId)! }

    if (item.id === "J00006") {
      const noteItem = paperGet(s.id!)!
      item.name = noteItem.name
    }

    const field = kel("div", "field")
    field.innerHTML = `
    <div class="item-name">${item.name[LocalList.lang!]}</div>
    <div class="item-desc">${item.desc[LocalList.lang!]}</div>
    <div class="item-note">${s.itemId === "null" ? "" : lang.ITM_PERMANENT}</div>
    <div class="item-actions"></div>`

    if (s.expiry) {
      let isValid = sdate.remain(s.expiry)
      const itmNote = futor(".item-note", field)
      itmNote.innerHTML = isValid ? `${lang.ITM_REMAIN} ${isValid}` : lang.ITM_EXPIRED

      expireInterval = setInterval(() => {
        isValid = sdate.remain(s.expiry || 0)
        itmNote.innerHTML = isValid ? `${lang.ITM_REMAIN} ${isValid}` : lang.ITM_EXPIRED
        if (!isValid) {
          if (!db.trophies.isDone("itemexpired")) socket.send("itemExpired", { id: s.id })
          clearInterval(expireInterval!)
          expireInterval = null
        }
      }, 1000)
    }
    if (item.run) {
      const btnBuy = kel("div", "btn btn-buy")
      btnBuy.innerHTML = lang.ITM_USE
      const itmAct = futor(".item-actions", field)
      btnBuy.onclick = async () => {
        if (this.isLocked) return
        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
        this.destroy(
          itemRun.run(item.run, {
            onComplete: this.onComplete,
            classBefore: this,
            itemId: item.id,
            id: s.id
          }) as IPMC
        )
      }
      itmAct.append(kel("span", "keyinfo", { e: "enter" }), btnBuy)
      this.enter = new KeyPressListener("enter", () => {
        btnBuy.click()
      })
    }

    this.itemDetail.append(field)
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    this.enter?.unbind()
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    if (expireInterval) {
      clearInterval(expireInterval)
      expireInterval = null
    }
    if (this.items) Object.assign(this.items, {})
    this.items = undefined
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    this.isLocked = false
    this.esc?.unbind()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  async init(): Promise<void> {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.btnListener()
    this.updateEconomies()
    this.activatedBtn()
    this.writeItems(currentPage)

    await waittime()

    this.loaded = true
    this.navKeyListener()
  }
}
