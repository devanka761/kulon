import ScoreBoard from "../APIs/ScoreBoard"
import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import phonelist from "../data/phonelist"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel } from "../lib/kel"
import modal from "../lib/modal"
import { copyToClipboard } from "../lib/navigator"
import notip from "../lib/notip"
import socket from "../lib/Socket"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPhoneApp, IPMC } from "../types/db.types"
import { ISival, SSKelement } from "../types/lib.types"

interface IPhoneConfig {
  onComplete: () => void
  game: Game
}

export default class Phone implements IPMC {
  id: string = "phone"
  isLocked: boolean = false
  onComplete: () => void
  private game: Game

  private appGrid: (HTMLButtonElement | null)[][] = []
  private appCards: HTMLButtonElement[] = []
  private scoreBoard!: ScoreBoard

  private navKeyHandler?: (...args: ISival) => ISival

  private el!: HTMLDivElement
  private btnRename!: SSKelement
  private esc?: KeyPressListener
  private c?: KeyPressListener

  constructor(config: IPhoneConfig) {
    this.onComplete = config.onComplete
    this.game = config.game
  }
  private createElement(): void {
    this.el = kel("div", "Phone")
    this.el.innerHTML = `
    <div class="profile">
      <div class="detail">
        <div class="avatar">
          <div class="hero"></div>
        </div>
        <div class="user">
          <div class="username"></div>
          <div class="userid">
            ID: <span class="uid"></span>
            <span class="btn btn-copy">
              <i class="fa-solid fa-copy"></i><span class="keyinfo">c</span>
            </span>
          </div>
        </div>
      </div>
      <div class="phone-actions">
        <span class="keyinfo">Esc</span>
        <div class="btn btn-close">
          <i class="fa-solid fa-x"></i>
        </div>
      </div>
    </div>
    <div class="apps">
      <div class="list"></div>
    </div>`
    const euname = futor(".profile .detail .user .username", this.el)
    const euserid = futor(".profile .detail .user .userid .uid", this.el)
    const eskin = futor(".profile .detail .avatar .hero", this.el)

    euname.append(kel("span", "uname-text", { e: db.me.username }))
    this.btnRename = kel("i", "fa-duotone fa-pen-to-square btn-rename")
    euname.append(this.btnRename)
    euserid.innerHTML = db.me.id

    Object.values(db.me.skin).forEach((skin) => {
      const img = new Image()
      img.alt = skin
      img.src = asset[skin].src
      eskin.append(img)
    })
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".profile .btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
      this.destroy()
    }
    this.btnRename.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: "phone_menu_enter" } })
      this.isLocked = true
      const nextHelp1 = await modal.confirm({
        msg: lang.ACC_PHONE_USERNAME_HELP_1,
        ic: "circle-info",
        okx: lang.ACC_PHONE_USERNAME_OK_1,
        cancelx: lang.ACC_PHONE_USERNAME_CANCEL
      })
      if (!nextHelp1) {
        this.isLocked = false
        return
      }
      const nextHelp2 = await modal.confirm({
        msg: lang.ACC_PHONE_USERNAME_HELP_2,
        ic: "circle-info",
        okx: lang.ACC_PHONE_USERNAME_OK_2,
        cancelx: lang.ACC_PHONE_USERNAME_CANCEL
      })
      if (!nextHelp2) {
        this.isLocked = false
        return
      }
      await modal.alert({ msg: lang.ACC_PHONE_USERNAME_HELP_3, ic: "circle-info" })
      this.isLocked = false
    }
    const btnUID = futor(".profile .detail .user .userid .btn-copy", this.el)
    btnUID.onclick = async () => {
      const copiedText = await copyToClipboard(db.me.id)
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: "phone_menu_enter" } })
      if (copiedText) {
        const copySuccess = lang.COPY_TEXT
        btnUID.innerHTML = '<i class="fa-solid fa-check"></i>'
        setTimeout(() => (btnUID.innerHTML = '<i class="fa-solid fa-copy"></i><span class="keyinfo">c</span>'), 3000)
        notip({
          a: copySuccess,
          b: db.me.id,
          ic: "clipboard-check",
          c: 1
        })
      } else {
        await modal.alert("No Permission")
      }
    }
    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
    this.c = new KeyPressListener("c", async () => {
      btnUID.click()
    })
  }
  private writeApps(): void {
    const eapplist = futor(".apps .list", this.el)
    eapplist.innerHTML = ""

    const applist = phonelist.filter((k) => k.g.includes(db.onduty) && (!k.a || db.me.access?.find((myAccess) => k.a?.find((requiredAccess) => requiredAccess === myAccess))))

    let row: number = 0
    let col: number = 0

    applist.forEach((k, _index) => {
      const card = kel("button", "btn")
      const classList = k.cl ? k.cl?.[db.onduty as keyof typeof k.cl] : null
      if (classList) card.classList.add("b-custom", classList)
      if (k.hasUnread?.() || false) card.classList.add("unread")

      card.innerHTML = `<div class="ic"><i class="${k.ic}"></i></div><div class="name">${lang[k.n]}</div>`
      eapplist.append(card)
      this.appCards.push(card)

      let colspan = 1
      let rowspan = 1
      if (classList) {
        if (classList === "b-shop-1") rowspan = 2
        if (["b-shop-2", "b-trophies-1", "b-trophies-2"].includes(classList)) colspan = 2
      }

      while (true) {
        if (!this.appGrid[row]) this.appGrid[row] = new Array(3).fill(null)

        if (this.appGrid[row][col]) {
          col++
          if (col >= 3) {
            col = 0
            row++
          }
          continue
        }

        let fits = true
        if (col + colspan > 3) {
          fits = false
        } else {
          for (let r_offset = 0; r_offset < rowspan; r_offset++) {
            for (let c_offset = 0; c_offset < colspan; c_offset++) {
              if (!this.appGrid[row + r_offset]) this.appGrid[row + r_offset] = new Array(3).fill(null)
              if (this.appGrid[row + r_offset][col + c_offset]) {
                fits = false
                break
              }
            }
            if (!fits) break
          }
        }

        if (fits) {
          card.dataset.row = row.toString()
          card.dataset.col = col.toString()
          for (let r_offset = 0; r_offset < rowspan; r_offset++) {
            for (let c_offset = 0; c_offset < colspan; c_offset++) {
              if (!this.appGrid[row + r_offset]) this.appGrid[row + r_offset] = new Array(3).fill(null)
              this.appGrid[row + r_offset][col + c_offset] = card
            }
          }
          break
        } else {
          col++
          if (col >= 3) {
            col = 0
            row++
          }
        }
      }

      card.onclick = async () => {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: "phone_menu_enter" } })
        if (this.isLocked) return
        await this.destroy(k)
      }
      card.onmouseenter = () => {
        eapplist.querySelectorAll(".active").forEach((btnActive) => {
          btnActive.classList.remove("active")
        })
        audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
        card.classList.add("active")
      }
    })

    if (this.appCards.length > 0) {
      this.appCards[0].classList.add("active")
    }
  }
  private navKeyListener(): void {
    const eapplist = futor(".apps .list", this.el)
    this.navKeyHandler = (e) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) return
      e.preventDefault()

      const currentFocused = futor(".btn.active", eapplist)
      if (e.key === "Enter") {
        currentFocused?.click()
        return
      }

      if (!currentFocused) {
        this.appCards[0]?.classList.add("active")
        return
      }

      const currentRow = parseInt(currentFocused.dataset.row!, 10)
      const currentCol = parseInt(currentFocused.dataset.col!, 10)
      let nextCard: HTMLButtonElement | null = null

      if (e.key === "ArrowDown") {
        for (let r = currentRow + 1; r < this.appGrid.length; r++) {
          if (this.appGrid[r][currentCol] && this.appGrid[r][currentCol] !== currentFocused) {
            nextCard = this.appGrid[r][currentCol]
            break
          }
        }
      } else if (e.key === "ArrowUp") {
        for (let r = currentRow - 1; r >= 0; r--) {
          if (this.appGrid[r][currentCol] && this.appGrid[r][currentCol] !== currentFocused) {
            nextCard = this.appGrid[r][currentCol]
            break
          }
        }
      } else if (e.key === "ArrowRight") {
        for (let c = currentCol + 1; c < 3; c++) {
          if (this.appGrid[currentRow][c] && this.appGrid[currentRow][c] !== currentFocused) {
            nextCard = this.appGrid[currentRow][c]
            break
          }
        }
      } else if (e.key === "ArrowLeft") {
        for (let c = currentCol - 1; c >= 0; c--) {
          if (this.appGrid[currentRow][c] && this.appGrid[currentRow][c] !== currentFocused) {
            nextCard = this.appGrid[currentRow][c]
            break
          }
        }
      }

      if (nextCard) {
        audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
        currentFocused.classList.remove("active")
        nextCard.classList.add("active")

        // @ts-expect-error no default types
        nextCard.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  private createScoreBoard(): void {
    this.scoreBoard = new ScoreBoard(this.game.map.mapId)
  }
  updateScoreBoard(userId: string, mapId: string): void {
    this.scoreBoard.update(userId, mapId)
  }
  async destroy(next?: IPhoneApp): Promise<void> {
    if (this.isLocked) return
    if (!db.trophies.isDone("firstphone")) {
      socket.send("usePhone")
    }
    this.isLocked = true
    this.el.classList.add("out")
    this.scoreBoard.destroy()
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    this.c?.unbind()
    this.appGrid = []
    this.appCards = []
    this.esc?.unbind()
    await waittime()
    this.c?.unbind()
    this.appGrid = []
    this.appCards = []
    this.esc?.unbind()
    this.isLocked = false
    this.el.remove()
    // this.pos.remove()
    if (!next) {
      db.pmc = undefined
      this.onComplete()
      return
    }
    if (typeof next !== "string") return next.r!({ onComplete: this.onComplete, game: this.game, classBefore: this })
  }
  async init(): Promise<void> {
    this.isLocked = true
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    this.createScoreBoard()
    // this.updatePos()
    eroot().append(this.el, this.scoreBoard.html)
    this.writeApps()
    await waittime()
    this.isLocked = false
    this.navKeyListener()
    this.btnListener()
  }
}
