import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import SaveList from "../data/SaveList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel } from "../lib/kel"
import notip from "../lib/notip"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ILocale } from "../types/lib.types"

interface IHintConfig extends IPMCConfig {
  onComplete: () => void
  classBefore?: IPMC
  text: ILocale[]
}

interface IHint {
  id: string
  idx: number
  text: ILocale
  states: string[]
}

let unread: number = 0

const HINTS: IHint[] = []

function createLi(data: IHint): HTMLLIElement {
  const li = kel("li")
  li.id = data.id
  li.setAttribute("data-idx", data.idx.toString())
  const span = kel("span", "fa-li")
  span.innerHTML = `<i class="fa-duotone fa-circle-exclamation fa-fw"></i>`
  li.append(span, data.text[LocalList.lang!])
  const isDone = data.states.every((state) => SaveList[state])
  if (isDone) {
    li.classList.add("done")
    span.innerHTML = `<i class="fa-duotone fa-circle-check fa-fw"></i>`
  }
  return li
}

function checkDone(li: HTMLLIElement): boolean {
  const id = li.id
  const data = HINTS.find((hint) => hint.id === id)
  if (!data) return false
  if (data.states.every((state) => SaveList[state])) {
    li.classList.add("done")
    const span = futor("span", li)
    span.innerHTML = `<i class="fa-duotone fa-circle-check fa-fw"></i>`
    return true
  }
  return false
}

export class Hint implements IPMC {
  readonly id: string = "hint"
  isLocked: boolean = false
  classBefore?: IPMC
  onComplete: () => void

  private el!: HTMLDivElement
  private ul!: HTMLUListElement

  private esc?: KeyPressListener

  constructor(config: IHintConfig) {
    this.classBefore = config.classBefore
    this.onComplete = config.onComplete
  }
  private createElement(): void {
    this.el = kel("div", "fuwi f-hint")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-duotone fa-solid fa-sneaker-running"></i> ${lang.PHONE_HINT}</div>
        </div>
        <div class="right">
          <span class="keyinfo">esc</span>
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <ul class="fa-ul">
        </ul>
      </div>
    </div>`
    this.ul = futor(".fa-ul", this.el) as HTMLUListElement
  }
  private writeData(): void {
    const list = HINTS.map((hint) => createLi(hint))
    this.sort(list)
  }
  private sort(list: HTMLLIElement[]): void {
    const sortedList = list.sort((_a, _b) => {
      const a = Number(_a.getAttribute("data-idx") || 0)
      const b = Number(_b.getAttribute("data-idx") || 0)

      if (a > b) return 1
      if (a < b) return -1
      return 0
    })
    sortedList.forEach((li) => {
      this.ul.append(li)
      checkDone(li)
    })

    const firstHint = sortedList.find((li) => !li.classList.contains("done"))
    firstHint?.classList.add("highlight")
  }
  private toBottom(): void {
    // @ts-expect-error no default types
    this.ul.lastElementChild?.scrollIntoView({ behavior: "instant", block: "center", container: "nearest" })
  }
  private async btnListener(): Promise<void> {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }
  update(...args: IHint[]): void {
    const list = Array.from(this.ul.querySelectorAll("li")) as HTMLLIElement[]
    if (args.length > 0) {
      args.forEach((data) => {
        const newLi = createLi(data)
        list.push(newLi)
      })
    }

    this.sort(list)
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    this.isLocked = true
    this.esc?.unbind()
    this.el.classList.add("out")
    await waittime()
    this.esc?.unbind()
    this.el.remove()
    this.isLocked = false
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  async init(): Promise<void> {
    db.pmc = this
    unread -= unread
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.createElement()
    eroot().append(this.el)
    this.writeData()
    await waittime()
    this.toBottom()
    this.btnListener()
  }
}

export function setHint(...args: IHint[]): void {
  const hasHint = args.length > 0

  if (hasHint) {
    args = args.filter((data) => !HINTS.find((hint) => hint.id === data.id))
    HINTS.push(...args)
  }

  if (db.pmc?.id === "hint") {
    const pmc = db.pmc as Hint
    pmc.update(...args)
    return
  }

  if (args.length < 1) return

  unread++

  notip({
    c: "2",
    ic: "sneaker-running",
    a: lang.HINT_UPDATED
  })
}

export async function checkHint(states: string[]): Promise<void> {
  const isMatch = HINTS.some((hint) => hint.states.every((state) => states.includes(state)))
  if (!isMatch) return

  await waittime()

  setHint()

  notip({
    c: "2",
    ic: "sneaker-running",
    a: lang.HINT_UPDATED
  })
}

export function hintHasUnread(): boolean {
  return unread > 0
}

export function resetHint(): void {
  HINTS.splice(0, HINTS.length)
}
