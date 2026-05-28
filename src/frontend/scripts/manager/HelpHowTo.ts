import lang from "../data/language"
import { eroot, kel } from "../lib/kel"
import waittime from "../lib/waittime"

export class HelpHowTo {
  readonly id: string = "helphowto"
  private el!: HTMLDivElement
  private createElement(): void {
    this.el = kel("div", "helphowto")
    this.el.innerHTML = `<p><span class="keyinfo">W</span><span class="keyinfo">A</span><span class="keyinfo">S</span><span class="keyinfo">D</span> <span>${lang.HELP_MOVE}</span></p><p><span class="keyinfo">E</span> <span>${lang.HELP_TALK}</span></p><p><span class="keyinfo">Esc</span> <span>${lang.HELP_PAUSE}</span></p>`
  }
  async destroy(): Promise<void> {
    this.el.classList.add("out")
    await waittime(300)
    this.el.remove()
  }
  init(): void {
    this.createElement()
    eroot().append(this.el)
  }
}

export const helpHowTo = new HelpHowTo()
