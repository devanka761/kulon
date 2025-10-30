import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel } from "../lib/kel"
import waittime from "../lib/waittime"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ILocale, SSKelement } from "../types/lib.types"

interface IPaperConfig extends IPMCConfig {
  onComplete: () => void
  classBefore?: IPMC
  text: ILocale[]
  name: ILocale
}

const spanRegex = /\*(.*?)\*/g
// const imgRegex = /\_(.*?)\_/g

export default class Paper implements IPMC {
  id: string = "paper"
  isLocked: boolean = false
  onComplete: () => void
  classBefore?: IPMC

  private el!: HTMLDivElement

  private text: ILocale[]
  private name: ILocale

  private enter?: KeyPressListener
  private esc?: KeyPressListener
  private keyRight?: KeyPressListener
  private keyLeft?: KeyPressListener
  private keyScrollHandler?: (e: KeyboardEvent) => void

  private currentPage: number = 1
  private totalPages: number = 1

  private content!: SSKelement
  private btnPrev!: HTMLButtonElement
  private btnNext!: HTMLButtonElement
  private pageIndicator!: SSKelement
  constructor(config: IPaperConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
    this.text = config.text
    this.name = config.name
    this.keyScrollHandler = this._handleScrollKeys.bind(this)
  }

  private createElement(): void {
    this.el = kel("div", "f-paper")
    this.el.innerHTML = `
    <div class="box">
      <div class="actions">
        <div class="act act-1">
          <span class="keyinfo">PageUp</span>
          <i class="fa-solid fa-chevrons-up"></i>
          <span class="keyinfo">PageDown</span>
          <i class="fa-solid fa-chevrons-down"></i>
        </div>
        <div class="act act-2">
          <span class="keyinfo">esc</span> <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>


      <div class="content">
      </div>

      <div class="navigation">
        <button class="nav-btn btn-prev" disabled>
          <span class="keyinfo"><i class="fa-solid fa-chevron-left"></i></span>
          <span>${lang.PAPER_PREV}</span>
        </button>

        <span class="page-indicator">${lang.PAPER_PAGE} ${this.currentPage} ${lang.PAPER_OF} ${this.totalPages}</span>

        <button class="nav-btn btn-next">
          <span>${lang.PAPER_NEXT}</span>
          <span class="keyinfo">Enter</span>
          <span>/</span>
          <span class="keyinfo"><i class="fa-solid fa-chevron-right"></i></span>
        </button>
      </div>
    </div>`
  }

  private writeContent(): void {
    this.content = futor(".content", this.el)
    this.text.forEach((fulltext, i) => {
      const page_number = i + 1

      const page = kel("div", "page", { a: { "data-page": page_number.toString() } })
      if (page_number === 1) page.classList.add("active")
      const h2 = kel("h2", null, { e: this.name[LocalList.lang!] })
      const parts = fulltext[LocalList.lang!].split("\n")
      const paragraphs = parts.map((part) => {
        const text = part.replace(spanRegex, "<span>$1</span>")
        const p = kel("p", null, { e: text })
        return p
      })
      page.append(h2, ...paragraphs)
      this.content.append(page)
    })

    this.btnPrev = futor(".btn-prev", this.el) as HTMLButtonElement
    this.btnNext = futor(".btn-next", this.el) as HTMLButtonElement
    this.pageIndicator = futor(".page-indicator", this.el)
    this.totalPages = this.el.querySelectorAll(".page").length

    this.updateUI()
  }

  private previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--
      this.updatePage()
    }
  }

  private nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++
      this.updatePage()
    }
  }

  private updatePage(): void {
    audio.emit({ action: "play", type: "ui", src: "paper_flutter", options: { id: Date.now().toString() } })
    this.el.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active")
    })

    const currentPageElement = futor(`.page[data-page="${this.currentPage}"]`, this.el)
    if (currentPageElement) {
      currentPageElement.classList.add("active")
    }

    const content = futor(".content", this.el)
    content.scrollTop = 0

    this.updateUI()
  }

  private updateUI(): void {
    this.btnPrev.disabled = this.currentPage === 1
    this.btnNext.disabled = this.currentPage === this.totalPages

    this.pageIndicator.textContent = `${lang.PAPER_PAGE} ${this.currentPage} ${lang.PAPER_OF} ${this.totalPages}`

    this.pageIndicator.style.transform = "scale(1.1)"
    setTimeout(() => {
      this.pageIndicator.style.transform = "scale(1)"
    }, 200)
  }

  private async btnListener(): Promise<void> {
    document.addEventListener("keydown", this.keyScrollHandler!)
    await waittime(500)
    this.btnPrev.onclick = () => {
      if (this.isLocked) return
      this.previousPage()
    }
    this.btnNext.onclick = () => {
      if (this.isLocked) return
      this.nextPage()
    }

    this.keyRight = new KeyPressListener("arrowright", () => this.btnNext.click())
    this.enter = new KeyPressListener("enter", () => this.btnNext.click())
    this.keyLeft = new KeyPressListener("arrowleft", () => this.btnPrev.click())

    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.isLocked) return
      this.destroy(this.classBefore)
    }

    this.esc = new KeyPressListener("escape", () => {
      btnClose.click()
    })
  }

  private _handleScrollKeys(e: KeyboardEvent): void {
    if (e.key !== "PageUp" && e.key !== "PageDown") {
      return
    }
    e.preventDefault()
    if (e.key === "PageDown") {
      this.content.scrollBy({
        top: this.content.clientHeight * 0.25,
        behavior: "smooth"
      })
    } else {
      this.content.scrollBy({
        top: -this.content.clientHeight * 0.25,
        behavior: "smooth"
      })
    }
  }

  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    audio.emit({ action: "play", type: "ui", src: "paper_roll", options: { id: "paper_roll" } })
    this.el.classList.add("out")
    this.enter?.unbind()
    this.keyRight?.unbind()
    this.keyLeft?.unbind()
    this.esc?.unbind()
    document.removeEventListener("keydown", this.keyScrollHandler!)
    await waittime(500)
    this.enter?.unbind()
    this.keyRight?.unbind()
    this.keyLeft?.unbind()
    this.esc?.unbind()
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "paper_roll", options: { id: "paper_roll" } })
    this.createElement()
    eroot().append(this.el)
    this.writeContent()
    this.btnListener()
  }
}
