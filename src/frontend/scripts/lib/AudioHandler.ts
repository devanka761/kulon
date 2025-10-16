import asset from "../data/assets"
import LocalList from "../data/LocalList"

type SingleAudio = Map<string, HTMLAudioElement>

interface IOptionsConfig {
  fadeIn?: number
  fadeOut?: number
  id?: string
  volume?: number
  loop?: boolean
}

interface IEventConfig {
  action: string
  type: string
  id?: string
  src?: string
  options?: IOptionsConfig
}

export class AudioHandler {
  private bgm: HTMLAudioElement | null = null
  private ambient: HTMLAudioElement | null = null
  private ui: SingleAudio = new Map()
  private sfx: SingleAudio = new Map()
  private footstep: SingleAudio = new Map()

  emit(event: IEventConfig) {
    switch (event.action) {
      case "play":
        if (!event.src || !asset[event.src]) break
        this._handlePlay(event.type, asset[event.src].src, event.options ?? {})
        break
      case "stop":
        this._handleStop(event.type, event.id, event.options ?? {})
        break
    }
  }

  _handlePlay(type: string, src: string, options: IOptionsConfig) {
    switch (type) {
      case "bgm":
        this._playBGM(src, options)
        break
      case "ui":
        this._playUI(options.id ?? src, src, options)
        break
      case "sfx":
        this._playSFX(options.id ?? src, src, options)
        break
      case "footstep":
        this._playFootstep(options.id ?? src, src, options)
        break
      case "ambient":
        this._playAmbient(src, options)
        break
    }
  }

  _handleStop(type: string, id?: string, options: IOptionsConfig = {}) {
    switch (type) {
      case "bgm":
        this._stopBGM(options.fadeOut)
        break
      case "ui":
        if (id) {
          this._stopUI(id, options.fadeOut)
        } else {
          this._stopAllUI()
        }
        break
      case "sfx":
        if (id) {
          this._stopSFX(id, options.fadeOut)
        } else {
          this._stopAllSFX()
        }
        break
      case "footstep":
        if (id) {
          this._stopFootstep(id, options.fadeOut)
        } else {
          this._stopAllFootstep()
        }
        break
      case "ambient":
        this._stopAmbient(options.fadeOut)
        break
    }
  }

  _playBGM(src: string, options: IOptionsConfig = {}) {
    this._stopBGM(options.fadeOut)
    const kaudioVolume = options.volume ?? (LocalList.bgm_volume <= 10 && LocalList.bgm_volume >= 0 ? LocalList.bgm_volume / 10 : 0.8)
    const kaudio = new Audio(src)
    kaudio.loop = true
    kaudio.volume = kaudioVolume
    this.bgm = kaudio
    if (options.fadeIn) {
      kaudio.volume = 0
      kaudio.play()
      this._fade(kaudio, kaudioVolume, options.fadeIn)
    } else {
      kaudio.play()
    }
  }

  _stopBGM(fadeOut?: number) {
    if (!this.bgm) return
    const oldBgm = this.bgm
    this.bgm = null
    if (fadeOut) {
      this._fade(oldBgm, 0, fadeOut, () => {
        oldBgm?.pause()
      })
    } else {
      oldBgm.pause()
    }
  }
  _playAmbient(src: string, options: IOptionsConfig = {}) {
    this._stopAmbient(options.fadeOut)
    const kaudioVolume = options.volume ?? (LocalList.ambient_volume <= 10 && LocalList.ambient_volume >= 0 ? LocalList.ambient_volume / 10 : 0.4)
    const kaudio = new Audio(src)
    kaudio.loop = true
    kaudio.volume = kaudioVolume
    this.ambient = kaudio

    const startPlayback = () => {
      if (options.fadeIn) {
        kaudio.volume = 0
        this._fade(kaudio, kaudioVolume, options.fadeIn)
      }
      kaudio.play()
    }

    kaudio.onloadedmetadata = () => {
      kaudio.currentTime = Math.random() * (kaudio.duration * 0.85)
    }

    startPlayback()
  }

  _stopAmbient(fadeOut?: number) {
    if (!this.ambient) return
    const oldAmbient = this.ambient
    this.ambient = null
    if (fadeOut) {
      this._fade(oldAmbient, 0, fadeOut, () => {
        oldAmbient?.pause()
      })
    } else {
      oldAmbient.pause()
    }
  }

  _playUI(id: string, src: string, options: IOptionsConfig = {}) {
    this._stopUI(id)
    const kaudioVolume = options.volume ?? (LocalList.ui_volume <= 10 && LocalList.ui_volume >= 0 ? LocalList.ui_volume / 10 : 0.7)
    const kaudio = new Audio(src)
    kaudio.volume = kaudioVolume
    kaudio.loop = options.loop ?? false
    this.ui.set(id, kaudio)
    kaudio.onended = () => {
      if (!kaudio.loop) this.ui.delete(id)
    }
    if (options.fadeIn) {
      kaudio.volume = 0
      kaudio.play()
      this._fade(kaudio, kaudioVolume, options.fadeIn)
    } else {
      kaudio.play()
    }
  }

