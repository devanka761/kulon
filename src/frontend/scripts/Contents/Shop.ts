import cloud_items from "../../../../public/json/items/cloud_items.json"
import shop_items from "../../../../public/json/items/shop_items.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import socket from "../lib/Socket"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC } from "../types/DBTypes"
import { IShopItem } from "../types/ItemTypes"
import { IAny, SSKelement } from "../types/LibTypes"
import Donate from "./Donate"
import { Exchange } from "./Exchange"

let currentPage: string = "0"

function itemCard(s: IAny): HTMLDivElement {
  const item = cloud_items.find((itm) => itm.id === s.id)!
  const card = kel("div", "card")
  card.innerHTML = `
  <div class="amount">${s.amount} ${s.bonus ? "+ " + s.bonus : ""}</div>
  <div class="icon"><img src="${asset[item.src].src}" alt="${item.name[LocalList.lang!]}"/></div>
  <div class="price">
    <span>${s.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
  </div>`
  const exreq = cloud_items.find((itm) => itm.id === s.req)
  const eprice = futor(".price", card)
  if (exreq) {
    const imgPrice = new Image()
    imgPrice.src = asset[exreq.src].src
    imgPrice.alt = exreq.name[LocalList.lang!]
    eprice.prepend(imgPrice)
  } else {
    eprice.prepend("Rp")
  }
  return card
}

interface IShopConfig {
  onComplete: () => void
  classBefore: IPMC
}

export default class Shop implements IPMC {
  id: string = "shop"
  isLocked: boolean = false
  onComplete: () => void
  classBefore: IPMC

  private el!: HTMLDivElement

  private navKeyHandler?: (...args: IAny) => IAny
  private enter?: KeyPressListener
  private esc?: KeyPressListener

  private itemContainer!: SSKelement
  private itemDetail!: SSKelement
  private currentFocus: "left" | "right" = "left"

