import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, kel } from "../lib/kel"
import { ILocale } from "../types/LibTypes"

export class Objective {
  private el?: HTMLDivElement
  private p?: HTMLParagraphElement
  private createElement(): void {
    this.el = kel("div", "objective")
    this.p = kel("p")
    this.el.append(this.p)
  }
  update(text: ILocale): void {
    this.destroy()
    this.init()
    this.p!.innerHTML = text[LocalList.lang!]
  }
  destroy(): void {
    this.p?.remove()
    this.el?.remove()
  }
  private init(): void {
    this.createElement()
    eroot().append(this.el!)
    audio.emit({ action: "play", src: "goodnews02", type: "ui", options: { id: Date.now().toString() } })
  }
}

export const objective = new Objective()
