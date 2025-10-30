import asset from "../data/assets"
import lang from "../data/language"
import db from "../data/db"
import modal from "../lib/modal"
import xhr from "../lib/xhr"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import { eroot, futor, kel, qutor } from "../lib/kel"
import Find from "./Find"
import Profile from "./Profile"
import audio from "../lib/AudioHandler"
import { IPMC, IUser } from "../types/db.types"
import { ISival, SSKelement } from "../types/lib.types"

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

interface IFriendsConfig {
  onComplete: () => void
  classBefore: IPMC
}

export default class Friends {
  id: string = "friends"
  isLocked: boolean = false
  onComplete: () => void
  classBefore: IPMC

  private el!: HTMLDivElement
  private ereq!: SSKelement
  private efriends!: SSKelement

  private navKeyHandler?: (...args: ISival) => ISival
  private esc?: KeyPressListener

  private reqlist: string[] = []
  private friendlist: string[] = []
  private activeBoardIndex: number = 0
  private boards: SSKelement[] = []

  constructor(config: IFriendsConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-friends")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-address-book"></i> ${lang.PHONE_FRIENDS}</div>
          <div class="desc">${db.room.friend.length}/20</div>
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
        <div class="field">
          <div class="board board-friends">
            <div class="board-title"><span class="keyinfo"><i class="fa-solid fa-chevron-left"></i></span> ${lang.FW_FRIENDS_LIST}</div>
            <div class="board-list"></div>
          </div>
          <div class="board board-reqs">
            <div class="board-title">${lang.FW_FRIENDS_REQS} <span class="keyinfo"><i class="fa-solid fa-chevron-right"></i></span></div>
            <div class="board-list"></div>
          </div>
        </div>
      </div>
    </div>`
    this.ereq = futor(".board-reqs .board-list", this.el)
    this.efriends = futor(".board-friends .board-list", this.el)
    this.boards = [futor(".board-friends", this.el), futor(".board-reqs", this.el)]
  }
  private writeReqData(id_removed?: string): void {
    if (id_removed) {
      const onReqList = this.reqlist.includes(id_removed)
      if (onReqList) this.reqlist = this.reqlist.filter((k) => k !== id_removed)
      const card_to_remove = qutor(`.card[x-uid="${id_removed}"]`, this.ereq)
      if (card_to_remove) card_to_remove.remove()
    }
    const reqs = db.room.req
    const nrl = reqs.filter((k) => !this.reqlist.includes(k.id))
    nrl.forEach((usr) => {
      this.reqlist.push(usr.id)
      const card = playerCard(usr)
      card.onclick = () => {
        return this.destroy(
          new Profile({
            user: usr,
            onComplete: this.onComplete,
            classBefore: this
          })
        )
      }
      this.ereq.append(card)
    })
  }
  private writeFriendData(id_removed?: string): void {
    if (id_removed) {
      const onFriendList = this.friendlist.includes(id_removed)
      if (onFriendList) this.friendlist = this.friendlist.filter((k) => k !== id_removed)
      const card_to_remove = qutor(`.card[x-uid="${id_removed}"]`, this.efriends)
      if (card_to_remove) card_to_remove.remove()
    }
    const fr = db.room.friend
    const nfl = fr.filter((k) => !this.friendlist.includes(k.id))
    nfl.forEach((usr) => {
      this.friendlist.push(usr.id)
      const card = playerCard(usr)
      card.onclick = () => {
        return this.destroy(
          new Profile({
            user: usr,
            onComplete: this.onComplete,
            classBefore: this
          })
        )
      }
      this.efriends.append(card)
    })
    this.checkEmpty()
  }
  private checkEmpty(): void {
    const emptyFriend = qutor(".board-friends .board-list .empty", this.el)
    if (this.friendlist.length < 1 && !emptyFriend) {
      this.efriends.append(kel("div", "empty center", { e: lang.EMPTY }))
    } else if (this.friendlist.length >= 1 && emptyFriend) {
      emptyFriend.remove()
    }

    const emptyReq = qutor(".board-reqs .board-list .empty", this.el)
    if (this.reqlist.length < 1 && !emptyReq) {
      this.ereq.append(kel("div", "empty center", { e: lang.EMPTY }))
    } else if (this.reqlist.length >= 1 && emptyReq) {
      emptyReq.remove()
    }
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    const inp = futor("#find_friend", this.el) as HTMLInputElement

    const playerSearch = futor("#player-search", this.el) as HTMLFormElement
    playerSearch.onsubmit = async (e) => {
      e.preventDefault()

      if (this.isLocked) return
      inp.readOnly = true

      audio.emit({ action: "play", type: "ui", src: "menu_enter", options: { id: "menu_enter" } })
      this.isLocked = true

      const searchUID = inp.value.replace(/\s/g, "")
      if (searchUID.length < 1) {
        this.isLocked = false
        this.resetInput(inp)
        return
      }

      if (searchUID.length < 4) {
        await modal.alert(lang.FR_MIN)
        this.isLocked = false
        this.resetInput(inp)
        return
      }

      if (searchUID.length > 40) {
        await modal.alert(lang.FR_MAX)
        this.isLocked = false
        this.resetInput(inp)
        return
      }

      return this.searchXHR(searchUID, inp, 1)
    }

    this.resetInput(inp)

    await waittime()

    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  private navKeyListener(): void {
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
          const activeBoard = this.boards[this.activeBoardIndex]
          const firstCard = qutor(".board-list .card", activeBoard)
          if (firstCard) {
            firstCard.focus()
            return
          }
          this.activeBoardIndex = Number(!this.activeBoardIndex)
          const newActiveBoard = this.boards[this.activeBoardIndex]
          const newFirstCard = qutor(".board-list .card", newActiveBoard)
          if (newFirstCard) {
            newFirstCard.focus()
            return
          }
          this.activeBoardIndex = 0
        } else if (key === "ArrowLeft" || key === "ArrowRight") {
          e.preventDefault()
          this.activeBoardIndex = key === "ArrowLeft" ? 0 : 1
          const activeBoard = this.boards[this.activeBoardIndex]
          const firstCard = qutor(".board-list .card", activeBoard)
          if (firstCard) firstCard.focus()
        }
        return
      }

      const validNavKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"]
      if (!validNavKeys.includes(key)) return

      e.preventDefault()

      if (key === "ArrowLeft" || key === "ArrowRight") {
        const newIndex = this.activeBoardIndex + (key === "ArrowLeft" ? -1 : 1)
        const boardIndex = Math.max(0, Math.min(1, newIndex))
        if (boardIndex === this.activeBoardIndex) return
        this.activeBoardIndex = boardIndex

        const activeBoard = this.boards[this.activeBoardIndex]
        const firstCard = qutor(".board-list .card", activeBoard)
        if (!firstCard) {
          this.activeBoardIndex = Number(!this.activeBoardIndex)
          return
        }
        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        firstCard?.focus()
      } else if (key === "ArrowUp" || key === "ArrowDown") {
        const activeBoard = this.boards[this.activeBoardIndex]
        const cards = Array.from(activeBoard.querySelectorAll(".board-list .card")) as HTMLDivElement[]
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
          nextIndex = currentIndex + (key === "ArrowDown" ? 1 : -1)
        }

        if (nextIndex < 0) nextIndex = cards.length - 1
        if (nextIndex >= cards.length) nextIndex = 0

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
  private async resetInput(inp: HTMLInputElement): Promise<void> {
    inp.readOnly = true
    await waittime(350)
    inp.focus()
    inp.readOnly = false
  }
  private async searchXHR(searchUID: string, inp: HTMLInputElement, isMany: number = 0): Promise<void> {
    const playerResult = await modal.loading(xhr.get(`/x/profile/find/${searchUID}?multiple=${isMany}`))
    if (!playerResult.ok) {
      await modal.alert(lang[playerResult.msg] || playerResult.msg || lang.ERROR)
      this.isLocked = false
      this.resetInput(inp)
      return
    }
    this.isLocked = false
    if (playerResult.data.users.length > 1) {
      return await this.destroy(
        new Find({
          users: playerResult.data.users,
          onComplete: this.onComplete,
          classBefore: this
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
  update(id_removed?: string) {
    this.writeReqData(id_removed)
    this.writeFriendData(id_removed)
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    this.isLocked = true
    this.el.classList.add("out")
    this.reqlist = []
    this.friendlist = []
    this.activeBoardIndex = 0
    this.boards = []
    await waittime()
    this.el.remove()
    this.isLocked = false
    this.esc?.unbind()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.writeReqData()
    this.writeFriendData()
    this.btnListener()
    this.navKeyListener()
  }
}
