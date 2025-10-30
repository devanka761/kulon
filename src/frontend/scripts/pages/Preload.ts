import asset from "../data/assets"
import lang from "../data/language"
import { eroot, futor, kel, qutor } from "../lib/kel"
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
import { IAssets, IAssetSkins, IRepB } from "../types/lib.types"
import Doodles from "../lib/Doodle"
import { IMapList } from "../types/maps.types"

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

interface IConfig {
  skins: IAssetSkins[]
  sounds: IAssetSkins[]
  doodle: Doodles
}

interface IAssetProgress {
  text: HTMLDivElement
  bar: HTMLDivElement
}

export default class Preload {
  private doodle: Doodles

  private skins: IAssetSkins[]
  private sounds: IAssetSkins[]
  private assets: IAssets[] = []
  private audios: IAssets[] = []

  private propsToLoad: number = 0
  private propsLoaded: number = 0
  private allProps: number = 0

  private el: HTMLDivElement = kel("div", "Preload")

  private enter?: KeyPressListener
  constructor({ skins, sounds, doodle }: IConfig) {
    this.skins = skins
    this.sounds = sounds
    this.doodle = doodle
  }
  createElement() {
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
    const loadList = futor(".load-data-list", this.el)
    const convertOp = 1024 * 1024
    Object.keys(assetSize).forEach((k) => {
      const convertedSize = (assetSize[k as keyof typeof assetSize] / convertOp).toFixed(1)
      const card = kel("div", "load-data-card")
      card.innerHTML = `${k}: <b>${convertedSize} MB</b>`
      loadList.append(card)
    })
  }
  btnListener() {
    const btnLoad = futor(".assetload-action", this.el)
    btnLoad.onclick = async () => {
      this.enter?.unbind()
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
      await waittime(200)
      this.loadPrepare()
    }
    this.enter = new KeyPressListener("enter", () => btnLoad.click())
  }
  async loadPrepare() {
    this.assets = this.readSkins()
    this.audios = this.readSounds()

    const assetProgress: IAssetProgress = {
      text: futor(".assets-load .info .status", this.el) as HTMLDivElement,
      bar: futor(".assets-load .loader .inner-loader", this.el) as HTMLDivElement
    }

    this.load(assetProgress)
  }
  load(assetProgress: IAssetProgress) {
    if (!this.assets || (this.assets.length == 0 && !this.audios) || this.audios.length === 0) {
      return this.showDone()
    }
    this.propsToLoad = this.assets.length + this.audios.length
    if (this.assets) {
      for (let i = 0; i < this.assets.length; i++) {
        if (this.assets[i].type === "image") {
          this.beginLoadingImage(this.assets[i].id, this.assets[i].content, assetProgress)
        }
      }
    }
    if (this.audios) {
      setTimeout(() => {
        for (let i = 0; i < this.audios.length; i++) {
          if (this.audios[i].type === "audio") {
            this.beginLoadingAudio(this.audios[i].id, this.audios[i].content, assetProgress)
          }
        }
      }, 3000)
    }

    this.allProps = (this.audios.length || 0) + (this.assets.length || 0)
  }
  readSounds(): IAssets[] {
    return this.sounds.map((sound) => ({ id: sound.id, content: sound.path, type: "audio" }))
  }
  readSkins(): IAssets[] {
    return this.skins.map((skin) => ({ id: skin.id, content: skin.path, type: "image" }))
  }
  launchIfReady(assetProgress: IAssetProgress, fileID: string) {
    if (fileID === "null") fileID = "Koruptor"
    this.propsToLoad--
    this.propsLoaded++

    const currProgress = `${Math.floor((this.propsLoaded / this.allProps) * 100)}%`

    assetProgress.text.innerHTML = `${fileID} - ${currProgress}`
    assetProgress.bar.style.width = currProgress

    if (this.propsToLoad == 0) {
      assetProgress.text.innerHTML = "Koruptor_Suit - 100%"
      this.showDone()
    }
  }
  beginLoadingImage(fileID: string, fileName: string, assetProgress: IAssetProgress) {
    const img = new Image()
    img.classList.add("hidden-preload")
    img.onerror = () => {
      this.launchIfReady(assetProgress, fileID)
      img.remove()
    }
    img.onload = () => {
      this.launchIfReady(assetProgress, fileID)
      img.remove()
    }
    img.src = fileName
    this.el.append(img)

    // this.launchIfReady(assetProgress, loadscreen, fileID)
    asset[fileID] = { src: fileName }
  }
  async beginLoadingAudio(fileID: string, fileName: string, assetProgress: IAssetProgress) {
    try {
      const response = await fetch(fileName)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()

      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      sound[fileID] = { buffer: audioBuffer, src: fileName }
    } catch (error) {
      console.error(`Error audio decoded: ${fileName}`, error)
    } finally {
      this.launchIfReady(assetProgress, fileID)
    }
  }
  async getUser(): Promise<IRepB> {
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

    const initialSkins = await modal.smloading(xhr.get("/json/assets/st_ehek.json?v=" + Date.now()), "Getting User Ready")

    setOfflineAssets(initialSkins)

    await modal.smloading(new LoadAssets({ skins: initialSkins }).run(), "Loading Character Data")

    const nextMap = await xhr.get(`/json/maps/mp_ehek.json?v=${Date.now()}`)

    setOfflineMaps(nextMap as IMapList)

    const user = await modal.smloading(this.getUser(), "Getting User Data")

    const hasSkin = Object.keys(user?.data?.me?.skin || {}).length
    if (!hasSkin) {
      await this.destroy()
      return new CharCreation({
        pmcTitle: "CHAR_CREATION_TITLE",
        pmcContinue: "CHAR_CREATION_CONTINUE",
        onComplete: () => {}
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
