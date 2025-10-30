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
import { SignEmail } from "./_AuthEmail"
import { IModalSelectConfig } from "../types/modal.types"

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

let auth_container: HTMLDivElement | null = null
let doodle: Doodle | null = null

export default class Auth {
  el: HTMLDivElement = kel("div", "Auth")

  async checkUser(): Promise<void> {
    const splash = qutor(".splash", this.el) || kel("div", "splash")
    splash.innerHTML = `<p><i class="fa-solid fa-circle-notch fa-spin"></i> Initializing ...</p>`
    this.el.append(splash)
    await waittime(1000)

    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch (_error) {
        // -
      }
    }

    if (!LocalList.lang) {
      const newLang = await modal.select(SelectLang())

      const currLang = newLang === "en" || newLang === "id" ? newLang : "id"

      LocalList.lang = currLang
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

    const skins = await xhr.get("/json/skins/skin_list.json?v=" + Date.now())
    const sounds = await xhr.get("/json/audio/audio.json?v=" + Date.now())
    splash.classList.add("out")
    await waittime(1000)
    splash.remove()

    this.el.remove()
    auth_container?.remove()

    await checkScreenSize()

    const preload = new Preload({ skins, sounds, doodle })
    preload.init()
  }
  writeForm(): void {
    auth_container = this.el
    doodle = new Doodle({ root: eroot(), fillRatio: 0.4, strength: 30, delay: 500 })
    new SignEmail(auth_container).init()
  }
  init(): void {
    eroot().append(this.el)
    this.checkUser()
  }
}
