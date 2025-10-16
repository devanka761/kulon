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
import Rewards from "../Props/Rewards"

function drawImg(imgSrc, imgAlt) {
  const img = new Image()
  img.src = imgSrc
  img.alt = imgAlt
  return img
}

export class Exchange {
  constructor({ onComplete, classBefore, item_id }) {
    this.onComplete = onComplete
    this.classBefore = classBefore
    this.item_id = item_id
    this.item_n = 0
    this.req_n = 0
    this.navKeyHandler = null
    this.enter = null
    this.isLocked = false
  }
  createElement() {
    this.el = kel("div", "fuwi f-exchange")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-right-left"></i> ${lang.EXC_TITLE}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <form class="form" action="/x/exchange-items" method="post" id="exchange-form">
          <div class="field">
            <div class="economies">
              <div class="eco eco-amount">
                <span>0</span>
              </div>
              <div class="eco eco-price">
                <span>0</span>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="con-area">
              <div class="img img-price">
              </div>
              <div class="text"><i class="fa-solid fa-angles-right"></i></div>
              <div class="img img-amount">
              </div>
            </div>
          </div>
          <div class="field">
            <div class="con-area">
              <p>${lang.EXC_CONVERT_TO}</p>
            </div>
          </div>
          <div class="field">
            <div class="text-box">
              <span>0</span>
            </div>
          </div>
          <div class="field">
            <div class="input-manager">
              <div class="btn btn-minus">
                <i class="fa-solid fa-minus fa-fw"></i>
                <span class="keyinfo"><i class="fa-solid fa-chevron-left fa-fw"></i></span>
              </div>
              <div class="inp"><input type="range" name="exchange-inp" id="exchange-inp" min="1" value="1"/></div>
              <div class="btn btn-plus">
                <i class="fa-solid fa-plus fa-fw"></i>
                <span class="keyinfo"><i class="fa-solid fa-chevron-right fa-fw"></i></span>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="price">
              <div class="text">${lang.EXC_PRICE}:</div>
              <div class="object">
                <span>0</span>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="actions">
              <div class="btn-outer outer-cancel">
                <span class="keyinfo">Esc</span>
                <div class="btn btn-cancel btn-close">${lang.CANCEL}</div>
              </div>
              <div class="btn-outer outer-ok">
                <span class="keyinfo">Enter</span>
                <div class="btn btn-ok">${lang.EXC_BTN_OK}</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>`
    this.eaction = qutor(".actions", this.el)
    this.btnSubmit = qutor(".outer-ok", this.el)
  }
  async btnListener() {
    const btnCloses = this.el.querySelectorAll(".btn-close")
    btnCloses.forEach(
      (btn) =>
        (btn.onclick = () => {
          this.destroy(this.classBefore)
        })
    )

    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      this.destroy(this.classBefore)
    })
  }
  updateEconomies() {
    const itemToShop = shop_items.find((k) => k.id === this.item_id)
    this.req_id = itemToShop.req
    this.amount = itemToShop.amount
    this.price = itemToShop.price

    const eeco1 = qutor(".economies .eco-amount", this.el)
    const eeco2 = qutor(".economies .eco-price", this.el)

    this.item_src1 = cloud_items.find((k) => k.id === this.item_id)
    this.item_src2 = cloud_items.find((k) => k.id === this.req_id)

    eeco1.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.alt))
    eeco2.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.alt))

    const xeco1 = db.bag.find(this.item_id).map((k) => k.amount || 0)
    const xeco2 = db.bag.find(this.req_id).map((k) => k.amount || 0)

    const aeco1 = qutor(".economies .eco-amount span", this.el)
    const aeco2 = qutor(".economies .eco-price span", this.el)

    this.item_n = xeco1.reduce((a, b) => a + b, 0)
    this.req_n = xeco2.reduce((a, b) => a + b, 0)

    aeco1.innerHTML = this.item_n
    aeco2.innerHTML = this.req_n

    const exch1 = qutor(".con-area .img.img-amount", this.el)
    const exch2 = qutor(".con-area .img.img-price", this.el)
    exch1.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.alt))
    exch2.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.alt))

    const eamt = qutor(".text-box", this.el)
    const eprc = qutor(".price .object", this.el)
    eamt.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.alt))
    eprc.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.alt))
  }
  _updateExchangeValues() {
    if (this.maxTransactions < 1) {
      this.eamount.innerHTML = this.amount
      this.eprice.innerHTML = this.price
      return
    }

    audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })

    const transactionCount = Number(this.erange.value)
    const amountToReceive = transactionCount * this.amount
    this.priceAmount = transactionCount * this.price

    this.eamount.innerHTML = amountToReceive
    this.eprice.innerHTML = this.priceAmount
  }

  _decrementRange() {
    if (this.maxTransactions < 1) return
    this.erange.value = Math.max(Number(this.erange.min), Number(this.erange.value) - 1)
    this._updateExchangeValues()
  }

  _incrementRange() {
    if (this.maxTransactions < 1) return
    this.erange.value = Math.min(Number(this.erange.max), Number(this.erange.value) + 1)
    this._updateExchangeValues()
  }

  navKeyListener() {
    this.navKeyHandler = (e) => {
      if (this.isLocked) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        this._decrementRange()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        this._incrementRange()
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }

  _setupExchangeControls() {
    this.maxTransactions = Math.floor(this.req_n / this.price)

    this.erange = qutor("#exchange-inp", this.el)
    this.eamount = qutor(".text-box span", this.el)
    this.eprice = qutor(".price .object span", this.el)
    const btnMinus = qutor(".btn-minus", this.el)
    const btnPlus = qutor(".btn-plus", this.el)

    this.erange.max = this.maxTransactions
    this.erange.min = this.maxTransactions > 0 ? 1 : 0
    this.erange.value = this.erange.min

    this.erange.oninput = () => this._updateExchangeValues()
    btnMinus.onmousedown = () => this._decrementRange()
    btnPlus.onmousedown = () => this._incrementRange()

    this.btnSubmit.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      if (this.maxTransactions < 1) {
        await modal.alert(lang.EXC_NOT_ENOUGH.replace("{price}", this.item_src2.name[LocalList.lang]))
        this.isLocked = false
        return
      }
      const cvrtext = {
        msg: {
          id: "Sudah yakin?<br/>Setelah berhasil, penukaran tidak dapat dikembalikan",
          en: "Continue?<br/>You cannot undone the convertion once it completed"
        },
        okx: {
          id: "LANJUT",
          en: "CONVERT NOW"
        }
      }
      const convertConfirm = await modal.confirm({
        msg: cvrtext.msg[LocalList.lang],
        okx: cvrtext.okx[LocalList.lang]
      })
      if (!convertConfirm) {
        this.isLocked = false
        return
      }
      const convertResult = await modal.loading(
        xhr.post("/x/account/exchange", {
          item_id: this.item_id,
          amount: Number(this.erange.value)
        })
      )
      if (!convertResult.ok) {
        await modal.alert(lang[convertResult.msg]?.replace("{price}", this.item_src2.name[LocalList.lang]) || lang.ERROR)
        this.isLocked = false
        return
      }

      db.bag.bulkUpdate(convertResult.data)
      this.isLocked = false

      const rewardSplash = new Rewards({
        onComplete: this.onComplete,
        itemList: convertResult.data,
        classBefore: this.classBefore
      })
      this.destroy(rewardSplash)
    }

    if (this.maxTransactions < 1) {
      qutor(".field .price", this.el)?.classList.add("minus")
      this.eaction.classList.add("single")
      this.btnSubmit.remove()
    } else {
      this.enter = new KeyPressListener("enter", () => {
        this.btnSubmit.click()
      })
    }

    this._updateExchangeValues()
  }
  async destroy(next) {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.item_n = 0
    this.req_n = 0
    this.el.classList.add("out")
    this.enter?.unbind()
    document.removeEventListener("keydown", this.navKeyHandler)
    this.navKeyHandler = null
    this.esc?.unbind()
    await waittime()
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
    this.btnListener()
    this.updateEconomies()
    this._setupExchangeControls()
    this.navKeyListener()
  }
}
