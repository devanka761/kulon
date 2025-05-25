import FingerCloner from "../minigames/FingerCloner.js";
import FingerCracker from "../minigames/FingerCracker.js";

const Minigames = {
  "fingclo": {
    id: "fingclo",
    name: "Fingerprint Cloner",
    run(config) {
      new FingerCloner(config).init();
    }
  },
  "fingcra": {
    id: "fingcra",
    name: "Fingerprint Cracker",
    run(config) {
      new FingerCracker(config).init();
    }
  }
};

export default Minigames;