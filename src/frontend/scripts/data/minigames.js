import FingerprintCracker from "../MiniGames/FingerprintCracker"
import FingerprintCloner from "../MiniGames/FingerprintCloner"

const minigamelist = {
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
