import asset from "../data/assets"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import sdate from "../lib/sdate"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"

const roomStatus = ["isFriend", "theirReq", "myReq"]

export default class Profile {
  constructor({ user, onComplete, classBefore = null } = { user, onComplete }) {
    this.id = "player"
    this.user = user
    this.onComplete = onComplete
    this.classBefore = classBefore
    this.isLocked = false
  }
  createElement() {
    this.el = kel("div", "fuwi f-profile")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-user"></i> Player</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="profile">
          <div class="avatar">
            <div class="hero"></div>
          </div>
          <div class="user">
            <div class="uname"></div>
            <div class="userid"></div>
          </div>
        </div>
        <div class="fact">
          <div class="time-joined"></div>
          <div class="achievements-count"></div>
        </div>
        <div class="actions">
          <div class="btn btn-add">
            <i class="fa-solid fa-user-plus"></i> Tambahkan Teman
          </div>
          <div class="btn btn-accept">
            <i class="fa-solid fa-user-check"></i> Terima Permintaan
          </div>
          <div class="btn btn-deny">
            <i class="fa-solid fa-user-xmark"></i> Tolak Permintaan
          </div>
          <div class="btn btn-unfriend">
            <i class="fa-solid fa-user-minus"></i> Hapus Pertemanan
          </div>
          <span><i>Permintaan Pertemanan Terkirim</i></span>
          <div class="btn btn-cancel">
            <i class="fa-solid fa-user-xmark"></i> Batalkan
          </div>
          <div class="btn btn-location">
            <i class="fa-solid fa-location-dot"></i> Share Location
          </div>
        </div>

      </div>
    </div>`
  }
  writeData() {
    const eimg = qutor(".avatar .hero", this.el)
    Object.values(this.user.skin).forEach((skin) => {
      const img = new Image()
      img.src = asset[skin].src
      img.alt = skin
      eimg.append(img)
    })
    this.euname = qutor(".user .uname", this.el)
    this.euname.append(this.user.username)
    const euid = qutor(".user .userid", this.el)
    euid.append(`UID: ${this.user.id}`)
    const ejoined = qutor(".time-joined", this.el)
    ejoined.append(lang.PROF_JOINED_TIME.replace(/{DATE}/g, sdate.date(this.user.joined)))
    const eachievements = qutor(".achievements-count", this.el)
    eachievements.append(lang.PROF_ACH_COUNT.replace(/{COUNT}/g, this.user.trophies.length || 0))

    this.renderActions()
  }
  renderActions() {
    this.enter?.unbind()
    this.del?.unbind()
    this.eactions = qutor(".actions", this.el)
    this.eactions.innerHTML = ""
    const cached = db.room.get(this.user.id)
    if (!cached) return this.ActionNoFriend()
    if (cached.isFriend) return this.ActionFriend()
    if (cached.theirReq) return this.ActionRequest()
    if (cached.myReq) return this.ActionSent()
    return this.ActionNoFriend()
  }
  ActionNoFriend() {
    const btn = kel("div", "btn btn-add")
    btn.innerHTML = `<i class="fa-solid fa-user-plus"></i> ${lang.PROF_ADD} <span class="keyinfo">Enter</span>`
    this.eactions.append(btn)
    btn.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      await this.ActionXHR("addfriend")
      this.renderActions()
    }
    this.enter = new KeyPressListener("enter", async () => {
      btn.click()
    })
  }
  ActionFriend() {
    const btn = kel("div", "btn btn-unfriend")
    btn.innerHTML = `<i class="fa-solid fa-user-minus"></i> ${lang.PROF_UNFRIEND} <span class="keyinfo">Delete</span>`
    this.eactions.append(btn)
    btn.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      await this.ActionXHR("unfriend", "PROF_CONF_UNFRIEND")
      this.renderActions()
    }
    this.del = new KeyPressListener("delete", async () => {
      btn.click()
    })
  }
  ActionRequest() {
    const btn_a = kel("div", "btn btn-accept")
    btn_a.innerHTML = `<i class="fa-solid fa-user-check"></i> ${lang.PROF_ACCEPT} <span class="keyinfo">Enter</span>`
    const btn_b = kel("div", "btn btn-decline")
    btn_b.innerHTML = `<i class="fa-solid fa-user-xmark"></i> ${lang.PROF_IGNORE} <span class="keyinfo">Delete</span>`

    this.eactions.append(btn_a, btn_b)
    btn_a.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      await this.ActionXHR("acceptfriend")
      this.renderActions()
    }
    btn_b.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      await this.ActionXHR("ignorefriend", "PROF_CONF_IGNORE")
      this.renderActions()
    }
    this.enter = new KeyPressListener("enter", async () => {
      btn_a.click()
    })
    this.del = new KeyPressListener("delete", async () => {
      btn_b.click()
    })
  }
  ActionSent() {
    this.eactions.innerHTML = `<span class="btn-sent"><i>${lang.PROF_WAIT}</i></span>`
    const btn = kel("div", "btn btn-cancel")
    btn.innerHTML = `<i class="fa-solid fa-user-xmark"></i> ${lang.PROF_CANCEL} <span class="keyinfo">Delete</span>`
    this.eactions.append(btn)
    btn.onclick = async () => {
      if (this.isLocked) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      await this.ActionXHR("cancelfriend", "PROF_CONF_CANCEL")
      this.renderActions()
    }
    this.del = new KeyPressListener("delete", async () => {
      btn.click()
    })
  }
  async ActionXHR(ref, useconfirm = null) {
    if (this.isLocked) return
    this.isLocked = true

    if (useconfirm) {
      const isconfirm = await modal.confirm(lang[useconfirm].replace(/{USER}/g, this.user.username))
      if (!isconfirm) {
        this.isLocked = false
        return { ok: false }
      }
    }

    this.eactions.innerHTML = `<div class="btn">Loading</div>`
    const setreq = await xhr.post(`/x/profile/${ref}/${this.user.id}`)
    if (!setreq.ok) await modal.alert(lang[setreq.msg] || lang.ERROR)
    if (setreq?.msg && roomStatus.includes(setreq.msg)) {
      db.room.update(setreq.msg, this.user)
    } else if (setreq?.msg === "notfriend") {
      db.room.remove(this.user.id)
    }

    this.isLocked = false
    return setreq
  }
  async btnListener() {
    this.euname.onclick = async () => {
      if (this.isLocked) return
      if (!db.me.access?.includes(7)) return
      this.isLocked = true
      const newAccess = await modal.prompt({
        val: (this.user.access || []).join(", ")
      })

      if (!newAccess) {
        this.isLocked = false
        return
      }

      const accessToSend = newAccess
        .replace(/\s/g, "")
        .split(",")
        .map((k) => Number(k))
      const newUser = await modal.loading(xhr.post(`/x/mod/access/${this.user.id}`, { access: accessToSend }))
      if (!newUser.ok) {
        await modal.alert(newUser.msg || lang.ERROR)
        this.isLocked = false
        return
      }
      this.user.access = accessToSend
      this.isLocked = false
      return
    }

    const btnClose = qutor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    await waittime()
    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  async destroy(next) {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.el.classList.add("out")
    this.enter?.unbind()
    this.del?.unbind()
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = this
    this.esc?.unbind()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.writeData()
    this.btnListener()
  }
}
