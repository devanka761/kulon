import { sound, audioContext } from "../data/sound"
import LocalList from "../data/LocalList"

interface PlayingSound {
  source: AudioBufferSourceNode
  gainNode: GainNode
  isFading?: boolean
  playTime: number
}

type SingleAudio = Map<string, PlayingSound>

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
  private bgm: PlayingSound | null = null
  private ambient: PlayingSound | null = null
  private ui: SingleAudio = new Map()
  private sfx: SingleAudio = new Map()
  private footstep: SingleAudio = new Map()

  emit(event: IEventConfig) {
    switch (event.action) {
      case "play":
        if (!event.src || !sound[event.src]?.buffer) break
        this._handlePlay(event.type, event.src, event.options ?? {})
        break
      case "stop":
        this._handleStop(event.type, event.id, event.options ?? {})
        break
    }
  }

  private _handlePlay(type: string, fileID: string, options: IOptionsConfig): void {
    switch (type) {
      case "bgm":
        this._playBGM(fileID, options)
        break
      case "ui":
        this._playUI(options.id ?? fileID, fileID, options)
        break
      case "sfx":
        this._playSFX(options.id ?? fileID, fileID, options)
        break
      case "footstep":
        this._playFootstep(options.id ?? fileID, fileID, options)
        break
      case "peerfootstep":
        this._playPeerFootstep(options.id ?? fileID, fileID, options)
        break
      case "ambient":
        this._playAmbient(fileID, options)
        break
    }
  }

  private _handleStop(type: string, id?: string, options: IOptionsConfig = {}): void {
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

  private _createAndPlaySource(fileID: string, options: IOptionsConfig, defaultVolume: number): PlayingSound | null {
    const audioData = sound[fileID]
    if (!audioData?.buffer) return null

    const source = audioContext.createBufferSource()
    source.buffer = audioData.buffer
    source.loop = options.loop ?? false

    const gainNode = audioContext.createGain()
    const volume = options.volume ?? (defaultVolume <= 10 && defaultVolume >= 0 ? defaultVolume / 10 : 0.8)
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(audioContext.destination)

    const playTime = audioContext.currentTime
    if (options.fadeIn) {
      gainNode.gain.setValueAtTime(0, playTime)
      gainNode.gain.linearRampToValueAtTime(volume, playTime + options.fadeIn / 1000)
    }

    if (options.loop && fileID.startsWith("ambient")) {
      const offset = Math.random() * (source.buffer.duration * 0.85)
      source.start(playTime, offset)
    } else {
      source.start(playTime)
    }

    const playingSound: PlayingSound = { source, gainNode, playTime }
    return playingSound
  }

  private _playBGM(fileID: string, options: IOptionsConfig = {}): void {
    this._stopBGM(options.fadeOut)
    options.loop = true
    const playingSound = this._createAndPlaySource(fileID, options, LocalList.bgm_volume)
    if (playingSound) this.bgm = playingSound
  }

  private _stopBGM(fadeOut?: number): void {
    if (!this.bgm) return
    const oldBgm = this.bgm
    this.bgm = null
    this._fadeAndStop(oldBgm, fadeOut)
  }
  private _playAmbient(fileID: string, options: IOptionsConfig = {}): void {
    this._stopAmbient(options.fadeOut)
    options.loop = true
    const playingSound = this._createAndPlaySource(fileID, options, LocalList.ambient_volume)
    if (playingSound) this.ambient = playingSound
  }

  private _stopAmbient(fadeOut?: number): void {
    if (!this.ambient) return
    const oldAmbient = this.ambient
    this.ambient = null
    this._fadeAndStop(oldAmbient, fadeOut)
  }

  private _playUI(id: string, fileID: string, options: IOptionsConfig = {}): void {
    this._stopUI(id)
    const playingSound = this._createAndPlaySource(fileID, options, LocalList.ui_volume)
    if (playingSound) {
      this.ui.set(id, playingSound)
      if (!options.loop) {
        playingSound.source.onended = () => {
          if (playingSound.isFading) return
          this.ui.delete(id)
        }
      }
    }
  }

  private _stopUI(id: string, fadeOut?: number): void {
    const playingSound = this.ui.get(id)
    if (!playingSound) return
    this.ui.delete(id)
    this._fadeAndStop(playingSound, fadeOut)
  }

  private _stopAllUI(): void {
    this.ui.forEach((sound) => sound.source.stop())
    this.ui.clear()
  }

  private _playSFX(id: string, fileID: string, options: IOptionsConfig = {}): void {
    this._stopSFX(id)
    const playingSound = this._createAndPlaySource(fileID, options, LocalList.sfx_volume)
    if (playingSound) {
      this.sfx.set(id, playingSound)
      if (!options.loop) {
        playingSound.source.onended = () => {
          if (playingSound.isFading) return
          this.sfx.delete(id)
        }
      }
    }
  }

  private _stopSFX(id: string, fadeOut?: number): void {
    const playingSound = this.sfx.get(id)
    if (!playingSound) return
    this.sfx.delete(id)
    this._fadeAndStop(playingSound, fadeOut)
  }

  private _stopAllSFX(): void {
    this.sfx.forEach((sound) => sound.source.stop())
    this.sfx.clear()
  }

  private _playFootstep(id: string, fileID: string, options: IOptionsConfig = {}): void {
    this._stopFootstep(id)
    const playingSound = this._createAndPlaySource(fileID, options, LocalList.footstep_volume)
    if (playingSound) {
      this.footstep.set(id, playingSound)
      if (!options.loop) {
        playingSound.source.onended = () => {
          if (playingSound.isFading) return
          this.footstep.delete(id)
        }
      }
    }
  }
  private _playPeerFootstep(id: string, fileID: string, options: IOptionsConfig = {}): void {
    this._stopFootstep(id)
    const playingSound = this._createAndPlaySource(fileID, options, (LocalList.footstep_volume * 35) / 100)
    if (playingSound) {
      this.footstep.set(id, playingSound)
      if (!options.loop) {
        playingSound.source.onended = () => {
          if (playingSound.isFading) return
          this.footstep.delete(id)
        }
      }
    }
  }

  private _stopFootstep(id: string, fadeOut?: number): void {
    const playingSound = this.footstep.get(id)
    if (!playingSound) return
    this.footstep.delete(id)
    this._fadeAndStop(playingSound, fadeOut)
  }

  private _stopAllFootstep(): void {
    this.footstep.forEach((sound) => sound.source.stop())
    this.footstep.clear()
  }

  private _fadeAndStop(sound: PlayingSound, duration?: number): void {
    if (!duration) {
      try {
        sound.source.stop()
      } catch (_e) {
        // -
      }
      return
    }
    sound.isFading = true
    const { gainNode, playTime } = sound
    const currentTime = audioContext.currentTime
    const elapsed = currentTime - playTime
    if (elapsed < 0) return

    gainNode.gain.cancelScheduledValues(currentTime)
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime)
    gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000)
    try {
      sound.source.stop(currentTime + duration / 1000)
    } catch (_e) {
      // -
    }
  }

  commitChange(targetType: string, newValue: number) {
    if (newValue < 0 || newValue > 10) return
    const newVolume = newValue / 10
    if (targetType === "bgm_volume" && this.bgm) this.bgm.gainNode.gain.value = newVolume
    if (targetType === "ambient_volume" && this.ambient) this.ambient.gainNode.gain.value = newVolume
    if (targetType === "ui_volume") this.ui.forEach((sound) => (sound.gainNode.gain.value = newVolume))
    if (targetType === "sfx_volume") this.sfx.forEach((sound) => (sound.gainNode.gain.value = newVolume))
    if (targetType === "footstep_volume") this.footstep.forEach((sound) => (sound.gainNode.gain.value = newVolume))
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
