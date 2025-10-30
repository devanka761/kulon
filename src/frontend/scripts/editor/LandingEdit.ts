import { eroot, kel } from "../lib/kel"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import StartEditor from "./StartEdit"

const urlParams = new URLSearchParams(window.location.search)
const skipIntro = urlParams.get("s")

export default class LandingEdit {
  private el: HTMLParagraphElement = kel("p", "LandingEdit")
  createElement() {
    this.el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting<br/><i class="fa-solid fa-map"></i> <i class="fa-regular fa-map"></i> <i class="fa-light fa-map"></i> <i class="fa-thin fa-map"></i> <i class="fa-duotone fa-solid fa-map"></i> <i class="fa-duotone fa-regular fa-map"></i> <i class="fa-duotone fa-light fa-map"></i> <i class="fa-duotone fa-thin fa-map"></i> <i class="fa-sharp fa-solid fa-map"></i> <i class="fa-sharp fa-regular fa-map"></i> <i class="fa-sharp fa-light fa-map"></i> <i class="fa-sharp fa-thin fa-map"></i> <i class="fa-sharp-duotone fa-solid fa-map"></i> <i class="fa-sharp-duotone fa-regular fa-map"></i> <i class="fa-sharp-duotone fa-light fa-map"></i> <i class="fa-sharp-duotone fa-thin fa-map"></i>`
  }
  async checkUser(): Promise<void> {
    const isUser = await xhr.get("/x/auth/isUser")
    if (!isUser.ok && isUser.code === 403) {
      this.el.innerHTML = `You are not allowed to access this page<br/>This page can only be accessed by admins<br/><a href="/app">Back to App</a>`
      return
    }
    if (!isUser.ok && isUser.code === 401) {
      this.el.innerHTML = `Please login to the game first before start the editor<br/><a href="/app?r=editor${skipIntro ? "&s=1" : ""}">Login</a>`
      return
    }
    if (!isUser.ok) {
      await waittime(1000)
      return await this.checkUser()
    }
    this.el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Getting Editor Ready`
    this.checkMapData()
  }
  async checkMapData(): Promise<void> {
    await waittime(1200)
    const mapList = await xhr.get("/x/mod/editor-mapdata")
    this.el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Loading`
    await waittime(1000)
    if (!mapList.ok) {
      await waittime(1200)
      return this.checkMapData()
    }
    this.destroy()
    new StartEditor({ maplist: mapList.data }).run()
  }
  destroy() {
    this.el.remove()
  }
  run() {
    this.createElement()
    eroot().append(this.el)
    this.checkUser()
  }
}
