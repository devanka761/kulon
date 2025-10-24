import cloud_items from "../../../../public/json/items/cloud_items.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import sdate from "../lib/sdate"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import Rewards from "../Props/Rewards"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ISival } from "../types/lib.types"
import { IMail } from "../types/mail.types"

function cardOnList(s: IMail): HTMLDivElement {
  const card = kel("div", "card")
  card.setAttribute("x-mail", s.id)
  card.innerHTML = `<div class="card-title">${s.title[LocalList.lang!]}</div><div class="card-desc"><i class="fa-solid fa-pen-nib"></i> ${s.sub[LocalList.lang!]}</div>`
  return card
}

function cardHelp() {
  const card = kel("div", "card-help")
  card.innerHTML = lang.ARROW_VERTICAL
  return card
}

function fieldOnBoard(s: IMail): HTMLDivElement {
  const field = kel("div", "field")
  field.innerHTML = `
  <div class="snippet">
    <div class="short">
      <p class="short-title"></p>
      <p class="short-note"><i class="fa-solid fa-pen-nib"></i> </p>
    </div>
  </div>
  <div class="summary">
    <p class="summary-desc"></p>
  </div>
  <div class="rewards">
    <div class="reward-title">${lang.MAIL_ATTACHMENTS}</div>
    <div class="reward-list"></div>
  </div>
  <div class="actions">
    <span class="keyinfo">enter</span>
  </div>`
  const short_title = futor(".snippet .short-title", field)
  const short_note = futor(".snippet .short-note", field)
  const summary = futor(".summary .summary-desc", field)
  const reward_list = futor(".reward-list", field)

  short_title.innerText = s.title[LocalList.lang!]
  short_note.append(`${s.sub[LocalList.lang!]} - ${sdate.datetime(s.ts)}`)
  summary.innerText = s.text[LocalList.lang!]

  s.rewards.forEach((r) => {
    const item = cloud_items.find((itm) => itm.id === r.id)!
    const card = kel("div", "card")
    card.innerHTML = `
    ${r.expiry ? '<div class="expire"></div>' : ""}
    <div class="icon">
      <img src="${asset[item.src].src}" alt="${item.name[LocalList.lang!]}"/>
    </div>
    <div class="amount">${r.amount}</div>`
    reward_list.append(card)
  })

  return field
}

function emptyOnBoard(): HTMLDivElement {
  const card = kel("div", "empty-board")
  card.innerHTML = `<div class="board-icon"><i class="fa-regular fa-envelope"></i></div><p>${lang.MAIL_HOW_TO}</p>`
  return card
}

interface IMailConfig extends IPMCConfig {
  onComplete: () => void
}

export default class Mails implements IPMC {
  id: string = "mails"
  isLocked: boolean = false
  onComplete: () => void
  classBefore?: IPMC

  private el!: HTMLDivElement
  private esc?: KeyPressListener
  private enter?: KeyPressListener

  private cardlist!: HTMLDivElement
  private eboard!: HTMLDivElement

  private boxMail: string[] = []

  private listNavHandler?: (...args: ISival) => void

