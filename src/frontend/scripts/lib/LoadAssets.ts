import asset from "../data/assets"
import { IAssets, IAssetSkins } from "../types/LibTypes"
import { eroot } from "./kel"

type IAnyFunc = (val?: unknown) => void

const assetsMissing: string[] = []

export default class LoadAssets {
  private skins: IAssetSkins[]
  private assets: IAssets[]

  private assetsToLoad: number = 0
  private assetsLoaded: number = 0

  private onComplete!: IAnyFunc

  constructor({ skins }: { skins: IAssetSkins[] }) {
    this.skins = skins
    this.assets = []
  }
  async loadPrepare() {
    this.assets = this.readSkins()
    this.load()
  }
  load(): void {
    if (!this.assets || this.assets.length === 0) {
      return this.showDone()
    }
    if (this.assets) {
      this.assetsToLoad = this.assets.length

      for (let i = 0; i < this.assets.length; i++) {
        this.beginLoadingImage(this.assets[i].id, this.assets[i].content)
      }
    }
  }
  readSkins(): IAssets[] {
    const allSkin = []

    for (const skin of this.skins) {
      allSkin.push({ id: skin.id, content: skin.path })
    }
    return allSkin
  }
  unhandledAssets(fileID: string, fileName: string): void {
    this.assetsToLoad++
    this.assetsLoaded--

    const fileBefore = assetsMissing.find((k) => k === fileID)
    if (!fileBefore) assetsMissing.push(fileID)

    this.beginLoadingImage(fileID, fileName)
  }
  launchIfReady(): void {
    this.assetsToLoad--
    this.assetsLoaded++
    if (this.assetsToLoad == 0) {
      this.showDone()
    }
  }
  beginLoadingImage(fileID: string, fileName: string): void {
    const img = new Image()
    img.classList.add("hidden-preload")
    img.onerror = () => {
      this.unhandledAssets(fileID, fileName)
      this.launchIfReady()
      img.remove()
    }
    img.onload = () => {
      const fileBefore = assetsMissing.findIndex((k) => k === fileID)
      if (fileBefore !== -1) assetsMissing.splice(fileBefore, 1)

      this.launchIfReady()
      img.remove()
    }
    img.src = fileName
    eroot().append(img)
    asset[fileID] = { src: fileName }
  }
  showDone(): void {
    this.onComplete()
  }
  run() {
    return new Promise((resolve) => {
      this.onComplete = resolve
      this.loadPrepare()
    })
  }
}
