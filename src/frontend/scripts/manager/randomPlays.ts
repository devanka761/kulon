import audio from "../lib/AudioHandler"

export function playRandomFootstep(type: "a" | "b" = "a", isPlayer: boolean = false) {
  const steps = type === "a" ? ["1", "2"] : ["1", "2", "3"]
  const step = steps[Math.floor(Math.random() * steps.length)]

  audio.emit({ action: "play", type: isPlayer ? "footstep" : "peerfootstep", src: `step_${type}_${step}`, options: { id: Date.now().toString() } })
}

export function playRandomPop() {
  const pops = ["1", "2", "3"]

  const pop = pops[Math.floor(Math.random() * pops.length)]
  audio.emit({ action: "play", type: "ui", src: `pop_${pop}`, options: { id: Date.now().toString() } })
}
