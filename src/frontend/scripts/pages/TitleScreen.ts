import metaData from "../../../config/version.json"
import backsong from "../APIs/BackSongAPI"
import Setting from "../Contents/Setting"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import notip from "../lib/notip"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ISival } from "../types/lib.types"

export default class TitleScreen implements IPMC {
  id = "titleScreen"
  isLocked: boolean = true
  onComplete: (...args: ISival) => ISival
  private game: Game
  private el!: HTMLDivElement

  private canvas!: HTMLCanvasElement
  private ecopyright!: HTMLDivElement
  private emenu!: HTMLDivElement
  private ewelcome!: HTMLDivElement
  private euser!: HTMLParagraphElement

  private keyListeners: { [key: string]: KeyPressListener } = {}
  constructor(config: IPMCConfig) {
    this.game = config.game!
    this.onComplete = config.onComplete
  }
  createElement(): void {
    this.el = kel("div", "TitleScreen")
    this.el.innerHTML = `
    <div class="copyright">
      <p><i class="fa-solid fa-gamepad-modern fa-fw"></i> Kulon v${metaData.version}</p>
      <p><i class="fa-solid fa-copyright fa-rotate-180 fa-fw"></i> Hiccups Raven - Devanka761</p>
    </div>
    <div class="main-menu">
      <div class="game-title">
        <div class="logo">
          <img src="/assets/unlisted/icons/Kulon_Hero_Normal.png" alt="dvnkz icon" width="125" />
        </div>
      </div>
      <div class="menus">
        <div class="btn btn-start"><span></span><i>${lang.TS_START}</i></div>
        <div class="btn btn-setting"><span></span><i>${lang.TS_SETTING}</i></div>
      </div>
    </div>
    <div class="user">
      <p>${lang.TS_WELCOME},</p>
      <p data-username="titlescreen">@{username}</p>
    </div>`
    this.canvas = qutor(".game-canvas") as HTMLCanvasElement
    this.canvas.classList.add("title-screen")

    this.ecopyright = qutor(".copyright", this.el) as HTMLDivElement
    this.emenu = qutor(".main-menu", this.el) as HTMLDivElement
    this.ewelcome = qutor(".user", this.el) as HTMLDivElement
    this.euser = qutor("[data-username]", this.el) as HTMLParagraphElement
    this.euser.innerText = db.me.username
  }
  async clickListener(): Promise<void> {
    await waittime(100)
    this.game.pause()

    const btnStart = qutor(".btn-start", this.el) as HTMLDivElement
    const btnSetting = qutor(".btn-setting", this.el) as HTMLDivElement

    btnStart.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      if (this.keyListeners.enter) this.keyListeners.enter.unbind()
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      setTimeout(() => {
        audio.emit({ action: "play", type: "ui", src: "act_done", options: { id: "act_done" } })
      }, 100)

      await this.destroy()
    }

    btnSetting.onclick = () => {
      if (this.isLocked) return
      this.isLocked = true
      if (this.keyListeners.enter) this.keyListeners.enter.unbind()
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      const setting = new Setting({ onComplete: this.onComplete, game: this.game, classBefore: this })
      this.destroy(setting)
    }

    this.navKeyListener()
    await waittime(900)
    audio.emit({ action: "stop", type: "ambient", options: { fadeOut: 1000 } })
    this.isLocked = false
  }
  navKeyListener(): void {
    const buttons = Array.from(this.emenu.querySelectorAll(".btn")) as HTMLDivElement[]
    if (buttons.length === 0) return

    let selectedIndex = 0
    buttons[selectedIndex].classList.add("selected")

    const changeSelection = (newIndex: number) => {
      buttons[selectedIndex].classList.remove("selected")
      selectedIndex = newIndex
      buttons[selectedIndex].classList.add("selected")
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
    }

    buttons.forEach((btn, index) => {
      btn.addEventListener("mouseenter", () => {
        if (selectedIndex !== index) {
          changeSelection(index)
        }
      })
    })

    this.keyListeners.arrowUp = new KeyPressListener("arrowup", () => {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : buttons.length - 1
      changeSelection(newIndex)
    })
    this.keyListeners.arrowDown = new KeyPressListener("arrowdown", () => {
      const newIndex = selectedIndex < buttons.length - 1 ? selectedIndex + 1 : 0
      changeSelection(newIndex)
    })
    this.keyListeners.enter = new KeyPressListener("enter", () => {
      buttons[selectedIndex].click()
    })
  }
  async eachDestroy(): Promise<void> {
    this.emenu.classList.add("out")
    this.ecopyright.classList.add("out")
    this.ewelcome.classList.add("out")
    await waittime(900)
    this.emenu.remove()
    this.ecopyright.remove()
    this.ewelcome.remove()
  }
  async destroy(next?: ISival): Promise<void> {
    Object.values(this.keyListeners).forEach((listener) => {
      listener.unbind()
    })
    this.keyListeners = {}
    if (!next) {
      await this.eachDestroy()
      this.canvas.classList.add("out")
      this.el.classList.add("out")
      audio.emit({ action: "play", type: "ambient", src: this.game.map.sound, options: { fadeIn: 1000 } })
      this.game.resume()
      backsong.destroy(10000)
      await waittime(1000)
      db.pmc = undefined
      this.onComplete()
      this.isLocked = false
      await waittime(1000)
      this.canvas.classList.remove("title-screen", "out")
      this.el.remove()

      const mailSize = db.mails.getAll.length

      if (!LocalList["mail_notification_disabled"] && mailSize >= 1) {
        notip({
          a: lang.NP_MAIL_TITLE,
          b: lang.NP_MAIL_REMAINS.replace("{amount}", mailSize.toString()),
          ic: "envelope"
        })
      }
      return
    }
    this.el.classList.add("out")
    await waittime(995)
    this.el.remove()
    db.pmc = undefined
    this.isLocked = false
    next.init()
  }
  async init(): Promise<void> {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.clickListener()
  }
}
