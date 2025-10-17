import asset from "../data/assets"
import lang from "../data/language"
import { eroot, kel, qutor } from "../lib/kel"
import LoadAssets from "../lib/LoadAssets"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { setOfflineAssets, setOfflineMaps } from "../manager/initialWorld"
import startGame from "../manager/startGame"
import CharCreation from "./CharCreation"
import assetSize from "../../../../public/json/skins/size.json"
import audio from "../lib/AudioHandler"
import { sound, audioContext } from "../data/sound"
import { KeyPressListener } from "../main/KeyPressListener"

async function forceFullScreen() {
  const width = window.innerWidth
  const height = window.innerHeight

  const urlParams = new URLSearchParams(window.location.search)
  const pwa = urlParams.get("pwa")

  if ((width < 720 || height < 480) && !pwa) {
    const docEl = document.documentElement

    if (docEl.requestFullscreen) {
      await docEl.requestFullscreen({ navigationUI: "hide" })
    } else if ("webkitRequestFullscreen" in docEl && typeof docEl["webkitRequestFullscreen"] === "function") {
      await docEl["webkitRequestFullscreen"]()
    } else if ("msRequestFullscreen" in docEl && typeof docEl["msRequestFullscreen"] === "function") {
      await docEl["msRequestFullscreen"]()
    }

    if (screen.orientation && "lock" in screen.orientation && typeof screen.orientation["lock"] === "function") {
      try {
        await screen.orientation["lock"]("landscape")
      } catch (_err) {
        // --
      }
    }
  }
}

