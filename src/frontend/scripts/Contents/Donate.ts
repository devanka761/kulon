import cloud_items from "../../../../public/json/items/cloud_items.json"
import shop_items from "../../../../public/json/items/shop_items.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC, IPMCConfig } from "../types/db.types"
import Invoice from "./Invoice"

function drawImg(imgSrc: string, imgAlt: string): HTMLImageElement {
  const img = new Image()
  img.src = imgSrc
  img.alt = imgAlt
  return img
}

interface IDonateConfig extends IPMCConfig {
  onComplete: () => void
  item_id: string
}

export default class Donate implements IPMC {
  id: string = "donate"
  isLocked: boolean = false
  onComplete: () => void
  classBefore?: IPMC
  private item_id: string

  private el!: HTMLDivElement
  private esc?: KeyPressListener
  private enter?: KeyPressListener

  constructor(config: IDonateConfig) {
    this.id = "donate"
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.item_id = config.item_id
  }
  private createElement(): void {
    this.el = kel("div", "fuwi kulonXmidtrans")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-duotone fa-regular fa-gem"></i> ${lang.DN_TITLE} - ${db.me.username}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="form">
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_BENEFIT}:</div>
              <div class="value" x-bf="benefit"><span></span></div>
            </div>
          </div>
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_PRICE}:</div>
              <div class="value" x-prc="price"><span></span></div>
            </div>
          </div>
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_PAYMD}:</div>
              <div class="nc"><img src="/images/qris.svg" alt="qris"/></div>
              <div class="label sm">${lang.DN_TXT_QRIS_NP}</div>
            </div>
          </div>
          <div class="field">
            <div class="np">${lang.DN_AGREEMENTS}</div>
          </div>
          <div class="field">
            <div class="btn btn-submit"><span class="keyinfo">enter</span> ${lang.DN_TXT_CONTINUE}</div>
          </div>
        </div>
      </div>
    </div>`
  }
  private writeDetail(): void {
    const sitem = shop_items.find((itm) => itm._n === this.item_id)!
    const item = cloud_items.find((itm) => itm.id === sitem.id)!

    const ebenefitAmt = futor(`[x-bf] span`, this.el)
    const ebenefitImg = futor(`[x-bf]`, this.el)
    const eprice = futor(`[x-prc]`, this.el)

    ebenefitAmt.innerHTML = `${sitem.amount}${sitem.bonus ? " + " + sitem.bonus : ""}`
    ebenefitImg.prepend(drawImg(asset[item.src].src, item.name[LocalList.lang!]))
    eprice.innerHTML = "Rp" + sitem.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    const btnSubmit = futor(".btn-submit", this.el)
    btnSubmit.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      const createInvoice = await modal.loading(xhr.post(`/x/donate/create/${this.item_id}`))
      if (createInvoice?.msg === "DN_PENDING") {
        const hasActive = await modal.confirm({
          msg: lang.DN_PENDING,
          okx: lang.DN_OPEN_PENDING,
          cancelx: lang.DN_CLOSE_PENDING
        })
        if (hasActive) {
          this.isLocked = false
          const invoice = new Invoice({
            classBefore: this.classBefore,
            onComplete: this.onComplete,
            detail: createInvoice.data
          })
          return this.destroy(invoice)
        }
        this.isLocked = false
        return this.destroy(this.classBefore)
      }
      if (!createInvoice.ok) {
        await modal.alert(lang[createInvoice.msg] || lang.ERROR)
        this.isLocked = false
        return
      }
      this.isLocked = false
      const invoice = new Invoice({
        classBefore: this.classBefore,
        onComplete: this.onComplete,
        detail: createInvoice.data
      })
      return this.destroy(invoice)
    }

    await waittime()

    this.enter = new KeyPressListener("enter", () => btnSubmit.click())
    this.esc = new KeyPressListener("escape", () => btnClose.click())
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.esc?.unbind()
    this.enter?.unbind()
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.writeDetail()
    this.btnListener()
  }
}
