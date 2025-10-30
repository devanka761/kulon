import lang from "../data/language"
import LocalList from "../data/LocalList"
import { futor, kel } from "../lib/kel"
import { localeChanger } from "../lib/localeChanger"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import localSave from "../manager/storage"
import { IModalSelectConfig } from "../types/modal.types"
import { SignEmail } from "./_AuthEmail"
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

export class SignCode {
  private email?: string
  private container: HTMLDivElement
  isLocked: boolean = false
  el: HTMLDivElement = kel("div", "box")
  constructor(container: HTMLDivElement, email?: string) {
    this.email = email
    this.container = container
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

      LocalList.lang = newLang
      localSave.save()

      await modal.loading(localeChanger())

      this.isLocked = false

      await this.destroy()

      new SignCode(this.container, this.email).init()
    }

    const btnHeadback = futor(".btn-headback", this.el)
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

      new SignEmail(this.container, this.email).init()
    }

    const form = futor("#verify-form", this.el) as HTMLFormElement
    form.onsubmit = async (e) => {
      e.preventDefault()

      if (this.isLocked) return
      this.isLocked = true

      const data: { [key: string]: string } = {}
      const formData = new FormData(form)
      formData.forEach((val, k) => (data[k] = val.toString()))

      const userLogin = await modal.loading(xhr.post("/x/auth/verify", data))
      if (!userLogin.ok) {
        await modal.alert(lang[userLogin.msg] || lang.ERROR)
        this.isLocked = false
        return
      }

      this.isLocked = false
      await this.destroy()

      this.container.remove()
      new Auth().init()
    }

    const inpCode = futor("input#code", this.el) as HTMLInputElement
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
    this.container.append(this.el)
    this.formListener()
  }
}
