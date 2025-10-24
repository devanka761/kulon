import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import { playRandomPop } from "../manager/randomPlays"
import itemRun from "../Props/itemRun"
import { IPMC, IPMCConfig } from "../types/db.types"
import { Game } from "../main/Game"
import { ISival } from "../types/lib.types"

interface IAppearanceConfig extends IPMCConfig {
  item_id?: string
  pmcTitle?: string
  pmcContinue?: string
}

interface ISkins {
  [key: string]: string[] | string[][]
}

interface IChars {
  [key: string]: string
}

interface IApplyToCharParams {
  k: string
  skin_type: number
  skin_model?: number
  imgel: HTMLImageElement
  valuep: HTMLDivElement
  valuer?: HTMLDivElement | null
}

export default class Appearance implements IPMC {
  id: string = "appearance"
  onComplete: () => void
  game?: Game
  classBefore?: IPMC
  protected item_id?: string
  isLocked: boolean = false
  protected pmcTitle: string
  protected pmcContinue: string
  protected skins: ISkins | null = null
  protected chars: IChars = {}
  protected navKeyHandler: ((e: KeyboardEvent) => void) | null = null
  protected spriteRotation: number = -48

  protected el!: HTMLDivElement
  protected esc?: KeyPressListener
  protected enter?: KeyPressListener
  protected keyQ?: KeyPressListener
  protected keyE?: KeyPressListener

  constructor(config: IAppearanceConfig) {
    this.onComplete = config.onComplete!
    this.game = config.game
    this.item_id = config.item_id
    this.classBefore = config.classBefore
    this.pmcTitle = config.pmcTitle || "CHAR_APR_TITLE"
    this.pmcContinue = config.pmcContinue || "CHAR_APR_CONTINUE"
  }

  protected createElement(): void {
    this.el = kel("div", "CharacterCreation appearance") as HTMLDivElement
    this.el.innerHTML = `
    <div class="outer">
      <div class="citizen">
        <div class="citizen-detail">
          <div class="title"><p>${lang[this.pmcTitle]}</p></div>
          <div class="avatar">
            <div class="hero">
            </div>
          </div>
          <div class="citizen-actions">
            <button class="left">
              <span class="keyinfo">q</span>
              <div class="icon">
                <i class="fa-solid fa-left"></i>
              </div>
            </button>
            <button class="right">
              <span class="keyinfo">e</span>
              <div class="icon">
                <i class="fa-solid fa-right"></i>
              </div>
            </button>
          </div>
        </div>
        <div class="citizen-done">
          <div class="btn btn-cancel">
            <span class="keyinfo">esc</span> ${lang.CHAR_APR_CANCEL}
          </div>
          <div class="btn btn-continue">
            <span class="keyinfo">enter</span> ${lang[this.pmcContinue]}
          </div>
        </div>
      </div>
      <div class="editor">
      </div>
    </div>`
  }

  protected applyToChar({ k, skin_type, skin_model = 0, imgel, valuep, valuer = null }: IApplyToCharParams): void {
    if (!this.skins) return

    if (valuer) {
      this.chars[k] = (this.skins[k] as string[][])[skin_type][skin_model]
      valuep.innerText = (skin_type + 1).toString()
      valuer.innerText = (skin_model + 1).toString()
      if (k === "Hairstyles" && skin_type >= 1 && this.chars["Hats"] !== "null") {
        imgel.src = asset[(this.skins["Hairstyles"] as string[][])[1][skin_model]].src
      } else {
        imgel.src = asset[(this.skins[k] as string[][])[skin_type][skin_model]].src
      }
    } else {
      this.chars[k] = (this.skins[k] as string[])[skin_type]
      valuep.innerText = (skin_type + 1).toString()
      if (k === "Hats" && this.chars["Hairstyles"] !== "null") {
        const imgHairstyle = qutor(".sk-Hairstyles", this.el) as HTMLImageElement
        if (skin_type >= 1) {
          const hairColor = this.chars["Hairstyles"].substring(this.chars["Hairstyles"].length - 1, this.chars["Hairstyles"].length)
          imgHairstyle.src = asset[(this.skins["Hairstyles"] as string[][])[1][Number(hairColor) - 1]].src
        } else {
          imgHairstyle.src = asset[this.chars["Hairstyles"]].src
        }
      }
      imgel.src = asset[(this.skins[k] as string[])[skin_type]].src
    }
  }

  protected applyToSprite(): void {
    const preview = this.el.querySelectorAll<HTMLImageElement>(`.avatar .hero img`)
    preview.forEach((sprite) => {
      sprite.style.transform = `translateX(${this.spriteRotation}px)`
    })
  }

