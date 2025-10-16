import asset from "../data/assets"
import { eroot } from "./kel"

export default class LoadAssets {
  constructor({ skins }) {
    this.skins = skins
    this.assets = []
    this.assetsToLoad = 0
    this.assetsLoaded = 0
    this.allAssets = 0
    this.onComplete = null
  }
  async loadPrepare() {
    this.assets = this.readSkins()
    this.load()
  }
  load() {
    if (!this.assets || this.assets.length === 0) {
      return this.showDone()
    }
    if (this.assets) {
      this.assetsToLoad = this.assets.length
      this.allAssets = this.assets.length

      for (let i = 0; i < this.assets.length; i++) {
        this.beginLoadingImage(this.assets[i].id, this.assets[i].content)
      }
    }
  }
  readSkins() {
    const allSkin = []

    for (const skin of this.skins) {
      allSkin.push({ id: skin.id, content: skin.path })
    }
    return allSkin
  }
  launchIfReady() {
    this.assetsToLoad--
    this.assetsLoaded++
    if (this.assetsToLoad == 0) {
      this.showDone()
    }
  }
  beginLoadingImage(fileID, fileName) {
    const img = new Image()
    img.classList.add("hidden-preload")
    img.onerror = () => {
      this.launchIfReady()
      img.remove()
    }
    img.onload = () => {
      this.launchIfReady()
      img.remove()
    }
    img.src = fileName
    eroot().append(img)
    asset[fileID] = { src: fileName }
  }
  showDone() {
    this.onComplete()
  }
  run() {
    return new Promise((resolve) => {
      this.onComplete = resolve
      this.loadPrepare()
    })
  }
}