export default class Preload {
  constructor({ skins, sounds, doodle }) {
    this.skins = skins
    this.sounds = sounds
    this.doodle = doodle
    this.assets = []
    this.assetsToLoad = 0
    this.assetsLoaded = 0
    this.allAssets = 0
  }
  createElement() {
    this.el = kel("div", "Preload")
    this.el.innerHTML = `
    <div class="box">
      <div class="title">
        <img src="./images/Kulon.png" alt="kulon" width="200"/>
      </div>
      <div class="assetload-data">
        <div class="load-data-title">${lang.PRELOAD_NOTICE}</div>
        <div class="load-data-list"></div>
      </div>
    </div>
    <div class="assetload-action">
      <div class="btn-start center fa-fade">-- <span class="keyinfo">Enter</span> ${lang.TS_START} --</div>
    </div>`
  }
  writeLoadData() {
    const loadList = qutor(".load-data-list", this.el)
    const convertOp = 1024 * 1024
    Object.keys(assetSize).forEach((k) => {
      const convertedSize = (assetSize[k] / convertOp).toFixed(1)
      const card = kel("div", "load-data-card")
      card.innerHTML = `${k}: <b>${convertedSize} MB</b>`
      loadList.append(card)
    })
  }
  btnListener() {
    const btnLoad = qutor(".assetload-action", this.el)
    btnLoad.onclick = async () => {
      this.enter.unbind()
      await forceFullScreen()
      btnLoad.remove()
      await waittime(500)
      const eloadel = kel("div", "assets-load")
      eloadel.innerHTML = `
      <div class="info">
        <span>${lang.LOADING}</span>
        <span class="status">Ehek - 0%</span>
      </div>
      <div class="loader">
        <div class="inner-loader"></div>
      </div>`
      this.el.append(eloadel)
      await waittime(1000)
      this.loadPrepare()
    }
    this.enter = new KeyPressListener("enter", () => btnLoad.click())
  }
  async loadPrepare() {
    this.assets = this.readSkins()

    const assetProgress = {
      text: qutor(".assets-load .info .status", this.el),
      bar: qutor(".assets-load .loader .inner-loader", this.el)
    }

    this.load(assetProgress, this.el)
  }
  loadDev(_, loadscreen) {
    return this.showDone(loadscreen)
  }
  load(assetProgress, loadscreen) {
    if (!this.assets || this.assets.length == 0) {
      return this.showDone(loadscreen)
    }
    if (this.assets) {
      this.assetsToLoad = this.assets.length
      this.allAssets = this.assets.length

      for (let i = 0; i < this.assets.length; i++) {
        if (this.assets[i].type === "image") {
          this.beginLoadingImage(this.assets[i].id, this.assets[i].content, assetProgress, loadscreen)
        } else if (this.assets[i].type === "audio") {
          this.beginLoadingAudio(this.assets[i].id, this.assets[i].content, assetProgress, loadscreen)
        }
      }
    }
  }
  readSkins() {
    const allSkin = []

    for (const skin of this.skins) {
      allSkin.push({ id: skin.id, content: skin.path, type: "image" })
    }
    for (const sound of this.sounds) {
      allSkin.push({ id: sound.id, content: sound.path, type: "audio" })
    }
    return allSkin
  }
  launchIfReady(assetProgress, loadscreen, fileID) {
    if (fileID === "null") fileID = "Koruptor"
    this.assetsToLoad--
    this.assetsLoaded++

    const currProgress = `${Math.floor((this.assetsLoaded / this.allAssets) * 100)}%`

    assetProgress.text.innerHTML = `${fileID} - ${currProgress}`
    assetProgress.bar.style.width = currProgress

    if (this.assetsToLoad == 0) {
      assetProgress.text.innerHTML = "Koruptor_Suit - 100%"
      this.showDone(loadscreen)
    }
  }
  beginLoadingImage(fileID, fileName, assetProgress, loadscreen) {
    const img = new Image()
    img.classList.add("hidden-preload")
    img.onerror = () => {
      this.launchIfReady(assetProgress, loadscreen, fileID)
      img.remove()
    }
    img.onload = () => {
      this.launchIfReady(assetProgress, loadscreen, fileID)
      img.remove()
    }
    img.src = fileName
    this.el.append(img)

    // this.launchIfReady(assetProgress, loadscreen, fileID)
    asset[fileID] = { src: fileName }
  }
  async beginLoadingAudio(fileID, fileName, assetProgress, loadscreen) {
    try {
      const audioBuffer = await fetch(fileName)
        .then((res) => res.arrayBuffer())
        .then((data) => audioContext.decodeAudioData(data))

      sound[fileID] = { buffer: audioBuffer, src: fileName }
    } catch (error) {
      console.error(`Gagal memuat audio: ${fileName}`, error)
      // asset[fileID] = { src: fileName }
    } finally {
      this.launchIfReady(assetProgress, loadscreen, fileID)
    }
  }
  async getUser() {
    const user = await xhr.get("/x/account/me")
    if (user.code === 429 || user.msg === "TO_MANY_REQUEST") {
      await waittime(1000)
      return await this.getUser()
    }
    return user
  }
  async showDone() {
    await waittime(1000)
    const eloader = qutor(".assets-load", this.el)
    if (eloader) eloader.remove()
    const initialSkins = await modal.smloading(xhr.get("/json/assets/st_ehek.json"), "Getting User Ready")
    setOfflineAssets(initialSkins)
    await modal.smloading(new LoadAssets({ skins: initialSkins }).run(), "Loading Character Data")
    const nextMap = await xhr.get(`/json/maps/mp_ehek.json`)
    setOfflineMaps(nextMap)

    const user = await modal.smloading(this.getUser(), "Getting User Data")
    const hasSkin = Object.keys(user?.data?.me?.skin || {}).length
    if (!hasSkin) {
      await this.destroy()
      return new CharCreation({
        pmcTitle: "CHAR_CREATION_TITLE",
        pmcContinue: "CHAR_CREATION_CONTINUE"
      }).start(this.doodle, nextMap)
    }

    audio.emit({ action: "play", type: "ui", src: "dialogue_end", options: { id: "dialogue_end" } })
    await this.destroy()
    if (this.doodle) this.doodle.end()
    startGame(user.data, nextMap, true)
  }
  async destroy() {
    this.el.classList.add("out")
    await waittime(1000, 5)
    this.el.remove()
  }
  init() {
    this.createElement()
    eroot().append(this.el)
    this.writeLoadData()
    this.btnListener()
  }
}
