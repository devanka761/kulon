import qrcode from "qrcode"
import db from "../data/db"
import lang from "../data/language"
import { eroot, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import Mails from "./Mails"
import { KeyPressListener } from "../main/KeyPressListener"
import audio from "../lib/AudioHandler"

export default class Invoice {
  constructor(config) {
    this.id = "invoice"
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.detail = config.detail
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
            <div class="nh">ID: #${this.detail.orderId}</div>
          </div>
          <div class="field">
            <div class="input">
              <div class="nc">
                <canvas class="qrcode" width="200" height="200">${lang.LOADING}</canvas>
                <p>${lang.DN_TXT_HELP}</p>
              </div>
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
              <div class="label">${lang.DN_TXT_EXPIRY}:</div>
              <div class="value" x-exd="expire"><span></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>`
    this.eprice = qutor(`[x-prc]`, this.el)
    this.lexpiry = qutor(`[x-exd]`, this.el)
    this.eqr = qutor(".qrcode", this.el)
  }
  async writeDetail() {
    this.eprice.innerHTML = "Rp" + this.detail.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    this.lexpiry.innerHTML = new Date(this.detail.expiry).toLocaleString()

    const qrString = this.detail.qr || this.detail.actions[0].url
    await qrcode.toCanvas(this.eqr, qrString, { width: 200, color: { light: "#a395e8", dark: "#0b111d" } })
    this.eqr.innerHTML = ""
  }
  async btnListener() {
    const btnClose = qutor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    await waittime()
    this.esc = new KeyPressListener("escape", () => btnClose.click())
  }
  async settlement() {
    await modal.abort()
    this.isLocked = true
    const openMail = await modal.confirm({
      msg: lang.DN_SETTLEMENT,
      okx: lang.DN_NOW_SETTLEMENT,
      cancelx: lang.DN_LATER_SETTLEMENT,
      ic: "circle-check"
    })
    this.isLocked = false
    if (!openMail) return
    const mail = new Mails({ onComplete: this.onComplete, classBefore: this.classBefore })
    this.destroy(mail)
  }
  async destroy(next) {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.esc?.unbind()
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
