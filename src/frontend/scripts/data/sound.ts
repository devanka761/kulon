interface ISound {
  [key: string]: {
    src: string
    buffer: AudioBuffer
  }
}

export const sound: ISound = {}

export const audioContext = new AudioContext()
