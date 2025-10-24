import mission_list from "../../../../public/json/main/missions.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import sdate from "../lib/sdate"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import itemRun from "../Props/itemRun"
import { IPMC, IPMCConfig, IUser } from "../types/db.types"
import { IInvites, IJobInvite } from "../types/job.types"
import { ISival, SSKelement } from "../types/lib.types"

function cardOnList(user: IUser, job: IJobInvite): HTMLDivElement {
  const mission = mission_list.find((k) => k.id === job.mission)!
  const card = kel("div", "card")
  card.setAttribute("x-inv", user.id)
  card.innerHTML = `<div class="card-title">${user.username}</div><div class="card-desc"><i class="fa-solid fa-car-burst"></i> ${mission.name}</div>`
  return card
}

function cardHelp(): HTMLDivElement {
  const card = kel("div", "card-help")
  card.innerHTML = lang.ARROW_VERTICAL
  return card
}

function fieldOnBoard(user: IUser, job: IJobInvite): HTMLDivElement {
  const field = kel("div", "field")
  field.innerHTML = `
  <div class="snippet">
    <div class="avatar">
      <div class="hero">
      </div>
    </div>
    <div class="short">
      <p class="short-title"></p>
      <p class="short-desc"><i class="fa-solid fa-pen-nib"></i> </p>
    </div>
  </div>
  <div class="summary">
    <p class="summary-desc"></p>
  </div>
  <div class="actions">
    <div class="btn btn-ignore"><span class="keyinfo">delete</span> ${lang.JOB_IGNORE}</div>
    <div class="btn btn-accept"><span class="keyinfo">enter</span> ${lang.JOB_ACCEPT}</div>
  </div>`
  const mission = mission_list.find((k) => k.id === job.mission)!

  const ehero = futor(".avatar .hero", field)
  Object.values(user.skin).forEach((skin) => {
    const img = new Image()
    img.src = asset[skin].src
    img.alt = skin
    ehero.append(img)
  })

  const short_title = futor(".snippet .short-title", field)
  const short_desc = futor(".snippet .short-desc", field)
  const summary = futor(".summary .summary-desc", field)

  short_title.innerText = user.username
  short_desc.innerText = `${mission.name} - ${sdate.time(job.ts)}`
  summary.innerText = mission.desc[LocalList.lang!]
  return field
}

function emptyOnBoard(): HTMLDivElement {
  const card = kel("div", "empty-board")
  card.innerHTML = `<div class="board-icon"><i class="fa-regular fa-briefcase"></i></div><p>${lang.JOB_HOW_TO}</p>`
  return card
}

interface IJobsConfig extends IPMCConfig {
  onComplete: () => void
  classBefore: IPMC
  game: Game
}

export default class Jobs implements IPMC {
  id: string = "jobs"
  onComplete: () => void
  classBefore: IPMC
  isLocked: boolean = false
  private game: Game
  private boxInvite: string[] = []

  private el!: HTMLDivElement
  private cardlist!: SSKelement
  private eboard!: SSKelement

  private esc?: KeyPressListener
  private enter?: KeyPressListener
  private del?: KeyPressListener
  private listNavHandler?: (...args: ISival) => ISival

  constructor(config: IJobsConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.game = config.game
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-jobs")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-envelope"></i> ${lang.PHONE_JOBS}</div>
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
    this.cardlist = futor(".con-list", this.el)
    this.eboard = futor(".board", this.el)
  }
  private async btnListener(): Promise<void> {
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
  private listNavListener(): void {
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
      if (nextCard) nextCard.click()
    }
    document.addEventListener("keydown", this.listNavHandler)
  }
  private checkEmptyList(): void {
    if (this.boxInvite.length < 1) {
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
      if (this.boxInvite.includes(id_removed)) {
        this.boxInvite = this.boxInvite.filter((k) => k !== id_removed)
      }
      const card_to_remove = qutor(`.card[x-inv="${id_removed}"]`, this.cardlist)
      if (card_to_remove) card_to_remove.remove()
    }
    const inv_list = db.invites.getAll
    const new_ml = inv_list.filter((k) => !this.boxInvite.includes(k.user.id))
    new_ml.forEach((k) => {
      this.boxInvite.push(k.user.id)
      const card = cardOnList(k.user, k.job)
      card.onclick = () => {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        this.writeInvite(k)
        this.cardlist.querySelector(".ck")?.classList.remove("ck")
        card.classList.add("ck")
      }
      this.cardlist.prepend(card)
    })
    this.checkEmptyList()
  }
  private writeInvite(invite: IInvites): void {
    if (this.eboard.classList.contains("empty")) {
      this.eboard.classList.remove("empty")
    }
    const fieldBefore = qutor(".field", this.eboard)
    if (fieldBefore) fieldBefore.remove()
    const emptyBefore = qutor(".empty-board", this.eboard)
    if (emptyBefore) emptyBefore.remove()
    const field = fieldOnBoard(invite.user, invite.job)
    this.setClaimable(field, invite)
    this.eboard.append(field)
  }
  private async setClaimable(field: HTMLDivElement, { user, job }: IInvites): Promise<void> {
    this.enter?.unbind()
    this.del?.unbind()

    const btnIgnore = futor(".btn-ignore", field)
    btnIgnore.onclick = async () => {
      if (this.isLocked || !db.pmc) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      const conmsg = {
        id: "Tolak undangan?",
        en: "Ignore this job invitation?"
      }
      const ignoreConfirm = await modal.confirm({
        msg: conmsg[LocalList.lang!]
      })
      if (!ignoreConfirm) {
        this.isLocked = false
        return
      }
      db.invites.remove(job.id, user.id)
      this.isLocked = false
      this.updateList(user.id)
      this.writeEmpty()
    }
    const btnAccept = futor(".btn-accept", field)
    btnAccept.onclick = () => {
      if (this.isLocked || !db.pmc) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      db.invites.remove(job.id, user.id)
      this.destroy(
        itemRun.run("joinJob", {
          onComplete: this.onComplete,
          game: this.game,
          classBefore: this,
          mission: mission_list.find((k) => k.id === job.mission),
          invite: user.id
        }) as IPMC
      )
    }

    await waittime(500)

    this.enter = new KeyPressListener("enter", () => {
      btnAccept.click()
    })
    this.del = new KeyPressListener("delete", () => {
      btnIgnore.click()
    })
  }
  writeEmpty() {
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
  async destroy(next?: IPMC) {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    this.del?.unbind()
    this.esc?.unbind()
    document.removeEventListener("keydown", this.listNavHandler!)
    this.boxInvite = []
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
    this.writeEmpty()
    this.updateList()
    this.btnListener()
    this.listNavListener()
  }
}
