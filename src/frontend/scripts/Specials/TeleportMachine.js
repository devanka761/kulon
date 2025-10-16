import db from "../data/db"
import lang from "../data/language"
import MapList from "../data/MapList"
import peers from "../data/Peers"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"

function createCurrent(text) {
  text = text.replace("kulon", "")
  const card = kel("div", "empty")
  card.innerHTML = text ? `${text} - ${lang.CURRENT}` : lang.EMPTY || "Empty"
  return card
}

function createTxt(text) {
  const card = kel("div", "txt")
  card.innerHTML = text
  return card
}
function createBtn(text) {
  text = text.replace("kulon", "")
  const card = kel("div", "btn")
  card.innerHTML = text
  return card
}

export default class TeleportMachine {
  constructor(config) {
    this.id = "teleporter"
    this.onComplete = config.onComplete
    this.game = config.game
    this.classBefore = config.classBefore
    this.isLocked = false
    this.navKeyHandler = null
    this.enter = null
  }
  createElement() {
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
    this.list = qutor(".con", this.el)
  }
  async btnListener() {
    const btnClose = qutor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    await waittime()
    this.esc = new KeyPressListener("escape", () => btnClose.click())
    this.enter = new KeyPressListener("enter", () => this.list.querySelector(".btn.selected")?.click())
  }
  writePlayers() {
    const players = []
    peers.getAll().forEach((char) => {
      if (char.user.id !== db.me.id) players.push(char)
    })
    players.forEach((char) => {
      const card = createBtn(char.user.username)
      card.onclick = () => {
        if (!char || !char.x || !char.y) return this.destroy(this.classBefore)
        this.changeMap(char.mapId, Math.floor(char.x / 16), Math.floor(char.y / 16))
      }
      this.list.prepend(card)
    })
    if (players.length >= 1) this.list.prepend(createTxt("TEAM"))
  }
  writeMaps() {
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
  navKeyListener() {
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
        nextButton.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
    const firstButton = this.list.querySelector(".btn")
    firstButton?.classList.add("selected")
  }
  async changeMap(mapId, x, y) {
    await this.destroy()
    this.game.startCutscene([{ type: "changeMap", direction: "down", map: mapId, x, y }])
  }
  async destroy(next) {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    this.esc?.unbind()
    this.enter?.unbind()
    document.removeEventListener("keydown", this.navKeyHandler)
    this.navKeyHandler = null
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = null
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.btnListener()
    this.writePlayers()
    this.writeMaps()
    this.navKeyListener()
  }
}
