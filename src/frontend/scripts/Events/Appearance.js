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

export default class Appearance {
  constructor(config = {}) {
    this.id = "appearance"
    this.onComplete = config.onComplete || null
    this.map = config.map || null
    this.game = config.game || null
    this.item_id = config.item_id || null
    this.classBefore = config.classBefore || null
    this.pmcTitle = config.pmcTitle || "CHAR_APR_TITLE"
    this.pmcContinue = config.pmcContinue || "CHAR_APR_CONTINUE"
    this.isLocked = false
    this.skins = null
    this.chars = {}
    this.navKeyHandler = null
    this.spriteRotation = -48
  }
  createElement() {
    this.el = kel("div", "CharacterCreation appearance")
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
          <div class="btn-help help-cancel"><span class="keyinfo">esc</span></div>
          <div class="btn btn-cancel">${lang.CHAR_APR_CANCEL}</div>
          <div class="btn-help"><span class="keyinfo">enter</span></div>
          <div class="btn btn-continue">${lang[this.pmcContinue]}</div>
        </div>
      </div>
      <div class="editor">
      </div>
    </div>`
  }
  applyToChar({ k, skin_type, skin_model = 0, imgel, valuep, valuer = null } = { k, skin_type, imgel, valuep }) {
    if (valuer) {
      this.chars[k] = this.skins[k][skin_type][skin_model]
      valuep.innerText = skin_type + 1
      valuer.innerText = skin_model + 1
      if (k === "Hairstyles" && skin_type >= 1 && this.chars["Hats"] !== "null") {
        imgel.src = asset[this.skins["Hairstyles"][1][skin_model]].src
      } else {
        imgel.src = asset[this.skins[k][skin_type][skin_model]].src
      }
    } else {
      this.chars[k] = this.skins[k][skin_type]
      valuep.innerText = skin_type + 1
      if (k === "Hats" && this.chars["Hairstyles"] !== "null") {
        const imgHairstyle = qutor(".sk-Hairstyles", this.el)
        if (skin_type >= 1) {
          const hairColor = this.chars["Hairstyles"].substring(this.chars["Hairstyles"].length - 1, this.chars["Hairstyles"].length)
          imgHairstyle.src = asset[this.skins["Hairstyles"][1][Number(hairColor) - 1]].src
        } else {
          imgHairstyle.src = asset[this.chars["Hairstyles"]].src
        }
      }
      imgel.src = asset[this.skins[k][skin_type]].src
    }
  }
  applyToSprite() {
    const preview = this.el.querySelectorAll(`.avatar .hero img`)
    preview.forEach((sprite) => {
      sprite.style.transform = `translateX(${this.spriteRotation}px)`
    })
  }
  async setSkins() {
    const charSkinList = await xhr.get("/json/skins/character_creation_list.json")
    this.skins = charSkinList
    this.editorListener()
  }
  cardEditor(k, n = 0) {
    const card = kel("div", "field")
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
  editorListener() {
    const eleditor = qutor(".outer .editor", this.el)
    const charPreview = qutor(".avatar .hero", this.el)

    eleditor.setAttribute("tabindex", "-1")

    if (!db.me?.access?.find((admin) => admin === 7)) {
      this.skins.Outfits = this.skins.Outfits.filter((k) => {
        return !k.find((skid) => skid.includes("Dvnkz"))
      })
    }

    Object.keys(this.skins).forEach((k) => {
      if (typeof this.skins[k][0] === "string") {
        const currIdx = this.skins[k].findIndex((sk) => sk === (db.me?.skin?.[k] || "none"))
        let skin_type = currIdx < 0 ? 0 : currIdx
        const card = this.cardEditor(k)

        const btnLeftp = qutor(".primary button.left", card)
        const btnRightp = qutor(".primary button.right", card)
        const valuep = qutor(".primary .value", card)

        const imgel = new Image()
        imgel.alt = skin_type
        imgel.classList.add("sk-" + k)
        imgel.src = asset[this.skins[k][skin_type]].src
        imgel.classList.add(k)

        charPreview.append(imgel)
        eleditor.append(card)

        btnLeftp.onclick = () => {
          playRandomPop()
          if (skin_type <= 0) skin_type = this.skins[k].length
          skin_type--
          this.applyToChar({ k, skin_type, imgel, valuep })
        }

        btnRightp.onclick = () => {
          playRandomPop()
          if (skin_type >= this.skins[k].length - 1) skin_type = -1
          skin_type++
          this.applyToChar({ k, skin_type, imgel, valuep })
        }
        this.applyToChar({ k, skin_type, imgel, valuep })
      } else if (typeof this.skins[k][0] === "object") {
        const curtIdx = this.skins[k].findIndex((sk) => sk.find((skx) => skx === (db.me?.skin?.[k] || "none")))
        const curmIdx = this.skins[k][curtIdx < 0 ? 0 : curtIdx].findIndex((sk) => sk === (db.me?.skin?.[k] || "none"))

        let skin_type = curtIdx < 0 ? 0 : curtIdx
        let skin_model = curmIdx < 0 ? 0 : curmIdx
        const card = this.cardEditor(k, 1)

        const btnLeftp = qutor(".primary button.left", card)
        const btnRightp = qutor(".primary button.right", card)
        const valuep = qutor(".primary .value", card)

        const btnLeftr = qutor(".secondary button.left", card)
        const btnRightr = qutor(".secondary button.right", card)
        const valuer = qutor(".secondary .value", card)

        const imgel = new Image()
        imgel.classList.add("sk-" + k)
        imgel.alt = skin_type
        imgel.src = asset[this.skins[k][skin_type][skin_model]].src
        imgel.classList.add(k)

        charPreview.append(imgel)
        eleditor.append(card)

        btnLeftp.onclick = () => {
          playRandomPop()
          if (skin_type <= 0) skin_type = this.skins[k].length
          skin_model = 0
          skin_type--
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }
        btnRightp.onclick = () => {
          playRandomPop()
          if (skin_type >= this.skins[k].length - 1) skin_type = -1
          skin_model = 0
          skin_type++
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }
        btnLeftr.onclick = () => {
          playRandomPop()
          if (skin_model <= 0) skin_model = this.skins[k][skin_type].length
          skin_model--
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }
        btnRightr.onclick = () => {
          playRandomPop()
          if (skin_model >= this.skins[k][skin_type].length - 1) skin_model = -1
          skin_model++
          this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
        }

        this.applyToChar({ k, skin_type, skin_model, imgel, valuep, valuer })
      }
    })

    const rotate_left = qutor(".citizen-actions .left", this.el)
    const rotate_right = qutor(".citizen-actions .right", this.el)

    rotate_left.onclick = () => {
      if (this.isLocked) return
      playRandomPop()
      if (this.spriteRotation >= 0) {
        this.spriteRotation = -48
      } else {
        this.spriteRotation = this.spriteRotation + 16
      }
      this.applyToSprite()
    }
    this.keyQ = new KeyPressListener("q", () => {
      rotate_left.click()
    })
    rotate_right.onclick = () => {
      if (this.isLocked) return
      playRandomPop()
      if (this.spriteRotation <= -48) {
        this.spriteRotation = 0
      } else {
        this.spriteRotation = this.spriteRotation - 16
      }
      this.applyToSprite()
    }
    this.keyE = new KeyPressListener("e", () => {
      rotate_right.click()
    })

    const btnCancel = qutor(".btn-cancel", this.el)
    if (btnCancel) {
      btnCancel.onclick = () => {
        if (this.isLocked) return
        this.resumeMap()
        return this.destroy(this.classBefore)
      }
      setTimeout(() => {
        this.esc = new KeyPressListener("escape", () => {
          btnCancel.click()
        })
      }, 300)
    }
    this.formListener()
    this.navKeyListener()
  }
  formListener() {
    const btnContinue = qutor(".btn-continue", this.el)
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
      const data = {}
      data.skin = this.chars
      data.item_id = this.item_id
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
    this.enter = new KeyPressListener("enter", () => {
      btnContinue.click()
    })
  }
  navKeyListener() {
    const eleditor = qutor(".outer .editor", this.el)
    let currentActive = null
    this.navKeyHandler = (e) => {
      if (this.isLocked) return
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
      e.preventDefault()

      const allActs = Array.from(eleditor.querySelectorAll(".act"))
      if (allActs.length === 0) return

      currentActive = eleditor.querySelector(".act.active")

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        let currentIndex = currentActive ? allActs.indexOf(currentActive) : -1

        if (currentActive) {
          currentActive.classList.remove("active")
        }

        if (e.key === "ArrowUp") {
          currentIndex = currentIndex > 0 ? currentIndex - 1 : allActs.length - 1
        } else {
          currentIndex = currentIndex < allActs.length - 1 ? currentIndex + 1 : 0
        }

        audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
        const nextActive = allActs[currentIndex]
        nextActive.classList.add("active")
        nextActive.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
      } else if (currentActive && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const btn = qutor(`button.${e.key === "ArrowLeft" ? "left" : "right"}`, currentActive)
        btn?.click()
      }
    }

    document.addEventListener("keydown", this.navKeyHandler)

    const firstAct = eleditor.querySelector(".act")
    if (firstAct) {
      firstAct.classList.add("active")
      currentActive = firstAct
    }

    eleditor.querySelectorAll(".act").forEach((act) => {
      act.addEventListener("mouseover", () => {
        if (currentActive) currentActive.classList.remove("active")
        act.classList.add("active")
        currentActive = act
      })
    })
  }
  resumeMap() {
    if (this.game) {
      this.game.pause()
      this.game.resume()
    }
  }
  async destroy(next) {
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
    db.pmc = null
    if (!next && this.onComplete) return this.onComplete()
    if (!next) return
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    if (this.game) this.game.pause()
    this.createElement()
    eroot().append(this.el)
    this.setSkins()
  }
}
