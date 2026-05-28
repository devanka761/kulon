import audio from "../lib/AudioHandler"

export function playRandomFootstep(type: "a" | "b" = "a", isPlayer: boolean = false): void {
  const steps = type === "a" ? ["1", "2", "3"] : ["1", "2", "3", "4"]
  const step = steps[Math.floor(Math.random() * steps.length)]

  audio.emit({ action: "play", type: isPlayer ? "footstep" : "peerfootstep", src: `step_${type}${step}`, options: { id: Date.now().toString() } })
}

export function playRandomPop(): void {
  const pops = ["1", "2", "3"]

  const pop = pops[Math.floor(Math.random() * pops.length)]
  audio.emit({ action: "play", type: "ui", src: `pop0${pop}`, options: { id: Date.now().toString() } })
}

export function playRandomOf(soundType: string, soundIds: string[]): void {
  const soundId = soundIds[Math.floor(Math.random() * soundIds.length)]
  const uniqueId = Date.now().toString(36) + Math.random().toString(36).slice(2)
  audio.emit({ action: "play", type: soundType, src: soundId, options: { id: uniqueId } })
}
