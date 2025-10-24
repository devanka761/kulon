import mission_list from "../../../../public/json/main/missions.json"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import itemRun from "../Props/itemRun"
import { IPMC, IPMCConfig, IUser } from "../types/db.types"
import { IInvites, IJob } from "../types/job.types"
import { ISival, SSKelement } from "d:/dvnkz/newKulon/2025-10-16/src/frontend/scripts/types/lib.types"

function fieldOnBoard(user: IUser, job: IJob): HTMLDivElement {
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
    <div class="btn btn-accept"><span class="keyinfo">space</span> ${lang.JOB_ACCEPT}</div>
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
  short_desc.innerText = mission.name
  summary.innerText = mission.desc[LocalList.lang!]
  return field
}

function emptyOnBoard(helptext: string, newic: string): HTMLDivElement {
  const card = kel("div", "empty-board")
  card.innerHTML = `<div class="board-icon"><i class="fa-regular fa-${newic}"></i></div><p>${lang[helptext] || helptext}</p>`
  return card
}

interface ITeamConfig extends IPMCConfig {
  onComplete: () => void
  classBefore: IPMC
  game: Game
}

export default class Team implements IPMC {
  id: string = "team"
  isLocked: boolean = false
  onComplete: () => void
  classBefore: IPMC
  private game: Game

  private el!: HTMLDivElement
  private esc?: KeyPressListener
  private space?: KeyPressListener

  private boxInvite: string[] = []
  private cardlist!: SSKelement
  private eboard!: SSKelement
  private btnSearch!: SSKelement
  private inpSearch!: HTMLInputElement
  private form!: HTMLFormElement
  private listNavHandler?: (...args: ISival) => ISival

  constructor(config: ITeamConfig) {
    this.onComplete = config.onComplete
    this.game = config.game
    this.classBefore = config.classBefore
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-jobs")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-envelope"></i> ${lang.PHONE_TEAM}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="search">
          <form class="form" action="/x/job/find" method="get" id="job-search">
            <div class="inp">
              <span class="keyinfo">t</span>
              <input type="number" maxlength="6" min="0" max="999999" name="job_code" id="job_code" autocomplete="off" placeholder="${lang.TM_INP_TEXT}" />
            </div>
            <button type="submit" class="btn-search disabled"><span class="keyinfo">enter</span> ${lang.FR_BTN_FIND}</button>
          </form>
        </div>
        <div class="board">
        </div>
      </div>
    </div>`
    // this.cardlist = qutor(".con-list", this.el)
    this.eboard = futor(".board", this.el)
    this.btnSearch = futor(".btn-search", this.el)
    this.inpSearch = futor("#job_code", this.el) as HTMLInputElement
    this.form = futor("#job-search", this.el) as HTMLFormElement
  }
  private updateBtnFind(): void {
    this.inpSearch.value = this.inpSearch.value.substring(0, 6).replace(/\D/g, "")
    if (this.isLocked) return
    if (this.inpSearch.value.length === 6) {
      this.btnSearch.classList.remove("disabled")
    } else {
      this.btnSearch.classList.add("disabled")
    }
  }
  private formListener(): void {
    this.form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      if (this.inpSearch.value.length !== 6) return this.writeEmpty("TM_HOW_TO", "people-group")
      this.isLocked = true
      this.writeEmpty("LOADING", "circle-notch fa-spin")
      this.btnSearch.classList.add("disabled")
      const formData = new FormData(this.form)
      const data: { [key: string]: string } = {}
      formData.forEach((val, key) => {
        data[key] = val.toString()
      })
      const teamCode = await xhr.get(`/x/job/find/${data.job_code}`)

      await waittime(1000, 5)

      if (!teamCode.ok) {
        this.writeEmpty(teamCode?.msg || "TM_NOT_FOUND", "users-slash")
        this.isLocked = false
        this.updateBtnFind()
        return
      }

      this.isLocked = false

      this.updateBtnFind()

      this.writeJob(teamCode.data)
    }

    this.inpSearch.oninput = () => this.updateBtnFind()
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
      if (this.isLocked) return
      if (e.key !== "t" && e.key !== "T") return
      const isInputFocused = document.activeElement?.tagName === "INPUT"
      if (isInputFocused) return

      e.preventDefault()
      this.inpSearch.focus()
      return
    }
    document.addEventListener("keydown", this.listNavHandler)
  }
  private writeJob(invite: IInvites): void {
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
  private setClaimable(field: HTMLDivElement, { job }: IInvites): void {
    this.space?.unbind()
    const btnAccept = futor(".btn-accept", field)
    btnAccept.onclick = async () => {
      if (this.isLocked) return
      this.destroy(
        itemRun.run("joinJob", {
          onComplete: this.onComplete,
          game: this.game,
          classBefore: this,
          mission: mission_list.find((k) => k.id === job.mission),
          code: job.code
        }) as IPMC
      )
    }

    this.space = new KeyPressListener("space", () => {
      btnAccept.click()
    })
  }
  private writeEmpty(helptext = "TM_HOW_TO", newic = "people-group"): void {
    if (!this.eboard.classList.contains("empty")) {
      this.eboard.classList.add("empty")
    }
    const fieldBefore = this.eboard.querySelector(".field")
    if (fieldBefore) fieldBefore.remove()
    const emptyBefore = this.eboard.querySelector(".empty-board")
    if (emptyBefore) emptyBefore.remove()
    const emptyField = emptyOnBoard(helptext, newic)
    this.eboard.append(emptyField)
  }
  private async resetInput(): Promise<void> {
    this.inpSearch.readOnly = true
    await waittime()
    this.inpSearch.focus()
    this.inpSearch.readOnly = false
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.esc?.unbind()
    this.space?.unbind()
    document.removeEventListener("keydown", this.listNavHandler!)
    this.boxInvite = []
    await waittime()
    this.inpSearch.oninput = null
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
    this.resetInput()
    this.writeEmpty()
    this.btnListener()
    this.formListener()
    this.listNavListener()
  }
}
