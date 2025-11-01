import asset from "../data/assets"
import db from "../data/db"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import chat from "../manager/Chat"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ISival, SSKelement } from "../types/lib.types"

const fingImg = ["fingclo_a.svg", "fingclo_b.svg", "fingclo_c.svg"]

export default class FingerprintCloner implements IPMC {
  id: string = "minigame"
  isLocked: boolean = false
  onComplete: (val?: string) => void

  private imgpar: number = 0
  private scale: number = 2
  private nFingImg: string[] = []

  private el!: HTMLDivElement

  private navKeyHandler?: (...args: ISival) => ISival

  private connections!: SSKelement
  private target!: SSKelement
  private imgTarget?: HTMLImageElement

  constructor(config: IPMCConfig) {
    this.onComplete = config.onComplete
  }
  private createElement(): void {
    this.el = kel("div", "FingClo")
    this.el.innerHTML = `
    <div class="conn">
      <div class="top">
        <div class="left">
          <div class="desc">target</div>
          <div class="content" data-target="fingclo"></div>
        </div>
        <div class="right">
          <div class="desc">components</div>
          <div class="content">
            <div class="box" data-connections="fingclo"></div>
          </div>
        </div>

      </div>
      <div class="bottom">
        <div class="left">
          <div class="title">connections</div>
          <div class="step" data-step="fingclo">
            <div class="sq"></div>
            <div class="sq"></div>
          </div>
        </div>
        <div class="right">
          <div class="btn btn-help" data-help="fingclo"><span class="keyinfo">I</span> HELP</div>
          <div class="btn btn-abort" data-abort="fingclo"><span class="keyinfo">Esc</span> ABORT</div>
        </div>
      </div>
    </div>`
    this.target = futor("[data-target]", this.el)
    this.connections = futor("[data-connections]", this.el)
  }
  private async tutorPopup(): Promise<void> {
    this.isLocked = true
    await modal.alert(`<ul>
<li>Objek di kiri adalah target sidik jari</li>
<li>Objek di kanan adalah komponen sidik jari</li>
</ul>
<ol>
<li>Urutkan komponen sehingga cocok dengan target</li>
<li>Tekan panah (kanan - kiri) pada komponen untuk pindah urutan</li>
<li>Tekan "ABORT" untuk membatalkan</li>
</ol>
<ul>
<li>Cloner memiliki 3 koneksi yang harus diselesaikan</li>
</ul>`)
    this.isLocked = false
  }
  private shuffleImg(): void {
    for (let i = 0; i < 3; i++) {
      const uFing = fingImg.filter((_n) => !this.nFingImg.includes(_n))
      this.nFingImg.push(uFing[Math.floor(Math.random() * uFing.length)])
    }
  }
  private async stageDetail(): Promise<void> {
    const stage = kel("div", "fingscan")
    stage.innerHTML = `
      <div class="content">
        <div class="desc">CONNECTION</div>
        <div class="desc">${this.imgpar + 1}/2</div>
        <div class="desc">WAITING</div>
      </div>`
    this.el.appendChild(stage)
    await waittime(1500)
    stage.classList.add("out")
    await waittime(400)
    stage.remove()
  }
  private nextConn(): void {
    if (this.imgpar < 1) return

    const elConns = this.el.querySelectorAll("[data-step] .sq")[this.imgpar - 1]
    elConns.classList.add("done")
  }
  private abortListener(): void {
    const btnAbort = futor("[data-abort]", this.el)
    btnAbort.onclick = () => {
      this.onLastCheck(false)
    }

    const btnHelp = futor("[data-help]", this.el)
    btnHelp.onclick = () => this.tutorPopup()
  }
  private async placeConnections(): Promise<void> {
    this.isLocked = true
    await this.stageDetail()

    const img = new Image()
    img.src = asset[this.nFingImg[this.imgpar]].src
    img.alt = "Fingerprint Cloner Target"

    this.imgTarget = img
    this.target.appendChild(img)

    await new Promise((resolve: (...args: ISival) => ISival) => {
      img.onload = () => {
        const imgHeight = () => {
          return img.offsetHeight
        }
        const fingcoor = [0, imgHeight() / 8 + 6, imgHeight() - (imgHeight() / 8) * 6 + 6, imgHeight() - (imgHeight() / 8) * 5 + 6, imgHeight() - (imgHeight() / 8) * 4 + 6, imgHeight() - (imgHeight() / 8) * 3 + 6, imgHeight() - (imgHeight() / 8) * 2 + 6, imgHeight() - imgHeight() / 8 + 6]

        for (let i = 0; i < 8; i++) {
          const imgcover = kel("div", "imgcover")
          if (i === 0) imgcover.classList.add("selected")
          imgcover.innerHTML = `
            <div class="aleft arrow"><i class="fa-solid fa-chevron-left"></i></div>
            <div class="aright arrow"><i class="fa-solid fa-chevron-right"></i></div>
          `
          imgcover.style.width = `${img.offsetWidth}px`
          imgcover.style.height = `${img.offsetHeight / 8 - 5}px`

          const definePos = i === 0 ? 7 : Math.floor(Math.random() * fingcoor.length)
          const setCoor = fingcoor[definePos]

          imgcover.setAttribute("data-pos", i.toString())
          imgcover.setAttribute("data-coor", definePos.toString())
          imgcover.style.backgroundImage = `url(${img.src})`
          imgcover.style.backgroundPositionY = `-${setCoor}px`
          imgcover.onmouseenter = () => {
            const selected = this.connections.querySelector(".imgcover.selected")
            if (selected) selected.classList.remove("selected")
            imgcover.classList.add("selected")
          }

          this.connections.appendChild(imgcover)

          const arrow_left = futor(".aleft.arrow", imgcover)
          arrow_left.onclick = () => {
            audio.emit({ action: "play", type: "ui", src: "hack_selector", options: { id: Date.now().toString() } })

            let oCoor = Number(imgcover.getAttribute("data-coor"))
            oCoor--
            if (oCoor < 0) oCoor = 7
            imgcover.setAttribute("data-coor", oCoor.toString())
            imgcover.style.backgroundPositionY = `-${fingcoor[oCoor]}px`
            this.checkConnections()
          }
          const arrow_right = futor(".aright.arrow", imgcover)
          arrow_right.onclick = () => {
            audio.emit({ action: "play", type: "ui", src: "hack_selector", options: { id: Date.now().toString() } })

            let oCoor = Number(imgcover.getAttribute("data-coor"))
            oCoor++
            if (oCoor > 7) oCoor = 0
            imgcover.setAttribute("data-coor", oCoor.toString())
            imgcover.style.backgroundPositionY = `-${fingcoor[oCoor]}px`
            this.checkConnections()
          }
        }

        resolve()
      }

      this.sizeListener(true)
    })
    this.isLocked = false
  }
  private async checkConnections(): Promise<void> {
    const elConns = this.connections.querySelectorAll(".imgcover")
    let conCorrect = 0
    elConns.forEach((elConn) => {
      if (elConn.getAttribute("data-pos") === elConn.getAttribute("data-coor")) conCorrect++
    })
    if (conCorrect >= 8) {
      this.isLocked = true
      const scanningId = "scan_" + Date.now().toString()

      audio.emit({ action: "play", type: "sfx", src: "hack_scanning", options: { id: scanningId } })
      const fingscan = kel("div", "fingscan")
      fingscan.innerHTML = `
      <div class="content">
          <div></div>
          <div class="box">
            <div class="connection"></div>
            <div class="connection"></div>
            <div class="connection"></div>
            <div class="connection"></div>
          </div>
          <div class="desc">CHECKING</div>
      </div>`
      this.el.appendChild(fingscan)
      await waittime(1500)
      audio.emit({ action: "stop", type: "sfx", id: scanningId })

      audio.emit({ src: "hack_match", action: "play", type: "sfx", options: { id: Date.now().toString() } })

      futor(".desc", fingscan).innerHTML = "CONNECTED"
      futor(".desc", fingscan).classList.add("cyan")
      futor(".box", fingscan).classList.add("correct")

      this.imgpar++
      this.nextConn()

      await waittime(1500)
      fingscan.classList.add("out")

      await waittime(400)
      fingscan.remove()

      const img = this.imgTarget

      img?.remove()
      this.imgTarget = undefined

      const elConnImgs = this.connections.querySelectorAll(".imgcover")
      elConnImgs.forEach((elConnImg) => elConnImg.remove())

      if (this.imgpar >= 2) return this.onLastCheck(true)

      this.placeConnections()

      audio.emit({ src: "hack_next", action: "play", type: "sfx", options: { id: Date.now().toString() } })
    }
  }
  private async onLastCheck(condition?: boolean): Promise<void> {
    this.isLocked = true
    if (condition) {
      audio.emit({ src: "hack_success", action: "play", type: "sfx", options: { id: Date.now().toString() } })
    } else {
      audio.emit({ src: "hack_failed", action: "play", type: "sfx", options: { id: Date.now().toString() } })
    }
    const elLastCheck = kel("div", `fingscan ${condition ? "true" : "false"}`)
    elLastCheck.innerHTML = `
    <div class="content">
      <div class="desc"></div>
      <div class="desc" style="color:#000000">CONNECTION ${condition ? "RESOLVED" : "REJECTED"}</div>
      <div class="desc"></div>
    </div>`
    this.el.appendChild(elLastCheck)
    await waittime(2500)
    elLastCheck.classList.add("out")

    audio.emit({ action: "stop", type: "bgm", options: { fadeOut: 1000 } })

    await waittime(400)
    elLastCheck.remove()
    this.isLocked = false
    this.destroy(condition)
  }
  private navKeyListener(): void {
    this.navKeyHandler = (e) => {
      if (this.isLocked) return
      if (chat.formOpened) return
      const key = e.key

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape", "i", "I"].includes(key)) return
      e.preventDefault()

      if (key === "Escape") {
        qutor("[data-abort]", this.el)?.click()
        return
      }

      if (key.toLowerCase() === "i") {
        qutor("[data-help]", this.el)?.click()
        return
      }

      const allCovers = Array.from(this.connections.querySelectorAll(".imgcover")) as HTMLDivElement[]
      if (allCovers.length === 0) return

      const currentIndex = allCovers.findIndex((c) => c.classList.contains("selected"))

      if (key === "ArrowUp" || key === "ArrowDown") {
        if (currentIndex > -1) {
          allCovers[currentIndex].classList.remove("selected")
        }

        let nextIndex
        if (key === "ArrowDown") {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % allCovers.length
        } else {
          nextIndex = currentIndex <= 0 ? allCovers.length - 1 : currentIndex - 1
        }

        allCovers[nextIndex].classList.add("selected")
        allCovers[nextIndex].scrollIntoView({ behavior: "smooth", block: "center" })

        audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
      } else if (key === "ArrowLeft" || key === "ArrowRight") {
        const activeCover = currentIndex > -1 ? allCovers[currentIndex] : allCovers[0]

        if (activeCover) {
          if (!activeCover.classList.contains("selected")) activeCover.classList.add("selected")
          const arrow = key === "ArrowLeft" ? ".aleft" : ".aright"
          qutor(arrow, activeCover)?.click()
        }
      }
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  private sizeListener(condition?: boolean): void {
    const resizing = () => {
      if (!this.imgTarget) return
      const img = this.imgTarget
      const imgHeight = () => {
        return img.offsetHeight
      }
      const fingcoor = [0, imgHeight() / 8 + 6, imgHeight() - (imgHeight() / 8) * 6 + 6, imgHeight() - (imgHeight() / 8) * 5 + 6, imgHeight() - (imgHeight() / 8) * 4 + 6, imgHeight() - (imgHeight() / 8) * 3 + 6, imgHeight() - (imgHeight() / 8) * 2 + 6, imgHeight() - imgHeight() / 8 + 6]

      const elConns = this.connections.querySelectorAll(".imgcover") as NodeListOf<HTMLDivElement>

      elConns.forEach((elConn) => {
        elConn.style.width = `${img.offsetWidth}px`
        elConn.style.height = `${img.offsetHeight / 8 - 5}px`
        const i = Number(elConn.getAttribute("data-coor"))
        elConn.style.backgroundPositionY = `-${fingcoor[i]}px`
      })
    }

    if (condition) {
      window.removeEventListener("resize", resizing)
      window.addEventListener("resize", resizing)
    } else {
      window.removeEventListener("resize", resizing)
    }
  }
  destroy(next?: boolean | IPMC): void {
    this.sizeListener(false)
    document.removeEventListener("keydown", this.navKeyHandler!)
    this.navKeyHandler = undefined
    this.el.remove()
    this.imgpar = 0
    this.nFingImg = []
    db.pmc = undefined
    if (!next) return this.onComplete()
    if (typeof next === "boolean") return this.onComplete(next ? "CONTINUE" : "BREAK")
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this

    audio.emit({ action: "play", type: "sfx", src: "hack_intro", options: { id: Date.now().toString() } })
    audio.emit({ action: "play", type: "bgm", src: "hacking_amb", options: { fadeIn: 1000 } })

    this.shuffleImg()
    this.createElement()
    eroot().append(this.el)
    this.placeConnections()
    this.navKeyListener()
    this.abortListener()
  }
}