  protected async setSkins(): Promise<void> {
    const charSkinList = (await xhr.get("/json/skins/character_creation_list.json")) as ISkins
    this.skins = charSkinList
    this.editorListener()
  }

  protected cardEditor(k: string, n: number = 0): HTMLDivElement {
    const card = kel("div", "field") as HTMLDivElement
    card.innerHTML = `
    <div class="text">${k}${n ? '<br><i class="fa-solid fa-arrow-turn-down-right variety"></i> variety' : ""}</div>
    <div class="actions">
      <div class="act primary">
        <button class="left"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="value">1</div>
        <button class="right"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      ${n ? '<div class="act secondary"><button class="left"><i class="fa-solid fa-chevron-left"></i></button><div class="value">1</div><button class="right"><i class="fa-solid fa-chevron-right"></i></button></div>' : ""}
    </div>`
    return card
  }

  protected editorListener(): void {
    if (!this.skins) return

    const eleditor = qutor(".outer .editor", this.el) as HTMLDivElement
    const charPreview = qutor(".avatar .hero", this.el) as HTMLDivElement

    eleditor.setAttribute("tabindex", "-1")

    if (!db.me?.access?.includes(7)) {
      this.skins.Outfits = (this.skins.Outfits as string[][]).filter((k) => {
        return !k.find((skid) => skid.includes("Dvnkz"))
      })
    }

    Object.keys(this.skins).forEach((k) => {
      const skinCategory = this.skins![k]
      if (typeof skinCategory[0] === "string") {
        const skinList = skinCategory as string[]
        const currIdx = skinList.findIndex((sk) => sk === (db.me.skin[k as keyof typeof db.me.skin] || "none"))
        let skin_type = currIdx < 0 ? 0 : currIdx
        const card = this.cardEditor(k)

        const btnLeftp = qutor(".primary button.left", card) as HTMLButtonElement
        const btnRightp = qutor(".primary button.right", card) as HTMLButtonElement
        const valuep = qutor(".primary .value", card) as HTMLDivElement

        const imgel = new Image()
        imgel.alt = skin_type.toString()
        imgel.classList.add("sk-" + k, k)
        imgel.src = asset[skinList[skin_type]].src

        charPreview.append(imgel)
        eleditor.append(card)

        btnLeftp.onclick = () => {
          playRandomPop()
          if (skin_type <= 0) skin_type = skinList.length
          skin_type--
          this.applyToChar({ k, skin_type, imgel, valuep })
        }

        btnRightp.onclick = () => {
          playRandomPop()
          if (skin_type >= skinList.length - 1) skin_type = -1
          skin_type++
          this.applyToChar({ k, skin_type, imgel, valuep })
        }
        this.applyToChar({ k, skin_type, imgel, valuep })
      } else if (typeof skinCategory[0] === "object") {
        const skinList = skinCategory as string[][]
        const curtIdx = skinList.findIndex((sk) => sk.find((skx) => skx === (db.me.skin[k as keyof typeof db.me.skin] || "none")))
        const curmIdx = skinList[curtIdx < 0 ? 0 : curtIdx].findIndex((sk) => sk === (db.me.skin[k as keyof typeof db.me.skin] || "none"))

        let skin_type = curtIdx < 0 ? 0 : curtIdx
        let skin_model = curmIdx < 0 ? 0 : curmIdx
        const card = this.cardEditor(k, 1)

        const btnLeftp = qutor(".primary button.left", card) as HTMLButtonElement
        const btnRightp = qutor(".primary button.right", card) as HTMLButtonElement
        const valuep = qutor(".primary .value", card) as HTMLDivElement

        const btnLeftr = qutor(".secondary button.left", card) as HTMLButtonElement
        const btnRightr = qutor(".secondary button.right", card) as HTMLButtonElement
        const valuer = qutor(".secondary .value", card) as HTMLDivElement

        const imgel = new Image()
        imgel.classList.add("sk-" + k, k)
        imgel.alt = skin_type.toString()
        imgel.src = asset[skinList[skin_type][skin_model]].src

        charPreview.append(imgel)
        eleditor.append(card)

        btnLeftp.onclick = () => {
          playRandomPop()
          if (skin_type <= 0) skin_type = skinList.length
          skin_model = 0
          skin_type--
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }
        btnRightp.onclick = () => {
          playRandomPop()
          if (skin_type >= skinList.length - 1) skin_type = -1
          skin_model = 0
          skin_type++
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }
        btnLeftr.onclick = () => {
          playRandomPop()
          if (skin_model <= 0) skin_model = skinList[skin_type].length
          skin_model--
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }
        btnRightr.onclick = () => {
          playRandomPop()
          if (skin_model >= skinList[skin_type].length - 1) skin_model = -1
          skin_model++
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }

        this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
      }
    })

    const rotate_left = qutor(".citizen-actions .left", this.el) as HTMLButtonElement
    const rotate_right = qutor(".citizen-actions .right", this.el) as HTMLButtonElement

    rotate_left.onclick = () => {
      if (this.isLocked) return
      playRandomPop()
      this.spriteRotation = this.spriteRotation >= 0 ? -48 : this.spriteRotation + 16
      this.applyToSprite()
    }
    this.keyQ = new KeyPressListener("q", () => rotate_left.click())

    rotate_right.onclick = () => {
      if (this.isLocked) return
      playRandomPop()
      this.spriteRotation = this.spriteRotation <= -48 ? 0 : this.spriteRotation - 16
      this.applyToSprite()
    }
    this.keyE = new KeyPressListener("e", () => rotate_right.click())

    const btnCancel = qutor(".btn-cancel", this.el) as HTMLDivElement
    if (btnCancel) {
      btnCancel.onclick = () => {
        if (this.isLocked) return
        this.resumeMap()
        return this.destroy(this.classBefore)
      }
      setTimeout(() => {
        this.esc = new KeyPressListener("escape", () => btnCancel.click())
      }, 300)
    }
    this.formListener()
    this.navKeyListener()
  }

