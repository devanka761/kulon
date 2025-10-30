import audio from "./AudioHandler"
import { kel, eroot } from "./kel"
import waittime from "./waittime"

let nindex = 0
let ndone = 0
let nshowtime: ReturnType<typeof setTimeout> | null = null

const cl = { "0": "p", "1": "g", "2": "y", "3": "r", "4": "rb", "5": "p" }

interface INotipConfig {
  a: string
  b: string
  ic: string
  c: keyof typeof cl
}

class Notip {
  readonly a: string
  readonly b: string
  readonly c: keyof typeof cl
  readonly ic: string
  private el!: HTMLDivElement
  constructor(s: INotipConfig) {
    this.a = s.a
    this.b = s.b
    this.c = s.c
    this.ic = s.ic
  }
  createElement(): void {
    this.el = kel("div", "notip")
  }
  writeData(): void {
    const eicon = kel("div", "icon")
    const etop = kel("div", "top")
    const ebottom = kel("div", "bottom")
    const etext = kel("div", "text")
    etext.append(etop, ebottom)
    const edetail = kel("div", "detail")
    edetail.append(eicon, etext)
    const eclose = kel("div", "close btn-close", { e: `<div class="btn"><i class="fa-solid fa-x"></i></div>` })
    this.el.append(edetail, eclose)
    if (this.c) this.el.classList.add(cl[this.c])
    if (this.ic) eicon.innerHTML = '<i class="fa-solid fa-' + this.ic + '"></i>'
    if (this.a) etop.innerText = this.a
    if (this.b) ebottom.innerText = this.b

    eclose.onclick = () => {
      if (nshowtime) clearTimeout(nshowtime)
      this.destroy()
    }
  }
  async destroy() {
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    ndone++
    if (ndone === nindex) {
      ndone = 0
      nindex = 0
    }
    nshowtime = null
  }
  run() {
    this.createElement()
    this.writeData()
    eroot().append(this.el)
    audio.emit({ action: "play", type: "ui", src: "phone_notification", options: { id: "notip" + Date.now().toString() } })
    nshowtime = setTimeout(() => {
      this.destroy()
    }, 3995)
  }
}

async function addNotip(s: INotipConfig, currIndex: number) {
  if (ndone + 1 !== currIndex) return setTimeout(() => addNotip(s, currIndex), 250)
  if (nshowtime) {
    clearTimeout(nshowtime)
    nshowtime = null
  }

  const notip = new Notip(s)
  notip.run()
}

export default function notip(data: { a?: string; b?: string; c?: string | number; ic?: string }) {
  const color = (data.c?.toString() || "0") as keyof typeof cl

  const newData: INotipConfig = {
    a: data.a || "",
    b: data.b || "",
    ic: data.ic || "bell",
    c: color
  }
  nindex++
  addNotip(newData, nindex)
}
