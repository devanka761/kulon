import FingerprintCracker from "../MiniGames/FingerprintCracker"
import FingerprintCloner from "../MiniGames/FingerprintCloner"
import { ISival } from "../types/lib.types"

interface IMinigameList {
  id: string
  name: string
  run(config: ISival): void
}

interface IMinigameLists {
  [key: string]: IMinigameList
}

const minigamelist: IMinigameLists = {
  fingclo: {
    id: "fingclo",
    name: "Fingerprint Cloner",
    run(config) {
      new FingerprintCloner(config).init()
    }
  },
  fingcra: {
    id: "fingcra",
    name: "Fingerprint Cracker",
    run(config) {
      new FingerprintCracker(config).init()
    }
  }
}

export default minigamelist