  protected formListener(): void {
    const btnContinue = qutor(".btn-continue", this.el) as HTMLDivElement
    btnContinue.onclick = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      const confirmEdit = await modal.confirm({
        msg: lang.CHAR_APR_CONFIRM,
        ic: "question",
        okx: lang.CHAR_APR_SUBMIT,
        cancelx: lang.CHAR_APR_RECHECK
      })
      if (!confirmEdit) {
        this.isLocked = false
        return
      }
      const data: { skin: IChars; item_id?: string } = {
        skin: this.chars,
        item_id: this.item_id
      }
      const saveSkin = await modal.loading(xhr.post("/x/account/update-skin", data))
      if (!saveSkin.ok) {
        await modal.alert(lang[saveSkin.msg] || lang.ERROR)
        this.isLocked = false
        return
      }
      db.bag.bulkUpdate(saveSkin.data.items)
      db.me.skin = saveSkin.data.skin
      this.isLocked = false
      this.destroy(itemRun.run("restartGameMap"))
    }
    this.enter = new KeyPressListener("enter", () => btnContinue.click())
  }

  protected navKeyListener(): void {
    const eleditor = qutor(".outer .editor", this.el) as HTMLDivElement
    let currentActive: HTMLElement | null = null
    this.navKeyHandler = (e: KeyboardEvent) => {
      if (this.isLocked || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
      e.preventDefault()

      const allActs = Array.from(eleditor.querySelectorAll<HTMLElement>(".act"))
      if (allActs.length === 0) return

      currentActive = eleditor.querySelector<HTMLElement>(".act.active")

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        let currentIndex = currentActive ? allActs.indexOf(currentActive) : -1

        if (currentActive) currentActive.classList.remove("active")

        currentIndex = e.key === "ArrowUp" ? (currentIndex > 0 ? currentIndex - 1 : allActs.length - 1) : currentIndex < allActs.length - 1 ? currentIndex + 1 : 0

        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        const nextActive = allActs[currentIndex]
        nextActive.classList.add("active")
        nextActive.scrollIntoView({ behavior: "smooth", block: "center" })
      } else if (currentActive && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const btn = qutor(`button.${e.key === "ArrowLeft" ? "left" : "right"}`, currentActive) as HTMLButtonElement
        btn?.click()
      }
    }

    document.addEventListener("keydown", this.navKeyHandler)

    const firstAct = eleditor.querySelector<HTMLElement>(".act")
    if (firstAct) {
      firstAct.classList.add("active")
      currentActive = firstAct
    }

    eleditor.querySelectorAll<HTMLElement>(".act").forEach((act) => {
      act.addEventListener("mouseover", () => {
        if (currentActive) currentActive.classList.remove("active")
        act.classList.add("active")
        currentActive = act
      })
    })
  }

  protected resumeMap(): void {
    if (this.game) {
      this.game.pause()
      this.game.resume()
    }
  }

  async destroy(next?: ISival): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.esc?.unbind()
    this.enter?.unbind()
    this.keyQ?.unbind()
    this.keyE?.unbind()
    if (this.navKeyHandler) document.removeEventListener("keydown", this.navKeyHandler)
    await waittime(500)
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (!next && this.onComplete) return this.onComplete()
    if (next) return next.init()
  }

  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    if (this.game) this.game.pause()
    this.createElement()
    eroot().append(this.el)
    this.setSkins()
  }
}
