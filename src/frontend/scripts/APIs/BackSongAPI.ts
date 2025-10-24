import { sound } from "../data/sound"
import LocalList from "../data/LocalList"

type BackSongAudio = string[]
type BackSongArr = BackSongAudio[]

const bgms: BackSongArr = [
  ["field_theme_1", "night_theme_1", "cave_theme_2", "cave_theme_1", "field_theme_1"],
  ["the_veil_of_night_theme", "minds_eye_theme"]
]

class BackSongAPI {
  private type: number = 0
  private index: number = 0
  private repeated: number = 1
  private lastIndex: number = bgms[0].length - 1
  private audio: HTMLAudioElement | null = null
  private isPaused: boolean = false
  start(timeout?: number): void {
    const audioVolume = LocalList.bgm_volume <= 10 && LocalList.bgm_volume >= 0 ? LocalList.bgm_volume / 10 : 0.8

    const audio = new Audio(sound[bgms[this.type][this.index]].src)
    audio.preload = "auto"
    audio.load()
    audio.volume = audioVolume
    audio.onended = () => this._next()
    if (timeout) {
      setTimeout(() => audio.play(), timeout)
    } else {
      audio.play()
    }
    this.audio = audio
  }
  private _next(): void {
    if (this.isPaused) return
    this.repeated++
    if (this.repeated >= (this.type === 0 ? 3 : 2)) {
      this.repeated = 1
      this.index++
    }
    if (this.index > this.lastIndex) this.index = 0
    this.start()
  }
  pause(): void {
    this.isPaused = true
    if (!this.audio) return
    const audio = this.audio
    this._fade(audio, 0, 2000, () => audio.pause())
  }
  resume(): void {
    this.isPaused = false
    if (!this.audio) {
      this._next()
      return
    }
    const audioVolume = LocalList.bgm_volume <= 10 && LocalList.bgm_volume >= 0 ? LocalList.bgm_volume / 10 : 0.8
    const audio = this.audio
    audio.play()
    this._fade(audio, audioVolume, 2000)
  }
  adjust(type: string, newValue: number): void {
    if (!this.audio) return
    if (type !== "bgm_volume") return
    const audioVolume = newValue / 10
    this.audio.volume = audioVolume
  }
  private _fade(audio: HTMLAudioElement, targetVolume: number, duration: number, onComplete?: () => void): void {
    const startVolume = audio.volume
    const diff = targetVolume - startVolume
    const steps = 30
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      audio.volume = startVolume + (diff * currentStep) / steps
      if (currentStep >= steps) {
        clearInterval(interval)
        if (targetVolume === 0) audio.volume = 0
        if (onComplete) onComplete()
      }
    }, duration / steps)
  }
  switch(newType: number): void {
    this.type = newType
    this.lastIndex = bgms[newType].length - 1
    this.index = 0
  }

  destroy(timeout?: number): void {
    if (!this.audio) return
    this.type = 0
    this.index = 0
    this.repeated = 1
    this.lastIndex = 0
    this.isPaused = false
    this._fade(this.audio, 0, timeout || 300, () => {
      if (!this.audio) return
      this.audio.pause()
      this.audio.remove()
      this.audio = null
    })
  }
}

const backsong = new BackSongAPI()
export default backsong
