import lang from "../data/language"
import LocalList from "../data/LocalList"
import { futor, kel } from "../lib/kel"
import { localeChanger } from "../lib/localeChanger"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import localSave from "../manager/storage"
import { IModalSelectConfig } from "../types/ModalTypes"
import Auth from "./Auth"

function SelectLang(): Partial<IModalSelectConfig> {
  return {
    ic: "language",
    msg: "Language",
    items: [
      { id: "id", label: "Bahasa Indonesia", activated: !LocalList.lang || LocalList.lang === "id" },
      { id: "en", label: "English", activated: LocalList.lang === "en" }
    ]
  }
}

const strings: Record<string, () => string> = {
  processing: () => `<i class="fa-solid fa-circle-notch fa-spin"></i>`,
  login: () => `<i class="fa-solid fa-arrow-right-to-arc"></i> ${lang.AUTH_LOGIN}`,
  luunna: () => `<img src="/images/providers/luunna.svg" class="provider-icon" /><span>Luunna</span>`,
  google: () => `<img src="/images/providers/google.svg" class="provider-icon" /> <span>Google</span>`,
  discord: () => `<img src="/images/providers/discord.svg" class="provider-icon" /> <span>Discord</span>`,
  github: () => `<img src="/images/providers/github_white.svg" class="provider-icon" /> <span>GitHub</span>`,
  tiktok: () => `<img src="/images/providers/tiktok.svg" class="provider-icon" /> <span>TikTok</span>`,
  facebook: () => `<img src="/images/providers/facebook.svg" class="provider-icon" /> <span>Facebook</span>`,
  guest: () => `<i class="fa-light fa-user-secret"></i> <span>${lang.AUTH_GUEST}</span>`
}

const IN_DEVELOPMENTS = ["tiktok", "facebook"]

export class SignIn {
  private email?: string
  private container: HTMLDivElement
  isLocked: boolean = false
  private queries: string
  el: HTMLDivElement = kel("div", "box")
  constructor(container: HTMLDivElement, email?: string) {
    this.email = email
    this.container = container

    const urlParams = new URLSearchParams(window.location.search)
    const pageQueries = ["s=1"]
    const queryR = urlParams.get("r")
    pageQueries.push("r=" + (queryR || "app"))
    const queryPwa = urlParams.get("pwa")
    if (queryPwa) pageQueries.push("pwa=" + queryPwa)
    this.queries = pageQueries.join("&")
  }
  createElement() {
    this.el.innerHTML = `
    <div class="top">
      <p>KULON x LUNA</p>
    </div>

    <div class="motto">
      <p>${lang.AUTH_LUNA_KULON}</p>
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
          <input type="email" name="email" id="email" autocomplete="email" placeholder="example@example.com" required />
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
        <a href="/x/auth/luunna" class="btn btn-luunna" id="luunna-login">
          <img src="/images/providers/luunna.svg" class="provider-icon" />
          <span>Luunna</span>
        </a>

        <a href="/x/auth/google" class="btn btn-google" id="google-login">
          <img src="/images/providers/google.svg" class="provider-icon" />
          <span>Google</span>
        </a>

        <a href="/x/auth/github" class="btn btn-github" id="github-login">
          <img src="/images/providers/github_white.svg" class="provider-icon" />
          <span>GitHub</span>
        </a>

        <a href="/x/auth/discord" class="btn btn-discord" id="discord-login">
          <img src="/images/providers/discord.svg" class="provider-icon" />
          <span>Discord</span>
        </a>

        <a href="/x/auth/tiktok" class="btn btn-tiktok" id="tiktok-login">
          <img src="/images/providers/tiktok.svg" class="provider-icon" />
          <span>TikTok</span>
        </a>

        <a href="/x/auth/facebook" class="btn btn-facebook" id="facebook-login">
          <img src="/images/providers/facebook.svg" class="provider-icon" />
          <span>Facebook</span>
        </a>

        <a href="/x/auth/guest" class="btn btn-guest" id="guest-login">
          <i class="fa-light fa-user-secret"></i> <span>${lang.AUTH_GUEST}</span>
        </a>
      </div>
      <div class="field center">
        <div class="txt center"><p>${lang.AUTH_NOTICE}</p></div>
      </div>
    </form>`
  }
  async formListener() {
    const form = futor("#sign-in-form", this.el) as HTMLFormElement

    const btnLang = futor(".btn-lang", this.el)
    btnLang.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true

      const newLang = await modal.select(SelectLang())
      if (!newLang || newLang === LocalList.lang) {
        this.isLocked = false
        return
      }

      if (newLang !== "en" && newLang !== "id") {
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

      new SignIn(this.container, this.email).init()
    }

    form.onsubmit = async (e) => {
      e.preventDefault()

      if (this.isLocked) return
      this.isLocked = true

      const data: Record<string, string | number> = {
        lang: LocalList.lang || "id"
      }

      const formData = new FormData(form)
      formData.forEach((val, k) => (data[k] = val.toString()))

      const userLogin = await modal.loading(xhr.post("/x/auth/sign-in", data))

      if (!userLogin.ok) {
        await modal.alert(lang[userLogin.msg] || lang.ERROR)
        this.isLocked = false
        return
      }

      this.isLocked = false

      window.location.href = userLogin.data.url
    }

    const inpEmail = futor("input#email", this.el) as HTMLInputElement
    inpEmail.readOnly = true
    inpEmail.focus()
    await waittime()
    inpEmail.readOnly = false
  }

  providerListener(): void {
    const loginButtons = document.querySelectorAll(".other-providers .btn") as NodeListOf<HTMLAnchorElement>

    loginButtons.forEach((btn) => {
      const currHref = btn.getAttribute("href") as string
      const btnId = btn.getAttribute("id")!.toString().replace("-login", "")

      btn.href = IN_DEVELOPMENTS.find((k) => k === btnId) ? window.location.href : `${currHref}?locale=${LocalList.lang || "id"}&${this.queries}`

      btn.onclick = async (e) => {
        e.preventDefault()
        if (this.isLocked) return
        this.isLocked = true

        if (IN_DEVELOPMENTS.find((k) => k === btnId)) {
          await modal.alert(lang.AUTH_PROVIDER_MAINTENANCE.replace(/{PROVIDER}/, btnId))
          this.isLocked = false
          return
        }

        btn.style.width = `${btn.offsetWidth}px`
        btn.innerHTML = strings.processing()
        await waittime(1000)
        btn.removeAttribute("style")

        if (btnId === "guest") {
          btn.innerHTML = strings[btnId]()
          const confirmAnon = await modal.confirm(lang["AUTH_ANON_CONFIRM"])
          if (!confirmAnon) {
            this.isLocked = false
            return
          }

          const res = await modal.loading(xhr.post(btn.getAttribute("href")!))
          if (!res.ok) {
            await modal.alert(lang[res.msg] || lang.ERROR)
            this.isLocked = false
            return
          }
          await this.destroy()
          this.container.remove()
          new Auth().init()
          return
        }

        this.isLocked = false
        window.location.href = btn.getAttribute("href") as string
        btn.innerHTML = strings[btnId]()
      }
    })
  }

  async destroy() {
    this.el.classList.add("out")
    await waittime(300, 5)
    this.isLocked = false
    this.el.remove()
  }
  init() {
    this.createElement()
    this.container.append(this.el)
    this.formListener()
    this.providerListener()
  }
}
