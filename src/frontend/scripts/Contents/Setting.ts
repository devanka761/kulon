import setting_list from "../../../../public/json/main/settings.json"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import { eroot, futor, kel, qutor } from "../lib/kel"
import { localeChanger } from "../lib/localeChanger"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import xhr from "../lib/xhr"
import localSave from "../manager/storage"
import audio from "../lib/AudioHandler"
import backsong from "../APIs/BackSongAPI"
import { IPMC } from "../types/db.types"
import { Game } from "../main/Game"
import { ISettingList } from "../types/setting.types"
import { ISival, SSKelement } from "../types/lib.types"

interface IItemCard {
  [key: string]: (s: ISettingList) => HTMLDivElement
}

const itemCard: IItemCard = {
  string(s) {
    const card = kel("div", "item")
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[LocalList.lang!]}</p>
    </div>
    <div class="item-value">
      <span class="keyinfo">enter</span>
      <span class="btn-string string">${s.default}</span>
    </div>`
    return card
  },
  range(s) {
    const card = kel("div", "item")
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[LocalList.lang!]}</p>
    </div>
    <div class="item-value">
      <span class="keyinfo keyinfo-wide"><i class="fa-solid fa-chevron-left"></i></span>
      <span class="keyinfo keyinfo-wide"><i class="fa-solid fa-chevron-right"></i></span>
      <span class="range-value-text">5</span>
      <div class="range-outer">
        <input type="range" name="${s.id}" id="${s.id}" min="${s.min || 0}" max="${s.max || 10}" step="${s.step || 1}" />
      </div>
    </div>`

    return card
  },
  boolean(s) {
    const card = kel("div", "item")
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[LocalList.lang!]}</p>
    </div>
    <div class="item-value">
      <span class="keyinfo">enter</span>
      <input type="checkbox" name="${s.id}" id="${s.id}" />
    </div>`
    const inp = futor("input", card) as HTMLInputElement
    if (s.default) {
      if (!LocalList[s.id]) inp.checked = true
    } else {
      if (LocalList[s.id]) inp.checked = true
    }
    return card
  },
  option(s) {
    const card = kel("div", "item")
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[LocalList.lang!]}</p>
    </div>
    <div class="item-value">
      <span class="keyinfo">enter</span>
      <div class="select">${s.label![LocalList.lang!]}</div>
    </div>`
    return card
  },
  text(s) {
    const card = kel("div", "item")
    if (s.breaker) card.classList.add("breaker")
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[LocalList.lang!]}</p>
    </div>`
    return card
  },
  func(s) {
    const card = kel("div", "item")
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name?.[LocalList.lang!] || ""}</p>
    </div>
    <div class="item-value">
      <span class="keyinfo">enter</span>
      <div class="btn btn-${s.id}${s.cl ? " " + s.cl : " b"}">${s.value![LocalList.lang!]}</div>
    </div>`
    return card
  }
}

interface ISettingConfig {
  onComplete: () => void
  classBefore?: IPMC
  game: Game
  page?: string
}

export default class Setting implements IPMC {
  id: string = "setting"
  isLocked: boolean = false
  onComplete: () => void
  classBefore?: IPMC
  private game: Game
  private page: string

  private el!: HTMLDivElement

  private navKeyHandler?: (...args: ISival) => ISival
  private board!: SSKelement
  private menus!: SSKelement
  private esc?: KeyPressListener

