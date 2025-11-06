import { sound } from "../data/sound"
import LocalList from "../data/LocalList"
import { eroot, kel } from "../lib/kel"
import waittime from "../lib/waittime"

interface IBackSongInfo {
  artist: string
  id: string
  title: string
}
type BackSongAudio = IBackSongInfo[]
type BackSongArr = BackSongAudio[]

const bgms: BackSongArr = [
  [
    { artist: "unknown", title: "Field Theme 1", id: "field_theme_1" },
    { artist: "unknown", title: "Night Theme 1", id: "night_theme_1" },
    { artist: "unknown", title: "Night Theme 1", id: "night_theme_1" },
    { artist: "unknown", title: "Cave Theme 2", id: "cave_theme_2" },
    { artist: "unknown", title: "Cave Theme 1", id: "cave_theme_1" },
    { artist: "unknown", title: "Field Theme 2", id: "field_theme_2" },
    { artist: "ConcernedApe", title: "Fall (The Smell of Mushroom)", id: "fall_the_smell_of_mushroom" },
    { artist: "unknown", title: "Field Theme 1", id: "field_theme_1" }
  ],
  [
    { artist: "Crow Shade", title: "The Veil of Night", id: "the_veil_of_night_theme" },
    { artist: "Crow Shade", title: "Mind's Eye", id: "minds_eye_theme" }
  ],
  [
    { artist: "ConcernedApe", title: "Distant Banjo", id: "distant_banjo" },
    { artist: "ConcernedApe", title: "Playful", id: "playful" },
    { artist: "ConcernedApe", title: "In the Deep Woods", id: "in_the_deep_woods" },
    { artist: "ConcernedApe", title: "Fall (The Smell of Mushroom)", id: "fall_the_smell_of_mushroom" },
    { artist: "ConcernedApe", title: "Pelican Town", id: "pelican_town" },
    { artist: "ConcernedApe", title: "Spring (Wild Horseradish Jam)", id: "spring_wild_horseradish_jam" }
  ]
]

async function showInfo(info: IBackSongInfo): Promise<void> {
  const el = kel("div", "BackSongInfo")

  const einfo = kel("div", "info")

  const artist = kel("p")
  artist.innerHTML = `by ${info.artist}`

  const title = kel("p", "title")
  title.innerHTML = info.title

  einfo.append(title, artist)

  const icon1 = kel("div", "icon")
  icon1.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin"></i>'
  const icon2 = kel("div", "icon")
  icon2.innerHTML = '<i class="fa-solid fa-music"></i>'

  el.append(icon1, einfo, icon2)

  eroot().append(el)
  await waittime(3000)
  el.classList.add("out")
  await waittime(1000)
  el.remove()
}

class BackSongAPI {
  private type: number = 0
  private index: number = 0
  private repeated: number = 1
  private lastIndex: number = bgms[0].length - 1
  private audio: HTMLAudioElement | null = null
  private isPaused: boolean = false
  start(timeout?: number): void {
    const oldSrc = this.audio?.src || "null"
    if (this.audio) {
      this.audio.pause()
      this.audio.remove()
      this.audio = null
    }
    const audioVolume = LocalList.bgm_volume <= 10 && LocalList.bgm_volume >= 0 ? LocalList.bgm_volume / 10 : 0.8

    const info = bgms[this.type][this.index]

    const audio = new Audio(sound[info.id].src)
    audio.preload = "auto"
    audio.load()
    audio.volume = audioVolume
    audio.onended = () => this._next()
    if (timeout) {
      setTimeout(() => {
        if (!oldSrc.includes(info.id)) showInfo(info)
        audio.play()
      }, timeout)
    } else {
      if (!oldSrc.includes(info.id)) showInfo(info)
      audio.play()
    }
    this.audio = audio
  }
  private _next(): void {
    if (this.isPaused) return
    this.repeated++
    if (this.repeated >= 2) {
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
  switch(newType: number, newIndex: number = 0): void {
    if (this.type === newType) return
    this.type = newType
    this.lastIndex = bgms[newType].length - 1
    this.index = newIndex
  }

  destroy(timeout?: number): void {
    if (!this.audio) return
    const oldAudio = this.audio
    this.isPaused = false
    this._fade(oldAudio, 0, timeout || 300, () => {
      if (!oldAudio) return
      oldAudio.pause()
      oldAudio.remove()
    })
  }
}

const backsong = new BackSongAPI()
export default backsong