  constructor(config: IShopConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-shop")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-shopping-bag"></i> ${lang.PHONE_SHOP}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="con-list">
          <button k-type="0" class="card">${lang.SHP_BAR_EXCHANGE}</button>
          <button k-type="1" class="card">${lang.SHP_BAR_DECORATION}</button>
          <button k-type="9" class="card">${lang.SHP_BAR_DONATE}</button>
          <div class="card-help">${lang.ARROW_ALL}</div>
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
            <div class="item-list blur">
            </div>
          </div>
          <div class="detail">
          </div>
        </div>
      </div>
    </div>`
    this.itemContainer = futor(".item-container", this.el)
    this.itemDetail = futor(".detail", this.el)
  }
  private setFocus(target: "left" | "right") {
    this.currentFocus = target
    const itemList = qutor(".item-list", this.el)!
    if (target === "left") {
      itemList.classList.add("blur")
    } else {
      itemList.classList.remove("blur")
    }
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    const btnChanges = this.el.querySelectorAll(".con-list .card") as NodeListOf<HTMLDivElement>
    btnChanges.forEach((btn) => {
      btn.onclick = () => {
        if (btn.getAttribute("k-type") === currentPage) return
        this.setFocus("left")
        audio.emit({ action: "play", type: "ui", src: "ui02", options: { id: Date.now().toString() } })
        currentPage = btn.getAttribute("k-type")!
        this.activatedBtn(btn)
        this.writeItems(btn.getAttribute("k-type")!)
      }
    })

    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  private updateEconomies(): void {
    const eperisma = futor(".economies .eco-perisma i", this.el)
    const etoken = futor(".economies .eco-token i", this.el)

    const xperisma = db.bag.findOne("69")
    const xtoken = db.bag.findOne("420")

    eperisma.innerHTML = (xperisma?.amount || 0).toString()
    etoken.innerHTML = (xtoken?.amount || 0).toString()
  }
  private activatedBtn(btn?: SSKelement): void {
    const btnSelecteds = this.el.querySelectorAll(".con-list .card.selected")
    btnSelecteds.forEach((el) => el.classList.remove("selected"))
    if (!btn) btn = futor(`.con-list .card[k-type="${currentPage}"]`, this.el)
    btn!.classList.add("selected")
  }
  private writeItems(ktype?: string): void {
    const pageItems = shop_items.filter((k) => k.group === ktype)

    const elistBefore = qutor(".item-list", this.el)
    if (elistBefore) elistBefore.remove()
    const elist = kel("div", "item-list blur")
    pageItems.forEach((itm) => {
      const card = itemCard(itm)
      card.onclick = () => {
        this.setFocus("right")
        audio.emit({ action: "play", type: "ui", src: "ui02", options: { id: Date.now().toString() } })
        const cardSelecteds = this.el.querySelectorAll(".item-list .card.selected")
        cardSelecteds.forEach((el) => el.classList.remove("selected"))
        card.classList.add("selected")
        this.writeDesc(itm)

        // @ts-expect-error no default types
        card.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
      elist.append(card)
    })
    if (pageItems.length < 1) {
      elist.innerHTML = `<div class="center">~ COMING SOON ~</div>`
    }
    this.itemContainer.append(elist)

    this.writeDesc()
  }
  private writeDesc(s?: IShopItem): void {
    this.enter?.unbind()

    if (!s) s = { id: "null", _n: "null", amount: -1, group: "-1", price: -1, req: "null" }
    const fieldBefore = qutor(".field", this.itemDetail)
    if (fieldBefore) fieldBefore.remove()
    const item = cloud_items.find((itm) => itm.id === s.id)!
    const field = kel("div", "field")
    field.innerHTML = `
    <div class="item-name">${item.name[LocalList.lang!]}</div>
    <div class="item-desc">${item.desc[LocalList.lang!]}</div>
    <div class="item-note">${s.id === "null" ? "" : lang.ITM_PERMANENT}</div>
    <div class="item-actions"></div>`

    if (s.id !== "null") {
      const btnBuy = kel("div", "btn btn-buy")
      btnBuy.innerHTML = lang.SHP_USE
      const itmAct = futor(".item-actions", field)
      btnBuy.onclick = async () => {
        audio.emit({ action: "play", type: "ui", src: "ui05", options: { id: "ui05" } })
        if (s.group === "0") {
          const exchange = new Exchange({
            onComplete: this.onComplete,
            classBefore: this,
            item_id: s.id
          })
          await this.destroy(exchange)
        } else {
          if (!db.trophies.isDone("sawercoy")) socket.send("openDonateMenu")
          const donate = new Donate({
            classBefore: this,
            onComplete: this.onComplete,
            item_id: s._n
          })
          await this.destroy(donate)
        }
      }

      itmAct.append(kel("span", "keyinfo", { e: "enter" }), btnBuy)
      this.enter = new KeyPressListener("enter", () => {
        if (this.currentFocus === "left") return
        btnBuy.click()
      })
    }

    this.itemDetail.append(field)
  }
  private navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
      if (this.isLocked) return

      e.preventDefault()

      if (this.currentFocus === "left") {
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
        } else if (e.key === "ArrowRight") {
          const cards = Array.from(this.el.querySelectorAll(".item-list .card")) as HTMLDivElement[]
          if (cards.length >= 1) {
            audio.emit({ action: "play", type: "ui", src: "ui05", options: { id: "ui05" } })

            const selectedBefore = cards.find((card) => card.classList.contains("selected"))
            if (selectedBefore) {
              selectedBefore.click()
            } else {
              cards[0].click()
            }
            this.setFocus("right")
          }
        }
      } else if (this.currentFocus === "right") {
        const cards = Array.from(this.el.querySelectorAll(".item-list .card")) as HTMLDivElement[]
        if (cards.length < 1) return
        const currentIndex = cards.findIndex((card) => card.classList.contains("selected"))
        if (currentIndex === -1) return

        if (e.key === "ArrowUp") {
          const nextIndex = currentIndex - 4
          if (nextIndex >= 0) cards[nextIndex].click()
        } else if (e.key === "ArrowDown") {
          const nextIndex = currentIndex + 4
          cards[nextIndex < cards.length ? nextIndex : cards.length - 1].click()
        } else if (e.key === "ArrowRight") {
          if (currentIndex % 4 !== 3) {
            const nextIndex = currentIndex + 1
            if (nextIndex < cards.length) cards[nextIndex].click()
          }
        } else if (e.key === "ArrowLeft") {
          if (currentIndex % 4 === 0) {
            audio.emit({ action: "play", type: "ui", src: "ui05", options: { id: "ui05" } })
            this.setFocus("left")
          } else {
            const nextIndex = currentIndex - 1
            if (nextIndex >= 0) cards[nextIndex].click()
          }
        }
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "uiclose", options: { id: "uiclose" } })
    this.isLocked = true
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    this.el.classList.add("out")
    this.enter?.unbind()
    await waittime()
    this.el.remove()
    this.isLocked = false
    this.esc?.unbind()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  async init(): Promise<void> {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "uiopen", options: { id: "uiopen" } })
    this.createElement()
    this.setFocus("left")
    eroot().append(this.el)
    this.btnListener()
    this.updateEconomies()
    this.activatedBtn()
    this.writeItems(currentPage)

    await waittime()

    this.navKeyListener()
  }
}