  constructor(config: ISettingConfig) {
    this.game = config.game
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.page = config.page || "2"
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-setting")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-gear"></i> ${lang.PHONE_SETTING}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="menus">
          <div class="menu-chooser chooser-left">
            <i class="fa-solid fa-chevron-left"></i> <span class="keyinfo">q</span>
          </div>
          <div class="menu-list"></div>
          <div class="menu-chooser chooser-right">
            <span class="keyinfo">e</span>
            <i class="fa-solid fa-chevron-right"></i>
          </div>
        </div>
        <div class="board"></div>
      </div>
    </div>`
    this.board = futor(".board", this.el)
    this.menus = futor(".menu-list", this.el)
  }
  private selectedBtn(): NodeListOf<HTMLDivElement> {
    return this.menus.querySelectorAll(".btn.selected")
  }
  private btnListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })

    const chooserLeft = futor(".chooser-left", this.el)
    chooserLeft.onclick = () => {
      if (this.isLocked) return
      this.navigateMenu("left")
    }

    const chooserRight = futor(".chooser-right", this.el)
    chooserRight.onclick = () => {
      if (this.isLocked) return
      this.navigateMenu("right")
    }

    setting_list.groups.forEach((itm) => {
      const card = kel("div", "btn")
      if (itm.id === this.page) card.classList.add("selected")
      card.innerHTML = `<i class="${itm.icon}"></i> ${itm.name[LocalList.lang!]}`
      this.menus.append(card)
      card.onclick = () => {
        if (itm.id === this.page) return
        this.page = itm.id
        this.selectedBtn().forEach((oldbtn) => oldbtn.classList.remove("selected"))
        card.classList.add("selected")

        audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: Date.now().toString() } })
        this.writeList()
      }
    })
  }
  private writeList(): void {
    const listBefore = qutor(".item-list", this.el)
    if (listBefore) listBefore.remove()
    const list = kel("div", "item-list")
    const items = setting_list.items.filter((itm) => itm.group === this.page) as ISettingList[]
    items.forEach((itm) => {
      const card = itemCard[itm.type](itm)
      list.append(card)
      card.onmousedown = () => {
        if (card.classList.contains("breaker")) return
        list.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"))
        card.classList.add("selected")
      }

      // @ts-expect-error no default types
      if (itm.uniq) return this[itm.uniq](card, itm)
      if (itm.type === "range") return this.writeRange(card, itm)
      if (itm.type === "boolean") return this.writeCheckBox(card, itm)
      if (itm.type === "string") return this.writeString(card)
    })
    this.board.append(list)
    this.selectFirstItem()
  }
  private selectFirstItem(): void {
    this.board.querySelector(".item.selected")?.classList.remove("selected")
    const firstItem = this.board.querySelector(".item:not(.breaker)")
    firstItem?.classList.add("selected")
  }
  private writeString(card: HTMLDivElement): void {
    card.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
      await modal.alert(lang.ST_NOT_READY)
      this.isLocked = false
    }
  }
  private writeRange(card: HTMLDivElement, s: ISettingList): void {
    const inp = futor("input", card) as HTMLInputElement
    const rangeVal = futor(".range-value-text", card)
    const curSave = (typeof LocalList[s.id] === "number" ? LocalList[s.id] : s.default) as number
    const curVal = curSave >= (s.min ?? 0) && curSave! <= (s.max ?? 10) ? Number(curSave) : Number(s.default)
    inp.value = curVal.toString()
    rangeVal.innerHTML = curVal.toString().padStart(2, " ")

    inp.oninput = () => {
      const newValue = Number(inp.value)
      rangeVal.innerHTML = newValue.toString().padStart(2, " ")
      LocalList[s.id] = newValue

      // @ts-expect-error no default types
      if (s.func) this[s.func](s.id, newValue)
      localSave.save()
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
    }
  }
  private audioSettings(id: string, newValue: number): void {
    audio.commitChange(id, newValue)
    backsong.adjust(id, newValue)
  }
  private analogSettings(_card: string, __: string): void {
    this.game.kulonPad.updateAnalog()
  }
  private interactSettings(_card: string, __: string): void {
    this.game.kulonPad.updateInteract()
  }
  private writeRestoreDefault(card: HTMLDivElement): void {
    card.onclick = async () => {
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
      if (this.isLocked) return
      this.isLocked = true
      await modal.alert(lang.ST_NOT_READY)
      this.isLocked = false
    }
  }
  private writeCheckBox(card: HTMLDivElement, s: ISettingList): void {
    const inp = futor("input", card) as HTMLInputElement
    inp.onchange = () => {
      const boolStatus = s.default ? inp.checked !== true : inp.checked === true
      LocalList[s.id] = boolStatus
      if (!boolStatus) delete LocalList[s.id]
      localSave.save()
    }
    card.onclick = (e) => {
      if (e.target instanceof Node && inp.contains(e.target)) return
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
      inp.click()
    }
  }
  private writeProvider(card: HTMLDivElement): void {
    const p = futor("p", card)
    p.innerHTML = `${db.provider.email ? db.provider.email + " " : ""}(${db.provider.name})`
  }
  private writeLogout(card: HTMLDivElement): void {
    const urlParams = new URLSearchParams(window.location.search)
    const pageQueries = ["s=1"]
    const queryR = urlParams.get("r")
    pageQueries.push("r=" + (queryR || "app"))
    const queryPwa = urlParams.get("pwa")
    if (queryPwa) pageQueries.push("pwa=" + queryPwa)
    const queries = pageQueries.join("&")
    const url = `/x/auth/logout?${queries}`

    card.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
      this.isLocked = true
      const confLogout = await modal.confirm(lang.ST_TXT_LOGOUT)
      if (!confLogout) {
        this.isLocked = false
        return
      }
      await modal.loading(xhr.get(url), "LOGGING OUT")
      this.isLocked = false
      window.location.href = url
    }
  }
  private writeLanguage(card: HTMLDivElement, s: ISettingList): void {
    const itemList = s.list.map((itm) => ({
      id: itm.id,
      label: itm.label,
      activated: LocalList[s.saveId!] && LocalList[s.saveId!] === itm.id
    }))

    card.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
      this.isLocked = true
      const newLang = await modal.select({
        ic: "language",
        msg: "Language",
        items: itemList
      })
      if (!newLang || newLang === LocalList.lang) {
        this.isLocked = false
        return
      }

      if (newLang !== "id" && newLang !== "en") {
        this.isLocked = false
        return
      }

      LocalList.lang = newLang
      localSave.save()
      await modal.loading(localeChanger())
      this.isLocked = false

      const updateSetting = new Setting({
        onComplete: this.onComplete,
        game: this.game,
        classBefore: this.classBefore,
        page: this.page
      })
      await this.destroy(updateSetting)
    }
  }
  private writeKulonPad(card: HTMLDivElement, s: ISettingList): void {
    const inp = futor("input", card) as HTMLInputElement
    inp.onchange = () => {
      const boolStatus = s.default ? inp.checked !== true : inp.checked === true
      LocalList[s.id] = boolStatus
      if (!boolStatus) delete LocalList[s.id]
      this.game.kulonPad.setEnable()
      localSave.save()
    }
    card.onclick = (e) => {
      if (e.target instanceof Node && inp.contains(e.target)) return
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
      inp.click()
    }
  }
  private navigateMenu(direction: "left" | "right"): void {
    const buttons = Array.from(this.menus.querySelectorAll(".btn")) as HTMLDivElement[]
    if (buttons.length < 1) return

    const currentIndex = buttons.findIndex((btn) => btn.classList.contains("selected"))

    let nextIndex
    if (direction === "right") {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % buttons.length
    } else {
      nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1
    }

    const nextButton = buttons[nextIndex]
    if (nextButton) {
      nextButton.click()

      // @ts-expect-error no default types
      nextButton.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
    }
  }
  private navKeyListener(): void {
    this.navKeyHandler = (e) => {
      const key = e.key.toLowerCase()
      if (!["q", "e", "arrowup", "arrowdown", "arrowleft", "arrowright", "enter"].includes(key)) return
      if (this.isLocked) return
      e.preventDefault()

      if (key === "q" || key === "e") {
        this.navigateMenu(key === "e" ? "right" : "left")
        return
      }

      const list = qutor(".item-list", this.board)
      if (!list) return

      if (key === "enter") {
        const activeItem = qutor(".item.selected", list)
        activeItem?.click()
        return
      }

      if (key === "arrowleft" || key === "arrowright") {
        const activeItem = qutor(".item.selected", list)
        const rangeInput = activeItem?.querySelector('input[type="range"]') as HTMLInputElement | null
        if (rangeInput) {
          const step = Number(rangeInput.step) || 1
          const currentValue = Number(rangeInput.value)
          const newValue = key === "arrowright" ? currentValue + step : currentValue - step
          if (newValue >= Number(rangeInput.min) && newValue <= Number(rangeInput.max)) {
            rangeInput.value = newValue.toString()
            rangeInput.dispatchEvent(new Event("input", { bubbles: true }))
          }
          return
        }
        return
      }

      const items = Array.from(list.querySelectorAll(".item:not(.breaker)"))
      if (items.length < 1) return

      const currentIndex = items.findIndex((item) => item.classList.contains("selected"))
      let nextIndex

      if (key === "arrowdown") {
        nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length
      } else {
        nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1
      }

      audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })

      items[currentIndex]?.classList.remove("selected")
      const nextItem = items[nextIndex]
      nextItem?.classList.add("selected")

      // @ts-expect-error no default types
      nextItem?.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    this.esc?.unbind()
    this.el.classList.add("out")
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.btnListener()
    this.writeList()
    this.navKeyListener()
  }
}
