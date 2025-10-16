import modal from "../lib/modal"
import xhr from "../lib/xhr"
import { eroot, kel, qutor } from "../lib/kel"
import { isUnifiedSupported } from "../manager/supports"
import ForceClose from "./ForceClose"
import waittime from "../lib/waittime"
import LocalList from "../data/LocalList"
import localSave from "../manager/storage"
import { localeChanger } from "../lib/localeChanger"
import lang from "../data/language"
import Doodle from "../lib/Doodle"
import Preload from "./Preload"
import { checkScreenSize } from "../manager/screenSize"

const ProviderObject = {
  USE_OAUTH_GOOGLE: "google",
  USE_OAUTH_GITHUB: "github",
  USE_OAUTH_DISCORD: "discord",
  USE_OAUTH_ANON: "guest"
}

function loginProvider(provider, queries) {
  const isAnon = ProviderObject[provider] === "guest"
  const icon = isAnon ? "fa-light fa-user-secret" : `fa-brands fa-${ProviderObject[provider]}`

  const btn = kel("div", "inp")
  const a = kel("a", `btn btn-${ProviderObject[provider]}`, {
    a: { href: `/x/auth/${ProviderObject[provider]}?${queries}` },
    e: `<i class="${icon}"></i> ${ProviderObject[provider]} Login`
  })
  btn.append(a)

  return { button: btn, a, type: ProviderObject[provider] }
}

function SelectLang() {
  return {
    ic: "language",
    msg: "Language",
    items: [
      { id: "id", label: "Bahasa Indonesia", activated: !LocalList.lang || LocalList.lang === "id" },
      { id: "en", label: "English", activated: LocalList.lang === "en" }
    ]
  }
}
let auth_container = null
let doodle = null

export default class Auth {
  crateElement() {
    this.el = kel("div", "Auth")
  }
  async checkUser() {
    const splash = qutor(".splash", this.el) || kel("div", "splash")
    splash.innerHTML = `<p><i class="fa-solid fa-circle-notch fa-spin"></i> Initializing ...</p>`
    this.el.append(splash)
    await waittime(1000)

    const hasLang = LocalList.lang
    if (!hasLang) {
      const newLang = await modal.select(SelectLang())

      LocalList.lang = newLang || "id"
      localSave.save()
    }

    await localeChanger()

    const isSupported = isUnifiedSupported()
    if (!isSupported.ok) {
      new ForceClose({
        msg_1: '<i class="fa-light fa-handshake"></i>',
        msg_2: `${lang.CLOUD_INCOMPATIBLE}</br></br>${isSupported.list.join(", ")}`
      })
      return
    }

    const isUser = await xhr.get("/x/auth/isUser")
    if (isUser.code !== 200) {
      splash.classList.add("out")
      await waittime(1000)
      splash.remove()
      while (this.el.lastChild) this.el.lastChild.remove()
      return this.writeForm()
    }

    if (!doodle) doodle = new Doodle({ root: eroot(), fillRatio: 0.4, strength: 30, delay: 500 })

    const skins = await xhr.get("/json/skins/skin_list.json")
    const sounds = await xhr.get("/json/audio/audio.json")
    splash.classList.add("out")
    await waittime(1000)
    splash.remove()

    this.el.remove()
    auth_container?.remove()

    await checkScreenSize()

    const preload = new Preload({ skins, sounds, doodle })
    preload.init()
  }
  writeForm() {
    auth_container = this.el
    doodle = new Doodle({ root: eroot(), fillRatio: 0.4, strength: 30, delay: 500 })
    new SignEmail().init()
  }
  init() {
    this.crateElement()
    eroot().append(this.el)
    this.checkUser()
  }
}

