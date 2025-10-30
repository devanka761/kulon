import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC, IPMCConfig, IUser } from "../types/db.types"
import { ISival, SSKelement } from "../types/lib.types"
import Profile from "./Profile"

function playerCard(usr: IUser): HTMLButtonElement {
  const card = kel("button", "card")
  card.setAttribute("x-uid", usr.id)
  card.innerHTML = `
  <div class="avatar">
    <div class="hero"></div>
  </div>
  <div class="uname"><span class="text">${usr.username}</span> <span class="keyinfo">enter</span></div>`
  const eskin = futor(".hero", card)
  Object.values(usr.skin).forEach((sk) => {
    const img = new Image()
    img.src = asset[sk].src
    img.alt = sk
    eskin.append(img)
  })
  return card
}

interface IFindConfig extends IPMCConfig {
  onComplete: () => void
  classBefore: IPMC
  users: IUser[]
}

export default class Find implements IPMC {
  id: string = "find"
  isLocked: boolean = false
  onComplete: () => void
  classBefore: IPMC
  private users: IUser[]

  private el!: HTMLDivElement
  private con!: SSKelement

  private esc?: KeyPressListener
  private navKeyHandler?: (...args: ISival) => ISival
  constructor(config: IFindConfig) {
    this.users = config.users
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.isLocked = false
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-people")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-users"></i> ${lang.FR_BTN_FIND}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="search">
          <form class="inp" action="/x/profile/find" method="get" id="player-search">
            <div class="inp-help"><span class="keyinfo">T</span></div>
            <input type="text" name="find_friend" id="find_friend" autocomplete="off" placeholder="${lang.FR_INP_PLC}" />
            <button type="submit"><span class="keyinfo">Enter</span> ${lang.FR_BTN_FIND}</button>
          </form>
        </div>
        <div class="board">
          <div class="board-list">
          </div>
        </div>
      </div>
    </div>`
    this.con = futor(".board-list", this.el)
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
  private writeData(): void {
    this.users.forEach((usr, i) => {
      const card = playerCard(usr)
      card.onclick = async () => {
        if (this.isLocked) return
        await this.destroy(
          new Profile({
            user: usr,
            onComplete: this.onComplete,
            classBefore: this
          })
        )
      }
      this.con.append(card)
      if (i === 0) {
        card.focus()
      }
    })
  }
  private formListener(): void {
    const inp = qutor("#find_friend", this.el) as HTMLInputElement

    const playerSearch = qutor("#player-search", this.el) as HTMLFormElement
    playerSearch.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      const searchUID = inp.value.replace(/\s/g, "")

      if (searchUID.length < 1) {
        this.isLocked = false
        return
      }

      if (searchUID.length < 4) {
        await modal.alert(lang.FR_MIN)
        this.isLocked = false
        return
      }

      if (searchUID.length > 40) {
        await modal.alert(lang.FR_MAX)
        this.isLocked = false
        return
      }

      const playerResult = await modal.loading(xhr.get(`/x/profile/find/${searchUID}?multiple=1`))

      if (!playerResult.ok) {
        await modal.alert(lang[playerResult.msg] || playerResult.msg || lang.ERROR)
        this.isLocked = false
        return
      }

      this.isLocked = false

      if (playerResult.data.users.length > 1) {
        return await this.destroy(
          new Find({
            users: playerResult.data.users,
            onComplete: this.onComplete,
            classBefore: this.classBefore
          })
        )
      }

      await this.destroy(
        new Profile({
          user: playerResult.data.users[0],
          onComplete: this.onComplete,
          classBefore: this
        })
      )
    }
  }
  navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (this.isLocked) return

      const { key } = e
      const isInputFocused = document.activeElement?.tagName === "INPUT"

      if (key.toLowerCase() === "t" && !isInputFocused) {
        e.preventDefault()
        qutor("#find_friend", this.el)?.focus()
        return
      }

      if (isInputFocused) {
        if (key === "ArrowDown") {
          e.preventDefault()
          const firstCard = qutor(".card", this.con)
          firstCard?.focus()
        }
        return
      }

      const validNavKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"]
      if (!validNavKeys.includes(key)) return

      e.preventDefault()
      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
        const cards = Array.from(this.con.querySelectorAll(".card")) as HTMLDivElement[]
        if (cards.length === 0) return

        const currentIndex = cards.findIndex((card) => card === document.activeElement)

        if (key === "ArrowUp" && currentIndex === 0) {
          qutor("#find_friend", this.el)?.focus()
          return
        }

        let nextIndex
        if (currentIndex === -1) {
          nextIndex = key === "ArrowDown" ? 0 : cards.length - 1
        } else {
          if (key === "ArrowRight") nextIndex = currentIndex + 1
          if (key === "ArrowLeft") nextIndex = currentIndex - 1
          if (key === "ArrowUp") nextIndex = currentIndex - 2
          if (key === "ArrowDown") nextIndex = currentIndex + 2
        }

        if (!nextIndex || nextIndex < 0) nextIndex = 0
        if (nextIndex >= cards.length) nextIndex = cards.length - 1

        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        cards[nextIndex].focus()

        // @ts-expect-error no default types
        cards[nextIndex].scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      } else if (key === "Enter") {
        if (document.activeElement instanceof HTMLElement && document.activeElement.matches(".card")) {
          document.activeElement.click()
        }
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = this
    this.esc?.unbind()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.btnListener()
    this.formListener()
    this.writeData()
    this.navKeyListener()
  }
}