  _stopUI(id: string, fadeOut?: number) {
    const kaudio = this.ui.get(id)
    if (!kaudio) return
    if (fadeOut) {
      this._fade(kaudio, 0, fadeOut, () => {
        kaudio.pause()
        this.ui.delete(id)
      })
    } else {
      kaudio.volume = 0
      setTimeout(() => kaudio.pause(), 300)
      this.ui.delete(id)
    }
  }

  _stopAllUI() {
    this.ui.forEach((a) => a.pause())
    this.ui.clear()
  }

  _playSFX(id: string, src?: string, options: IOptionsConfig = {}) {
    this._stopSFX(id)
    const kaudioVolume = options.volume ?? (LocalList.sfx_volume <= 10 && LocalList.sfx_volume >= 0 ? LocalList.sfx_volume / 10 : 0.7)
    const kaudio = new Audio(src)
    kaudio.volume = kaudioVolume
    kaudio.loop = options.loop ?? false
    this.sfx.set(id, kaudio)
    kaudio.onended = () => {
      if (!kaudio.loop) this.sfx.delete(id)
    }
    if (options.fadeIn) {
      kaudio.volume = 0
      kaudio.play()
      this._fade(kaudio, kaudioVolume, options.fadeIn)
    } else {
      kaudio.play()
    }
  }

  _stopSFX(id: string, fadeOut?: number) {
    const kaudio = this.sfx.get(id)
    if (!kaudio) return
    if (fadeOut) {
      this._fade(kaudio, 0, fadeOut, () => {
        kaudio.pause()
        this.sfx.delete(id)
      })
    } else {
      kaudio.volume = 0
      setTimeout(() => kaudio.pause(), 300)
      this.sfx.delete(id)
    }
  }

  _stopAllSFX() {
    this.sfx.forEach((a) => a.pause())
    this.sfx.clear()
  }

  _playFootstep(id: string, src: string, options: IOptionsConfig = {}) {
    this._stopFootstep(id)
    const kaudioVolume = options.volume ?? (LocalList.footstep_volume <= 10 && LocalList.footstep_volume >= 0 ? LocalList.footstep_volume / 10 : 0.7)
    const kaudio = new Audio(src)
    kaudio.volume = kaudioVolume
    kaudio.loop = options.loop ?? false
    this.footstep.set(id, kaudio)
    kaudio.onended = () => {
      if (!kaudio.loop) this.footstep.delete(id)
    }
    if (options.fadeIn) {
      kaudio.volume = 0
      kaudio.play()
      this._fade(kaudio, kaudioVolume, options.fadeIn)
    } else {
      kaudio.play()
    }
  }

  _stopFootstep(id: string, fadeOut?: number) {
    const kaudio = this.footstep.get(id)
    if (!kaudio) return
    if (fadeOut) {
      this._fade(kaudio, 0, fadeOut, () => {
        kaudio.pause()
        this.footstep.delete(id)
      })
    } else {
      kaudio.volume = 0
      setTimeout(() => kaudio.pause(), 300)
      this.footstep.delete(id)
    }
  }

  _stopAllFootstep() {
    this.footstep.forEach((a) => a.pause())
    this.footstep.clear()
  }

  _fade(kaudio: HTMLAudioElement, targetVolume: number, duration: number, onComplete?: () => void) {
    const startVolume = kaudio.volume
    const diff = targetVolume - startVolume
    const steps = 30
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      kaudio.volume = startVolume + (diff * currentStep) / steps
      if (currentStep >= steps) {
        clearInterval(interval)
        if (targetVolume === 0) kaudio.volume = 0
        if (onComplete) onComplete()
      }
    }, duration / steps)
  }
  commitChange(targetType: string, newValue: number) {
    if (newValue < 0 || newValue > 10) return
    const newVolume = newValue / 10
    if (targetType === "bgm_volume" && this.bgm) this.bgm.volume = newVolume
    if (targetType === "ambient_volume" && this.ambient) this.ambient.volume = newVolume
    if (targetType === "ui_volume") this.ui.forEach((kaudio) => (kaudio.volume = newVolume))
    if (targetType === "sfx_volume") this.sfx.forEach((kaudio) => (kaudio.volume = newVolume))
    if (targetType === "footstep_volume") this.footstep.forEach((kaudio) => (kaudio.volume = newVolume))
  }
  stopAll() {
    this._stopAllUI()
    this._stopAllSFX()
    this._stopAllFootstep()
    this._stopBGM(1000)
    this._stopAmbient(1000)
  }
}

const audio = new AudioHandler()
export default audio
