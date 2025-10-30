import db from "../data/db"
import lang from "../data/language"
import MapList from "../data/MapList"
import peers from "../data/Peers"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ISival, SSKelement } from "../types/lib.types"

function createCurrent(text: string): HTMLDivElement {
  text = text.replace("kulon", "")
  const card = kel("div", "empty")
  card.innerHTML = text ? `${text} - ${lang.CURRENT}` : lang.EMPTY || "Empty"
  return card
}

function createTxt(text: string): HTMLDivElement {
  const card = kel("div", "txt")
  card.innerHTML = text
  return card
}
function createBtn(text: string): HTMLDivElement {
  text = text.replace("kulon", "")
  const card = kel("div", "btn")
  card.innerHTML = text
  return card
}

interface ITeleportMachineConfig extends IPMCConfig {
  onComplete: () => void
  classBefore: IPMC
  game: Game
}

export default class TeleportMachine implements IPMC {
  id: string = "teleporter"
  isLocked: boolean = false
  onComplete: () => void
  classBefore: IPMC
  private game: Game

  private el!: HTMLDivElement

  private navKeyHandler?: (...args: ISival) => ISival
  private enter?: KeyPressListener
  private esc?: KeyPressListener
  private list!: SSKelement

  constructor(config: ITeleportMachineConfig) {
    this.onComplete = config.onComplete
    this.game = config.game
    this.classBefore = config.classBefore
  }
  private createElement(): void {
    this.el = kel("div", "fuwi teleporter")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-location-dot"></i> Teleport</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
      </div>
    </div>`
    this.list = futor(".con", this.el)
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    await waittime()
    this.esc = new KeyPressListener("escape", () => btnClose.click())
    this.enter = new KeyPressListener("enter", () => {
      qutor(".btn.selected", this.list)?.click()
    })
  }
  private writePlayers(): void {
    const players: string[] = []
    peers.getAll().forEach((char) => {
      if (char.user.id !== db.me.id) players.push(char.id)
      const card = createBtn(char.user.username)
      card.onclick = () => {
        const player = peers.get(char.user.id)
        if (!player || !player.x || !player.y) return this.destroy(this.classBefore)
        this.changeMap(player.mapId, Math.round(player.x / 16), Math.round(player.y / 16))
      }
      this.list.prepend(card)
    })
    if (players.length >= 1) this.list.prepend(createTxt("TEAM"))
  }
  private writeMaps(): void {
    this.list.append(createTxt("MAP"))
    const areas = Object.keys(MapList || {})
    areas
      .filter((k) => MapList[k].safeZone)
      .forEach((k) => {
        const card = k === this.game.map.mapId ? createCurrent(k) : createBtn(k)
        card.onclick = () => {
          if (k === this.game.map.mapId) return
          const sz = MapList[k]?.safeZone
          if (!sz || !sz.x || !sz.y) return this.destroy(this.classBefore)
          this.changeMap(k, sz.x, sz.y)
        }
        this.list.append(card)
      })
  }
  private navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (!["ArrowUp", "ArrowDown"].includes(e.key)) return
      if (this.isLocked) return

      e.preventDefault()

      const buttons = Array.from(this.list.querySelectorAll(".btn"))
      if (buttons.length < 1) return

      const currentIndex = buttons.findIndex((btn) => btn.classList.contains("selected"))

      let nextIndex
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % buttons.length
      } else {
        nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1
      }

      if (currentIndex > -1) {
        buttons[currentIndex].classList.remove("selected")
      }

      const nextButton = buttons[nextIndex]
      if (nextButton) {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
        nextButton.classList.add("selected")

        // @ts-expect-error no default types
        nextButton.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
    const firstButton = this.list.querySelector(".btn")
    firstButton?.classList.add("selected")
  }
  private async changeMap(mapId: string, x: number, y: number): Promise<void> {
    await this.destroy()
    this.game.startCutscene([{ type: "changeMap", direction: "down", map: mapId, x, y }])
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.esc?.unbind()
    this.enter?.unbind()
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.btnListener()
    this.writePlayers()
    this.writeMaps()
    this.navKeyListener()
  }
}
