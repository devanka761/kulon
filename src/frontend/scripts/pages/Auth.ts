import dvnkz_v from "../../../config/version.json"
import dvnkz_b from "../../../../public/json/build/buildNumber.json"
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
import Preload from "./Preload"
import { checkScreenSize } from "../manager/screenSize"
import { IModalSelectConfig } from "../types/ModalTypes"
import { SignIn } from "./SignIn"

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

export default class Auth {
  el: HTMLDivElement = kel("div", "Auth")

  async checkUser(): Promise<void> {
    const splash = qutor(".splash", this.el) || kel("div", "splash")
    splash.innerHTML = `<p><i class="fa-solid fa-circle-notch fa-spin"></i> Initializing ...</p>`
    this.el.append(splash)
    this.updateCache()
    await waittime(1000)

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

    const skins = await xhr.forceGet("/json/skins/skin_list.json?v=" + Date.now())
    const sounds = await xhr.forceGet("/json/audio/audio.json?v=" + Date.now())
    splash.classList.add("out")
    await waittime(1000)
    splash.remove()

    this.el.remove()
    auth_container?.remove()

    await checkScreenSize()

    const preload = new Preload({ skins, sounds })
    preload.init()
  }
  async writeForm(): Promise<void> {
    await checkScreenSize()
    auth_container = this.el
    new SignIn(auth_container).init()
  }
  async updateCache(): Promise<void> {
    const CACHE_WHITELIST = `kulon-cache-${dvnkz_v.version}-${dvnkz_b.buildNumber}`
    await caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (CACHE_WHITELIST !== cacheName) {
            return caches.delete(cacheName)
          }
          return Promise.resolve()
        })
      )
    })

    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" })
      } catch (_error) {
        // -
      }
    }
  }
  init(): void {
    eroot().append(this.el)
    this.checkUser()
  }
}
