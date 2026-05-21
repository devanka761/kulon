import FingerprintCracker from "../MiniGames/FingerprintCracker"
import FingerprintCloner from "../MiniGames/FingerprintCloner"
import { IAny } from "../types/LibTypes"

interface IMinigameList {
  id: string
  name: string
  run(config: IAny): void
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
