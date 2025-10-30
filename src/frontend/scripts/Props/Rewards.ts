import cloud_items from "../../../../public/json/items/cloud_items.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel } from "../lib/kel"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC, IPMCConfig } from "../types/db.types"
import { IItem } from "../types/item.types"
import { ISival } from "../types/lib.types"

export default class Rewards implements IPMC {
  onComplete: (...args: ISival[]) => ISival
  classBefore?: IPMC
  id: string = "rewards"
  private el: HTMLDivElement = kel("div", "Rewards")
  isLocked: boolean = false
  private itemList: IItem[]
  private list!: HTMLDivElement
  private enter?: KeyPressListener
  constructor(config: IPMCConfig) {
    this.onComplete = config.onComplete
    this.itemList = config.itemList as IItem[]
    this.classBefore = config.classBefore
  }
  private createElement(): void {
    this.el.innerHTML = `
    <div class="box">
      <div class="rewards-title"><p>${lang.SP_TITLE}</p></div>
      <div class="list"></div>
      <div class="desc"><p>${lang.SP_DESC}</p></div>
    </div>`
    this.list = futor(".list", this.el) as HTMLDivElement
  }
  private writeRewards() {
    this.itemList.forEach((r) => {
      const item = cloud_items.find((itm) => itm.id === (r.itemId || r.id))!
      const amount = r.placeholder || r.amount
      const card = kel("div", "card")
      if (amount <= -1) card.classList.add("minus")
      if (r.expiry) card.append(kel("div", "expire"))
      const img = new Image()
      img.src = asset[item.src].src
      card.append(img)
      card.append(kel("div", "number", { e: amount.toString() }))
      this.list.append(card)
    })
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    await waittime(500)
    this.el.remove()
    this.isLocked = false
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  async init() {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.writeRewards()
    await waittime(700)
    audio.emit({ action: "play", type: "ui", src: "item_collected", options: { id: "item_collected" } })
    await waittime(300)
    this.el.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }
    this.enter = new KeyPressListener("enter", () => this.el.click())
  }
}
