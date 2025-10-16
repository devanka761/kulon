import { eroot, kel } from "../lib/kel"
import waittime from "../lib/waittime"

interface ImgObject {
  src: string
  alt: string
}
const imgSources: ImgObject[] = [
  { src: "hiccupsraven", alt: "Hiccups Raven Games" },
  { src: "devanka761", alt: "Devanka 761" },
  { src: "Kulon", alt: "Kulon" }
]

const icons = ["fa-whiteboard fa-semibold fa-user", "fa-thumbprint fa-light fa-user", "fa-slab-press fa-regular fa-user", "fa-slab fa-regular fa-user", "fa-sharp-duotone fa-thin fa-user", "fa-sharp-duotone fa-solid fa-user", "fa-sharp-duotone fa-regular fa-user", "fa-sharp-duotone fa-light fa-user", "fa-sharp fa-thin fa-user", "fa-sharp fa-solid fa-user", "fa-sharp fa-regular fa-user", "fa-sharp fa-light fa-user", "fa-notdog-duo fa-solid fa-user", "fa-notdog fa-solid fa-user", "fa-jelly-fill fa-regular fa-user", "fa-jelly-duo fa-regular fa-user", "fa-jelly fa-regular fa-user", "fa-etch fa-solid fa-user", "fa-duotone fa-thin fa-user", "fa-duotone fa-solid fa-user", "fa-duotone fa-regular fa-user", "fa-duotone fa-light fa-user", "fa-thin fa-user", "fa-solid fa-user", "fa-regular fa-user", "fa-light fa-user", "fa-brands fa-github", "fa-chisel fa-regular fa-user"]

export default class Intro {
  private el: HTMLDivElement = kel("div", "Intro")
  private box: HTMLDivElement = kel("div", "box")
  private preloadIcons: HTMLDivElement = kel("div", "icon-packs")
  private _createElement() {
    icons.forEach((icon) => this.preloadIcons.append(kel("i", icon)))

    this.el.append(this.preloadIcons, this.box)
    eroot().append(this.el)
  }
  private _renderImage(config: ImgObject): Promise<void> {
    return new Promise((resolve) => {
      const imgPath = `/images/${config.src}.png`
      const img = new Image()
      img.src = imgPath
      img.alt = config.alt
      img.onerror = () => {
        img.remove()
        resolve()
      }
      img.onload = async () => {
        this.box.className = "box show"
        await waittime(2000)
        this.box.className = "box hide"
        await waittime(600)
        img.remove()
        resolve()
      }
      this.box.append(img)
    })
  }
  private async _startIntro(): Promise<void> {
    for (let i = 0; i < imgSources.length; i++) {
      await this._renderImage(imgSources[i])
    }
  }
  destroy() {
    this.preloadIcons.remove()
    this.el.remove()
  }
  async init(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search)
    const skipIntro = urlParams.get("s")
    if (!skipIntro) {
      this._createElement()
      await this._startIntro()
    }
    this.destroy()
  }
}
