import cloud_items from "../../../../public/json/items/cloud_items.json"
import asset from "../data/assets"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"

export default class Rewards {
  constructor(config) {
    this.onComplete = config.onComplete
    this.itemList = config.itemList
    this.classBefore = config.classBefore || null
  }
  createElement() {
    this.el = kel("div", "Rewards")
    this.el.innerHTML = `
    <div class="box">
      <div class="rewards-title"><p>${lang.SP_TITLE}</p></div>
      <div class="list"></div>
      <div class="desc"><p>${lang.SP_DESC}</p></div>
    </div>`
    this.list = qutor(".list", this.el)
  }
  writeRewards() {
    this.itemList.forEach((r) => {
      const item = cloud_items.find((itm) => itm.id === (r.itemId || r.id))
      const amount = r.placeholder || r.amount
      const card = kel("div", "card")
      if (amount <= -1) card.classList.add("minus")
      if (r.expiry) card.append(kel("div", "expire"))
      const img = new Image()
      img.src = asset[item.src].src
      card.append(img)
      card.append(kel("div", "number", { e: amount }))
      this.list.append(card)
    })
  }
  async destroy(next) {
    this.el.classList.add("out")
    this.enter?.unbind()
    await waittime(500)
    this.el.remove()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  async init() {
    this.createElement()
    eroot().append(this.el)
    this.writeRewards()
    await waittime(700)
    audio.emit({ action: "play", type: "ui", src: "item_collected", options: { id: "item_collected" } })
    await waittime(300)
    this.enter = new KeyPressListener("enter", () => this.destroy(this.classBefore))
    this.el.onclick = () => this.destroy(this.classBefore)
  }
}