class SignEmail {
  constructor({ email = null } = {}) {
    this.email = email
    this.isLocked = false

    const urlParams = new URLSearchParams(window.location.search)
    const returnPage = urlParams.get("r")
    const pageQueries = ["s=1"]
    pageQueries.push("r=" + (returnPage || "app"))
    this.queries = pageQueries.join("&")
  }
  createElement() {
    this.el = kel("div", "box")
    this.el.innerHTML = `
    <div class="top">
      <p>KULON</p>
    </div>
    <form action="/x/auth/sign-in" method="post" class="form" id="sign-in-form">
      <div class="field">
        <div class="btn btn-lang">
          <span>Language</span> <i class="fa-solid fa-chevron-down"></i>
        </div>
      </div>
      <div class="field">
        <div class="labels">
          <label for="email">${lang.AUTH_EMAIL}</label>
        </div>
        <div class="inp">
          <input type="email" name="email" id="email" autocomplete="email" placeholder="example@example.com" ${this.email ? 'value="' + this.email + '"' : ""} required/>
        </div>
      </div>
      <div class="field">
        <div class="inp">
          <button class="btn btn-login">${lang.AUTH_LOGIN}</button>
        </div>
      </div>
      <div class="field center">
        <div class="txt center">${lang.OR}</div>
      </div>
      <div class="field other-providers">
      </div>
      <div class="field center">
        <div class="txt center"><p>${lang.AUTH_NOTICE}</p></div>
      </div>
    </form>`
  }
  async formListener() {
    const eProviders = qutor(".other-providers", this.el)
    Object.keys(ProviderObject).forEach((k) => {
      const { button, a, type } = loginProvider(k, this.queries)

      if (type === "guest") {
        button.onclick = async (e) => {
          e.preventDefault()
          if (this.isLocked) return
          this.isLocked = true
          const confirmAnon = await modal.confirm(lang["AUTH_ANON_CONFIRM"])
          if (!confirmAnon) {
            this.isLocked = false
            return
          }

          const res = await modal.loading(xhr.post(a.getAttribute("href")))
          if (!res.ok) {
            await modal.alert(lang[res.msg] || lang.ERROR)
            this.isLocked = false
            return
          }
          await this.destroy()
          auth_container?.remove()
          new Auth().init()
        }
      }

      eProviders.append(button)
    })

    const form = qutor("#sign-in-form", this.el)
    const btnLang = qutor(".btn-lang", this.el)
    btnLang.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const newLang = await modal.select(SelectLang())
      if (!newLang || newLang === LocalList.lang) {
        this.isLocked = false
        return
      }
      const formData = new FormData(form)
      formData.forEach((val, _) => (this.email = val.toString()))
      LocalList.lang = newLang
      localSave.save()
      await modal.loading(localeChanger())
      this.isLocked = false
      await this.destroy()
      new SignEmail({ email: this.email }).init()
    }
    form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      this.isLocked = true
      const data = {}
      const formData = new FormData(form)
      formData.forEach((val, k) => (data[k] = val.toString()))
      const userLogin = await modal.loading(xhr.post("/x/auth/sign-in", data))
      if (!userLogin.ok) {
        await modal.alert(lang[userLogin.msg] || lang.ERROR)
        this.isLocked = false
        return
      }
      this.isLocked = false
      await this.destroy()
      new SignCode({ email: userLogin?.data?.email }).init()
    }

    const inpEmail = qutor("input#email", this.el)
    inpEmail.readOnly = true
    inpEmail.focus()
    await waittime()
    inpEmail.readOnly = false
  }
  async destroy() {
    this.el.classList.add("out")
    await waittime(300, 5)
    this.isLocked = false
    this.el.remove()
  }
  init() {
    this.createElement()
    auth_container?.append(this.el)
    this.formListener()
  }
}

class SignCode {
  constructor(config) {
    this.email = config.email
    this.isLocked = false
  }
  createElement() {
    this.el = kel("div", "box")
    this.el.innerHTML = `
    <div class="top">
      <p>KULON</p>
    </div>
    <form action="/x/auth/verify" method="post" class="form" id="verify-form">
      <div class="field">
        <div class="btn btn-lang">
          <span>Language</span> <i class="fa-solid fa-chevron-down"></i>
        </div>
      </div>
      <div class="field">
        <div class="labels">
          <label for="email">${lang.AUTH_EMAIL}:</label>
        </div>
        <div class="inp inp-key">
          <input type="email" name="email" id="email" autocomplete="email" placeholder="example@example.com" ${this.email ? 'value="' + this.email + '"' : ""} readonly required />
        </div>
      </div>
      <div class="field">
        <div class="labels">
          <label for="code">${lang.AUTH_OTP_CODE}:</label>
        </div>
        <div class="inp">
          <input type="number" class="otp" name="code" id="code" autocomplete="off" placeholder="-------" required/>
        </div>
        <div class="sm">
          <i>${lang.AUTH_VERIFICATION_OTP}</i>
        </div>
      </div>
      <div class="field">
        <div class="inp">
          <button class="btn btn-login">${lang.AUTH_VERIFY}</button>
        </div>
      </div>
      <div class="field">
        <div class="txt center"><div class="btn btn-headback center">${lang.AUTH_HEADBACK_TXT}</div></div>
      </div>
    </form>`
  }
  async formListener() {
    const btnLang = qutor(".btn-lang", this.el)
    btnLang.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const newLang = await modal.select(SelectLang())
      if (!newLang || newLang === LocalList.lang) {
        this.isLocked = false
        return
      }
      LocalList.lang = newLang
      localSave.save()
      await modal.loading(localeChanger())
      this.isLocked = false
      await this.destroy()
      new SignCode({ email: this.email }).init()
    }
    const btnHeadback = qutor(".btn-headback", this.el)
    btnHeadback.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const confBack = await modal.confirm(lang.AUTH_HEADBACK)
      if (!confBack) {
        this.isLocked = false
        return
      }
      this.isLocked = false
      await this.destroy()
      new SignEmail({ email: this.email }).init()
    }
    const form = qutor("#verify-form", this.el)
    form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      this.isLocked = true
      const data = {}
      const formData = new FormData(form)
      formData.forEach((val, k) => (data[k] = val))
      const userLogin = await modal.loading(xhr.post("/x/auth/verify", data))
      if (!userLogin.ok) {
        await modal.alert(lang[userLogin.msg] || lang.ERROR)
        this.isLocked = false
        return
      }
      this.isLocked = false
      await this.destroy()
      auth_container?.remove()
      new Auth().init()
    }

    const inpCode = qutor("input#code", this.el)
    inpCode.readOnly = true
    inpCode.focus()
    await waittime()
    inpCode.readOnly = false
  }
  async destroy() {
    this.el.classList.add("out")
    await waittime(300, 5)
    this.isLocked = false
    this.el.remove()
  }
  init() {
    this.createElement()
    auth_container?.append(this.el)
    this.formListener()
  }
}
