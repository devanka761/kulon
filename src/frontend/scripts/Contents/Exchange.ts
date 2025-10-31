import cloud_items from "../../../../public/json/items/cloud_items.json"
import shop_items from "../../../../public/json/items/shop_items.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import Rewards from "../Props/Rewards"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ICloudItem } from "../types/item.types"
import { ISival } from "../types/lib.types"

function drawImg(imgSrc: string, imgAlt: string): HTMLImageElement {
  const img = new Image()
  img.src = imgSrc
  img.alt = imgAlt
  return img
}

interface IExhcangeConfig extends IPMCConfig {
  onComplete: () => void
  classBefore: IPMC
  item_id: string
}

export class Exchange implements IPMC {
  id: string = "exchange"
  isLocked: boolean = false
  onComplete: () => void
  classBefore: IPMC

  private el!: HTMLDivElement
  private erange!: HTMLInputElement
  private eamount!: HTMLSpanElement
  private eprice!: HTMLSpanElement

  private item_id: string
  private req_id!: string
  private item_n: number = 0
  private req_n: number = 0

  private amount!: number
  private price!: number
  private maxTransactions!: number
  private priceAmount!: number

  private item_src1!: ICloudItem
  private item_src2!: ICloudItem

  private navKeyHandler?: (val: ISival) => ISival
  private enter?: KeyPressListener
  private esc?: KeyPressListener

  constructor(config: IExhcangeConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.item_id = config.item_id
    this.item_n = 0
    this.req_n = 0
    this.isLocked = false
  }
  private createElement(): void {
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
  }
  private async btnListener(): Promise<void> {
    const btnCloses = this.el.querySelectorAll(".btn-close") as NodeListOf<HTMLDivElement>
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
  private updateEconomies(): void {
    const itemToShop = shop_items.find((k) => k.id === this.item_id)!
    this.req_id = itemToShop.req
    this.amount = itemToShop.amount
    this.price = itemToShop.price

    const eeco1 = futor(".economies .eco-amount", this.el)
    const eeco2 = futor(".economies .eco-price", this.el)

    this.item_src1 = cloud_items.find((k) => k.id === this.item_id)!
    this.item_src2 = cloud_items.find((k) => k.id === this.req_id)!

    eeco1.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.id))
    eeco2.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.id))

    const xeco1 = db.bag.find(this.item_id).map((k) => k.amount || 0)
    const xeco2 = db.bag.find(this.req_id).map((k) => k.amount || 0)

    const aeco1 = futor(".economies .eco-amount span", this.el)
    const aeco2 = futor(".economies .eco-price span", this.el)

    this.item_n = xeco1.reduce((a, b) => a + b, 0)
    this.req_n = xeco2.reduce((a, b) => a + b, 0)

    aeco1.innerHTML = this.item_n.toString()
    aeco2.innerHTML = this.req_n.toString()

    const exch1 = futor(".con-area .img.img-amount", this.el)
    const exch2 = futor(".con-area .img.img-price", this.el)
    exch1.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.id))
    exch2.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.id))

    const eamt = futor(".text-box", this.el)
    const eprc = futor(".price .object", this.el)
    eamt.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.id))
    eprc.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.id))
  }
  private updateExchangeValues(): void {
    if (this.maxTransactions < 1) {
      this.eamount.innerHTML = this.amount.toString()
      this.eprice.innerHTML = this.price.toString()
      return
    }

    audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })

    const transactionCount = Number(this.erange.value)
    const amountToReceive = transactionCount * this.amount
    this.priceAmount = transactionCount * this.price

    this.eamount.innerHTML = amountToReceive.toString()
    this.eprice.innerHTML = this.priceAmount.toString()
  }

  private decrementRange(): void {
    if (this.maxTransactions < 1) return
    const target = Math.max(Number(this.erange.min), Number(this.erange.value) - 1)
    this.erange.value = target.toString()
    this.updateExchangeValues()
  }

  private incrementRange(): void {
    if (this.maxTransactions < 1) return
    const target = Math.min(Number(this.erange.max), Number(this.erange.value) + 1)
    this.erange.value = target.toString()
    this.updateExchangeValues()
  }

  private navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (this.isLocked) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        this.decrementRange()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        this.incrementRange()
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }

  private setupExchangeControls(): void {
    this.maxTransactions = Math.floor(this.req_n / this.price)

    this.erange = futor("#exchange-inp", this.el) as HTMLInputElement
    this.eamount = futor(".text-box span", this.el)
    this.eprice = futor(".price .object span", this.el)
    const btnMinus = futor(".btn-minus", this.el)
    const btnPlus = futor(".btn-plus", this.el)

    this.erange.max = this.maxTransactions.toString()
    this.erange.min = (this.maxTransactions > 0 ? 1 : 0).toString()
    this.erange.value = this.erange.min

    this.erange.oninput = () => this.updateExchangeValues()
    btnMinus.onpointerdown = () => this.decrementRange()
    btnPlus.onpointerdown = () => this.incrementRange()

    const btnSubmit = futor(".outer-ok", this.el)
    btnSubmit.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      if (this.maxTransactions < 1) {
        await modal.alert(lang.EXC_NOT_ENOUGH.replace("{price}", this.item_src2.name[LocalList.lang!]))
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
        msg: cvrtext.msg[LocalList.lang!],
        okx: cvrtext.okx[LocalList.lang!]
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
        await modal.alert(lang[convertResult.msg]?.replace("{price}", this.item_src2.name[LocalList.lang!]) || lang.ERROR)
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

    const eaction = futor(".actions", this.el)
    if (this.maxTransactions < 1) {
      qutor(".field .price", this.el)?.classList.add("minus")
      eaction.classList.add("single")
      btnSubmit.remove()
    } else {
      this.enter = new KeyPressListener("enter", () => {
        btnSubmit.click()
      })
    }

    this.updateExchangeValues()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.item_n = 0
    this.req_n = 0
    this.el.classList.add("out")
    this.enter?.unbind()
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
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
    this.btnListener()
    this.updateEconomies()
    this.setupExchangeControls()
    this.navKeyListener()
  }
}
