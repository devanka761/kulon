import asset from "../data/assets"
import db from "../data/db"
import audio from "../lib/AudioHandler"
import { eroot, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"

const fingImg = ["fingcra_a.svg", "fingcra_b.svg", "fingcra_c.svg", "fingcra_d.svg"]

export default class FingerprintCracker {
  constructor(config) {
    this.id = "minigame"
    this.onComplete = config.onComplete
    this.imgpar = 0
    this.imgwr = 0
    this.scale = 2
    this.puzzle = { crack: [], attempt: [] }
    this.navKeyHandler = null
    this.nFingImg = []
  }
  createElement() {
    this.el = kel("div", "FingCra")
    this.el.innerHTML = `
    <div class="conn">
      <div class="left">
        <div class="desc">target</div>
        <div class="content" data-target="fingcra"></div>
        <div class="desc">connection</div>
        <div class="step v1">
          <div class="sq"></div>
          <div class="sq"></div>
        </div>
      </div>
      <div class="center">
        <div class="desc">attempts</div>
        <div class="step v2">
          <div class="sq"></div>
          <div class="sq"></div>
        </div>
        <div class="content">
          <div class="content-outer" data-connections="fingcra"></div>
        </div>
      </div>
      <div class="right">
        <div class="btn btn-help" role="button" data-help="fingcra"><span class="keyinfo">I</span> help</div>
        <div class="btn btn-check" role="button" data-check="fingcra"><span class="keyinfo">Tab</span> check</div>
        <div class="btn btn-abort" role="button" data-abort="fingcra"><span class="keyinfo">Esc</span> abort</div>
      </div>
    </div>`
  }
  shuffleImg() {
    for (let i = 0; i < 4; i++) {
      const uFing = fingImg.filter((_n) => !this.nFingImg.includes(_n))
      this.nFingImg.push(uFing[Math.floor(Math.random() * uFing.length)])
    }
  }
  async stageDetail() {
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
  setCanvas(imgsrc) {
    return new Promise((resolve) => {
      const elCloneTarget = qutor("[data-target]", this.el)
      const img = new Image()
      img.style.maxWidth = "100%"
      img.style.maxHeight = "100%"
      img.onload = async () => {
        const offcanvas = kel("canvas")
        offcanvas.width = img.width
        offcanvas.height = img.height
        const ctx = offcanvas.getContext("2d")
        ctx.drawImage(img, 0, 0, img.width, img.height)
        img.remove()
        resolve(offcanvas)
      }
      img.src = imgsrc
      elCloneTarget.append(img)
    })
  }
  async placeConnections() {
    this.isLocked = true
    await this.stageDetail()
    this.btnCheck.classList.add("disabled")

    const img_1 = await this.setCanvas(asset[this.nFingImg[this.imgpar]].src)
    const img_2 = await this.setCanvas(asset[this.nFingImg[this.imgpar === 3 ? 0 : this.imgpar + 1]].src)

    const elCloneTarget = qutor("[data-target]", this.el)
    const components = []

    await new Promise((resolve) => {
      img_1.style.maxWidth = "100%"
      img_1.style.maxHeight = "100%"
      elCloneTarget.appendChild(img_1)
      let imgWidth = img_1.clientWidth
      let imgHeight = img_1.clientHeight

      const fingcoor = {
        aa: [0, 0],
        ab: [imgWidth - imgWidth / 2, 0],
        ba: [0, imgHeight / 3],
        bb: [imgWidth - imgWidth / 2, imgHeight / 3],
        ca: [0, imgHeight - imgHeight / 3],
        cb: [imgWidth - imgWidth / 2, imgHeight - imgHeight / 3]
      }

      let oL = []
      const nL = Object.keys(fingcoor)

      for (let i = 0; i < 4; i++) {
        const uL = nL.filter((_n) => !oL.includes(_n))
        const rL = uL[Math.floor(Math.random() * uL.length)]
        oL.push(rL)

        const canvas = document.createElement("canvas")
        canvas.classList.add("connection-canvas")
        const ctx = canvas.getContext("2d")

        canvas.width = imgHeight
        canvas.height = imgHeight

        ctx.drawImage(img_1, fingcoor[rL][0], fingcoor[rL][1], imgHeight, imgHeight, 0, 0, imgHeight * 3, imgHeight * 3)

        let comID = components.length + 1
        this.puzzle.crack.push(comID.toString())

        components.push({ id: comID.toString(), img: canvas })
      }
      resolve()
    })

    await new Promise((resolve) => {
      img_2.style.maxWidth = "100%"
      img_2.style.maxHeight = "100%"
      img_2.style.visibility = "hidden"
      elCloneTarget.appendChild(img_2)
      let imgWidth = img_2.clientWidth
      let imgHeight = img_2.clientHeight

      const fingcoor = {
        aa: [0, 0],
        ab: [imgWidth - imgWidth / 2, 0],
        ba: [0, imgHeight / 3],
        bb: [imgWidth - imgWidth / 2, imgHeight / 3],
        ca: [0, imgHeight - imgHeight / 3],
        cb: [imgWidth - imgWidth / 2, imgHeight - imgHeight / 3]
      }

      let oL = []
      const nL = Object.keys(fingcoor)

      for (let i = 0; i < 5; i++) {
        const uL = nL.filter((_n) => !oL.includes(_n))
        const rL = uL[Math.floor(Math.random() * uL.length)]
        oL.push(rL)

        const canvas = document.createElement("canvas")
        canvas.classList.add("connection-canvas")
        const ctx = canvas.getContext("2d")

        canvas.width = imgHeight
        canvas.height = imgHeight

        ctx.drawImage(img_2, fingcoor[rL][0], fingcoor[rL][1], imgHeight, imgHeight, 0, 0, imgHeight * 3, imgHeight * 3)

        components.push({ id: (components.length + 1).toString(), img: canvas })
      }
      img_2.remove()
      resolve()
    })

    const oldCom = []
    const newCom = components.map((_n) => _n.id)

    for (let i = 0; i < 9; i++) {
      const unlCom = newCom.filter((_n) => !oldCom.includes(_n))
      const resCom = unlCom[Math.floor(Math.random() * unlCom.length)]

      oldCom.push(resCom)
    }
    oldCom.forEach((conID, i) => {
      let parConn = components.find((_n) => _n.id == conID)
      const imgcover = document.createElement("div")
      imgcover.classList.add("imgcover")
      if (i === 0) imgcover.classList.add("selected")
      imgcover.appendChild(parConn.img)

      const elConn = qutor("[data-connections]", this.el)
      elConn.appendChild(imgcover)

      imgcover.onmouseenter = () => {
        const selected = elConn.querySelector(".imgcover.selected")
        if (selected) selected.classList.remove("selected")
        imgcover.classList.add("selected")
      }
      imgcover.onclick = () => {
        const imgcovers = elConn.querySelectorAll(".enabled")

        if (imgcover.classList.contains("enabled")) {
          audio.emit({ src: "hack_selector", action: "play", type: "ui", options: { id: Date.now().toString() } })

          imgcover.classList.remove("enabled")
          this.puzzle.attempt = this.puzzle.attempt.filter((_n) => _n !== conID)
        } else {
          if (imgcovers.length < 4) {
            audio.emit({ src: "hack_selector", action: "play", type: "ui", options: { id: Date.now().toString() } })

            imgcover.classList.add("enabled")
            this.puzzle.attempt.push(conID)
          }
        }

        const currimgcovers = elConn.querySelectorAll(".enabled")
        if (currimgcovers.length >= 4) {
          this.btnCheck.classList.remove("disabled")
        } else {
          if (!this.btnCheck.classList.contains("disabled")) this.btnCheck.classList.add("disabled")
        }
      }
    })

    const elTarget = qutor("[data-target]", this.el)
    elTarget.appendChild(img_1)
    this.isLocked = false
  }
  async tutorPopup() {
    this.isLocked = true
    await modal.alert(`<ul>
<li>Objek di kiri adalah target sidik jari</li>
<li>Objek di kanan adalah komponen sidik jari</li>
</ul>
<ol>
<li>Carilah komponen yang merupakan bagian dari target</li>
<li>Pilih 4 komponen dan tekan "CHECK"</li>
<li>Tekan "ABORT" untuk membatalkan</li>
</ol>
<ul>
<li>Batas kesempatan cracker adalah 3 kali</li>
<li>Cracker memiliki 4 koneksi yang harus diselesaikan</li>
</ul>
`)
    this.isLocked = false
  }
  checkListener() {
    let isCorrect = false

    const btnAbort = qutor("[data-abort]", this.el)
    btnAbort.onclick = () => {
      this.onLastCheck(false)
    }

    const btnHelp = qutor("[data-help]", this.el)
    btnHelp.onclick = () => this.tutorPopup()

    this.btnCheck = qutor("[data-check]", this.el)
    this.btnCheck.onclick = async () => {
      if (this.btnCheck.classList.contains("disabled")) return
      audio.emit({ src: "hack_selector", action: "play", type: "ui", options: { id: Date.now().toString() } })

      const corrects = this.puzzle.crack.filter((key) => !this.puzzle.attempt.includes(key))
      if (corrects.length > 0) {
        isCorrect = false
      } else {
        isCorrect = true
      }

      this.isLocked = true
      const fingscan = document.createElement("div")
      fingscan.classList.add("fingscan")
      this.el.appendChild(fingscan)
      fingscan.innerHTML = `
      <div class="content">
        <div class="desc cyan" style="display:none">SCANNING</div>
      </div>`
      await waittime(500)
      const scanningId = "scan_" + Date.now().toString()
      const fingscan_img = new Image()
      fingscan_img.src = asset[this.nFingImg[this.imgpar]].src
      await new Promise((resolve) => {
        fingscan_img.onload = () => {
          audio.emit({ src: "hack_scanning", action: "play", type: "sfx", options: { id: scanningId } })

          const fingscan_box = document.createElement("div")
          fingscan_box.classList.add("box")
          fingscan_box.appendChild(fingscan_img)
          qutor(".content", fingscan).prepend(fingscan_box)
          let fingscan_desc = qutor(".desc", fingscan)
          fingscan_desc.style.display = "block"
          resolve()
        }
      })
      await waittime(1000)
      audio.emit({ action: "stop", type: "sfx", id: scanningId })
      let fingscan_desc = qutor(".desc", fingscan)
      if (isCorrect) {
        audio.emit({ src: "hack_match", action: "play", type: "sfx", options: { id: Date.now().toString() } })

        fingscan.classList.add("true")
        fingscan_desc.innerHTML = "GRANTED"
        this.imgpar++
        this.nextConn()
        await waittime(1500)
        fingscan.classList.add("out")
        await waittime(400)
        fingscan.remove()
        const elTargetImg = qutor("[data-target] canvas", this.el)
        if (elTargetImg) elTargetImg.remove()
        const elConnImgs = this.el.querySelectorAll("[data-connections] .imgcover")
        elConnImgs.forEach((elConnImg) => elConnImg.remove())
        isCorrect = false
        if (this.imgpar >= 2) return this.onLastCheck(true)
        this.puzzle.crack = []
        this.puzzle.attempt = []
        this.placeConnections()
        audio.emit({ src: "hack_next", action: "play", type: "sfx", options: { id: Date.now().toString() } })
      } else {
        audio.emit({ src: "hack_error", action: "play", type: "sfx", options: { id: Date.now().toString() } })

        fingscan.classList.add("false")
        fingscan_desc.innerHTML = "DENIED"
        this.imgwr++
        this.stayConn()
        await waittime(750)
        fingscan.classList.add("out")
        await waittime(400)
        fingscan.remove()
        if (this.imgwr >= 2) return this.onLastCheck(false)
      }
      this.isLocked = false
    }
  }
  nextConn() {
    if (this.imgpar < 1) return

    const elConns = this.el.querySelectorAll(".conn .left .step.v1 .sq")[this.imgpar - 1]
    elConns.classList.add("done")
  }
  stayConn() {
    if (this.imgwr < 1) return
    const elConns = this.el.querySelectorAll(".conn .center .step.v2 .sq")[this.imgwr - 1]
    elConns.classList.add("done")
  }
  async onLastCheck(condition) {
    const elLastCheck = kel("div", `fingscan ${condition ? "true" : "false"}`)
    elLastCheck.innerHTML = `
    <div class="content" style="background-color:${condition ? "#55ac55" : "#f76767"}">
      <div class="desc"></div>
      <div class="desc" style="color:#000000">CONNECTION ${condition ? "RESOLVED" : "REJECTED"}</div>
      <div class="desc"></div>
    </div>`
    this.el.appendChild(elLastCheck)
    if (condition) {
      audio.emit({ src: "hack_success", action: "play", type: "sfx", options: { id: Date.now().toString() } })
    } else {
      audio.emit({ src: "hack_failed", action: "play", type: "sfx", options: { id: Date.now().toString() } })
    }
    await waittime(2500)
    elLastCheck.classList.add("out")

    audio.emit({ action: "stop", type: "bgm", options: { fadeOut: 1000 } })

    await waittime(400)
    elLastCheck.remove()
    this.destroy(!!condition)
  }
  navKeyListener() {
    this.navKeyHandler = (e) => {
      if (this.isLocked) return
      const key = e.key

      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape", "i", "I", "Enter", "Tab"].includes(key)) return
      e.preventDefault()

      if (key === "Escape") return qutor("[data-abort]", this.el)?.click()
      if (key.toLowerCase() === "i") return qutor("[data-help]", this.el)?.click()
      if (key === "Tab") return qutor("[data-check]", this.el)?.click()

      const allCovers = Array.from(this.el.querySelectorAll(".imgcover"))
      if (allCovers.length === 0) return

      let currentIndex = allCovers.findIndex((c) => c.classList.contains("selected"))

      if (key === "Enter") {
        const activeCover = currentIndex > -1 ? allCovers[currentIndex] : allCovers[0]
        if (activeCover) {
          if (!activeCover.classList.contains("selected")) activeCover.classList.add("selected")
          activeCover.click()
        }
        return
      }

      if (currentIndex > -1) {
        allCovers[currentIndex].classList.remove("selected")
      }

      let nextIndex
      if (currentIndex === -1) {
        nextIndex = 0
      } else if (key === "ArrowUp") {
        nextIndex = (currentIndex - 3 + 9) % 9
      } else if (key === "ArrowDown") {
        nextIndex = (currentIndex + 3) % 9
      } else if (key === "ArrowLeft") {
        nextIndex = currentIndex % 3 === 0 ? currentIndex + 2 : currentIndex - 1
      } else if (key === "ArrowRight") {
        nextIndex = currentIndex % 3 === 2 ? currentIndex - 2 : currentIndex + 1
      }

      allCovers[nextIndex]?.classList.add("selected")
      audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
    }
    document.addEventListener("keydown", this.navKeyHandler)
  }
  destroy(next) {
    this.el.remove()
    this.imgpar = 0
    this.puzzle.crack = []
    this.puzzle.attempt = []
    this.nFingImg = []
    db.pmc = null
    document.removeEventListener("keydown", this.navKeyHandler)
    this.navKeyHandler = null
    if (!next) return this.onComplete()
    if (typeof next === "boolean") return this.onComplete(next ? "CONTINUE" : "BREAK")
    if (typeof next !== "string") return next.init()
  }
  init() {
    db.pmc = this

    audio.emit({ src: "hack_intro", action: "play", type: "sfx", options: { id: Date.now().toString() } })
    audio.emit({ src: "hacking_amb", action: "play", type: "bgm", options: { fadeIn: 1000 } })

    this.shuffleImg()
    this.createElement()
    eroot().append(this.el)
    this.checkListener()
    this.placeConnections()
    this.navKeyListener()
  }
}
