import cloud_items from "../../../../public/json/items/cloud_items.json"
import shop_items from "../../../../public/json/items/shop_items.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import Invoice from "./Invoice"

function drawImg(imgSrc, imgAlt) {
  const img = new Image()
  img.src = imgSrc
  img.alt = imgAlt
  return img
}

export default class Donate {
  constructor(config) {
    this.id = "donate"
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.item_id = config.item_id
  }
  createElement() {
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
    this.ebenefitImg = qutor(`[x-bf]`, this.el)
    this.ebenefitAmt = qutor(`[x-bf] span`, this.el)
    this.eprice = qutor(`[x-prc]`, this.el)
  }
  writeDetail() {
    const sitem = shop_items.find((itm) => itm._n === this.item_id)
    const item = cloud_items.find((itm) => itm.id === sitem.id)
    this.ebenefitAmt.innerHTML = `${sitem.amount}${sitem.bonus ? " + " + sitem.bonus : ""}`
    this.ebenefitImg.prepend(drawImg(asset[item.src].src, item.name[LocalList.lang]))
    this.eprice.innerHTML = "Rp" + sitem.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }
  async btnListener() {
    const btnClose = qutor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    const btnSubmit = qutor(".btn-submit", this.el)
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
  async destroy(next) {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.esc?.unbind()
    this.enter?.unbind()
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = null
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.writeDetail()
    this.btnListener()
  }
}