  constructor(config: IMailConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
  }
  createElement(): void {
    this.el = kel("div", "fuwi f-jobs")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-envelope"></i> ${lang.PHONE_MAIL}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="con-list">
        </div>
        <div class="board">
        </div>
      </div>
    </div>`
    this.cardlist = futor(".con-list", this.el) as HTMLDivElement
    this.eboard = futor(".board", this.el) as HTMLDivElement
  }
  async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  listNavListener(): void {
    this.listNavHandler = (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
      if (this.isLocked) return

      e.preventDefault()

      const cards = Array.from(this.cardlist.querySelectorAll(".card")) as HTMLDivElement[]
      if (cards.length < 1) return

      const currentIndex = cards.findIndex((card) => card.classList.contains("ck"))

      let nextIndex
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cards.length
      } else {
        nextIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1
      }

      const nextCard = cards[nextIndex]
      if (nextCard) {
        nextCard.click()
      }
    }
    document.addEventListener("keydown", this.listNavHandler)
  }
  checkEmptyList(): void {
    if (this.boxMail.length < 1) {
      this.cardlist.innerHTML = `<div class="center"><p>~ ${lang.EMPTY} ~</p></div>`
    } else {
      const cards = Array.from(this.cardlist.querySelectorAll(".card")) as HTMLDivElement[]
      if (cards.length < 1) return
      cards[0].click()

      if (qutor(".card-help", this.cardlist)) return
      this.cardlist.append(cardHelp())
    }
  }
  updateList(id_removed?: string): void {
    if (id_removed) {
      if (this.boxMail.includes(id_removed)) {
        this.boxMail = this.boxMail.filter((k) => k !== id_removed)
      }
      const card_to_remove = qutor(`.card[x-mail="${id_removed}"]`, this.cardlist)
      if (card_to_remove) card_to_remove.remove()
    }
    const mail_list = db.mails.getAll
    const new_ml = mail_list.filter((k) => !this.boxMail.includes(k.id))
    new_ml.forEach((k) => {
      this.boxMail.push(k.id)
      const card = cardOnList(k)
      card.onclick = () => {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        this.writeMail(k.id)
        this.cardlist.querySelector(".ck")?.classList.remove("ck")
        card.classList.add("ck")
      }
      this.cardlist.prepend(card)
    })
    this.checkEmptyList()
  }
  writeMail(mailId: string): void {
    const mail = db.mails.get(mailId)!
    if (this.eboard.classList.contains("empty")) {
      this.eboard.classList.remove("empty")
    }
    const fieldBefore = qutor(".field", this.eboard)
    if (fieldBefore) fieldBefore.remove()
    const emptyBefore = qutor(".empty-board", this.eboard)
    if (emptyBefore) emptyBefore.remove()
    const field = fieldOnBoard(mail)!
    this.setClaimable(field, mail)
    this.eboard.append(field)
  }
  setClaimable(field: HTMLDivElement, s: IMail): void {
    this.enter?.unbind()
    const eactions = futor(".actions", field)
    const btnBefore = futor(".btn", eactions)
    if (btnBefore) btnBefore.remove()

    const btn = kel("div", "btn btn-claim")
    btn.innerHTML = `<i class="fa-solid fa-circle-down"></i> ${lang.MAIL_ACT_CLAIM}`

    btn.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true

      const updateMail = await modal.loading(xhr.post(`/x/account/mail-claim/${s.id}`))
      if (!updateMail.ok) {
        await modal.alert(lang[updateMail.msg] || lang.ERROR)
        this.isLocked = false
        return
      }
      db.bag.bulkUpdate(updateMail.data)
      db.mails.remove(s.id)
      this.updateList(s.id)
      this.writeEmpty()
      this.isLocked = false
      const rewardSplash = new Rewards({ onComplete: this.onComplete, itemList: updateMail.data, classBefore: this })
      this.destroy(rewardSplash)
    }
    this.enter = new KeyPressListener("enter", () => {
      btn.click()
    })
    eactions.append(btn)
  }
  writeEmpty(): void {
    if (!this.eboard.classList.contains("empty")) {
      this.eboard.classList.add("empty")
    }
    const fieldBefore = qutor(".field", this.eboard)
    if (fieldBefore) fieldBefore.remove()
    const emptyBefore = qutor(".empty-board", this.eboard)
    if (emptyBefore) return
    const emptyField = emptyOnBoard()
    this.eboard.append(emptyField)
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    this.esc?.unbind()
    document.removeEventListener("keydown", this.listNavHandler!)
    this.boxMail = []
    await waittime()
    db.pmc = undefined
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
    this.listNavListener()
    this.writeEmpty()
    this.updateList()
  }
}
