import db from "../data/db"
import lang from "../data/language"
import peers from "../data/Peers"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import waittime from "../lib/waittime"

const pmcWhiteList = ["prepare", "matchmaking", "minigame", "payout", "prologue"]
let hideTimeout: ReturnType<typeof setTimeout> | null = null

interface IHistory {
  id: string
  element: HTMLDivElement
  text: string
}

class Chat {
  opened: boolean = false
  formOpened: boolean = false
  history: IHistory[] = []

  el: HTMLDivElement = kel("div", "Chat hide")
  elist!: HTMLDivElement
  eform!: HTMLDivElement
  inp!: HTMLInputElement
  btnCancel!: HTMLDivElement

  createElement() {
    this.el.innerHTML = `
    <div class="box">
      <div class="content">
        <div class="list">
          <p class="empty">${lang.CHAT_HELP}</p>
        </div>
      </div>
      <form action="/ehek" method="post" class="chat-form hide">
        <div class="btn btn-chat-cancel"><i class="fa-solid fa-xmark"></i></div>
        <input type="text" autocomplete="off" name="chat-txt" id="chat-txt" placeholder="${lang.TYPE_HERE}" maxlength="200" />
        <button class="btn btn-chat-send"><i class="fa-solid fa-angles-right"></i></button>
      </form>
    </div>`

    this.elist = futor(".list", this.el) as HTMLDivElement

    this.eform = futor(".chat-form", this.el) as HTMLDivElement

    this.inp = qutor("#chat-txt", this.eform) as HTMLInputElement

    this.btnCancel = qutor(".btn-chat-cancel", this.eform) as HTMLDivElement
  }

  add(usr_id: string, usr_txt: string, isSystem: boolean = false): void {
    if (isSystem) {
      audio.emit({ action: "play", type: "ui", src: "addstate_2", options: { id: Date.now().toString() } })
    }

    const emptyEl = qutor(".empty", this.elist)
    if (emptyEl) emptyEl.remove()

    if (usr_id !== db.me.id && !db.job.playerExists(usr_id)) return

    usr_txt = usr_txt.trim()

    if (usr_txt.length < 1) return

    if (this.el.classList.contains("hide")) {
      this.el.classList.remove("hide")
    }

    const card = kel("p", "cht")

    card.innerHTML = `<i class="uname${isSystem ? " y" : ""}"></i><i class="txt${isSystem ? " y" : ""}"></i>`
    const currname = (usr_id === db.me.id ? db.me : db.job.getUser(usr_id))!.username

    futor(".uname", card).innerText = currname
    futor(".txt", card).innerText = usr_txt

    const chtID = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
    if (this.history.length > 30) {
      const histIdx = this.history.length - 30
      for (let i = 0; i < histIdx; i++) {
        this.history[i].element.remove()
      }
      this.history = this.history.slice(histIdx, this.history.length)
    }
    this.history.push({ id: chtID, element: card, text: usr_txt })
    this.elist.append(card)
    this.elist.scrollTop = this.elist.scrollHeight
    if (!this.formOpened) {
      this.resetTimeout()
    }
  }
  clear(): void {
    this.history.forEach((_, i) => this.history[i].element.remove())
    this.history = []
    const p = kel("p", "empty")
    p.innerHTML = lang.EMPTY
    this.elist.append(p)
    this.hide()
  }
  async open(): Promise<void> {
    if (db.pmc && !pmcWhiteList.includes(db.pmc?.id || "undefined")) return

    if (qutor(".modal")) return

    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }

    if (this.el.classList.contains("hide")) {
      this.el.classList.remove("hide")
    }

    this.opened = true

    if (!this.eform.classList.contains("hide")) return

    this.formOpened = true

    this.eform.classList.remove("hide")

    document.onkeydown = (e) => {
      if (e.key.toLocaleLowerCase() === "escape") {
        this.hide()
        document.onkeydown = null
      }
    }
    document.onmousedown = (e) => {
      const { target } = e
      if (target instanceof Node && !this.eform.contains(target) && !this.elist.contains(target)) {
        this.hide()
        document.onmousedown = null
      }
    }

    await waittime(20)

    this.elist.scrollTop = this.elist.scrollHeight

    if (!this.eform.classList.contains("hide")) {
      this.inp.focus()
    }
  }
  async hide(): Promise<void> {
    if (!this.eform.classList.contains("hide")) {
      this.eform.classList.add("hide")
    }
    this.inp.value = ""
    if (this.history.length >= 1) {
      this.resetTimeout()
    } else {
      if (!this.el.classList.contains("hide")) {
        this.el.classList.add("hide")
      }
      this.opened = false
    }
    await waittime(10)
    this.formOpened = false
  }

  resetTimeout(): void {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }

    hideTimeout = setTimeout(() => {
      if (!this.eform.classList.contains("hide")) {
        this.eform.classList.add("hide")
      }

      if (!this.el.classList.contains("hide")) {
        this.el.classList.add("hide")
      }

      this.formOpened = false

      this.opened = false

      clearTimeout(hideTimeout!)

      hideTimeout = null
    }, 5000)
  }
  formListener(): void {
    this.btnCancel.onclick = () => this.hide()

    this.eform.onsubmit = (e) => {
      e.preventDefault()

      if (this.inp.value.replace(/\s/g, "").length < 1) return

      const user_text = this.inp.value.trim()

      this.add(db.me.id!, user_text)

      this.inp.value = ""

      this.hide()

      peers.send("chatMessage", { text: user_text })
    }
  }
  run() {
    this.createElement()
    eroot().append(this.el)
    this.formListener()
  }
}

const chat = new Chat()
export default chat
