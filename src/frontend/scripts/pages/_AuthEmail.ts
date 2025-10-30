import lang from "../data/language"
import LocalList from "../data/LocalList"
import { futor, kel } from "../lib/kel"
import { localeChanger } from "../lib/localeChanger"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import localSave from "../manager/storage"
import { IModalSelectConfig } from "../types/modal.types"
import { SignCode } from "./_AuthCode"
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

type Provider = "google" | "github" | "discord" | "guest"
const Providers: Provider[] = ["google", "github", "discord", "guest"]

function loginProvider(provider: Provider, queries: string) {
  const anon = provider === "guest"
  const icon = anon ? "fa-light fa-user-secret" : `fa-brands fa-${provider}`

  const button = kel("div", "inp")
  const a = kel("a", `btn btn-${provider}`, {
    a: { href: `/x/auth/${provider}?${queries}` },
    e: `<i class="${icon}"></i> ${provider} Login`
  })
  button.append(a)

  return { button, a, type: provider }
}

export class SignEmail {
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
    const eProviders = futor(".other-providers", this.el)
    Providers.forEach((k) => {
      const { button, a, type } = loginProvider(k, this.queries)

      if (type === "guest") {
        a.onclick = async (e) => {
          e.preventDefault()
          if (this.isLocked) return
          this.isLocked = true
          const confirmAnon = await modal.confirm(lang["AUTH_ANON_CONFIRM"])
          if (!confirmAnon) {
            this.isLocked = false
            return
          }

          const res = await modal.loading(xhr.post(a.getAttribute("href")!))
          if (!res.ok) {
            await modal.alert(lang[res.msg] || lang.ERROR)
            this.isLocked = false
            return
          }
          await this.destroy()
          this.container.remove()
          new Auth().init()
        }
      } else {
        a.onclick = async (e) => {
          e.preventDefault()
          if (this.isLocked) return
          const oldText = a.innerHTML
          a.innerHTML = `<i class="fa-solid fa-spin fa-circle-notch"></i>`
          await waittime(500)
          window.location.href = a.getAttribute("href")!
          a.innerHTML = oldText
        }
      }

      eProviders.append(button)
    })

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

      new SignEmail(this.container, this.email).init()
    }

    form.onsubmit = async (e) => {
      e.preventDefault()

      if (this.isLocked) return
      this.isLocked = true

      const data: { [key: string]: string } = {}

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

      new SignCode(this.container, userLogin?.data?.email).init()
    }

    const inpEmail = futor("input#email", this.el) as HTMLInputElement
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
    this.container.append(this.el)
    this.formListener()
  }
}
