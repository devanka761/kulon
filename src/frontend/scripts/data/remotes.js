const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class Remotes {
  constructor() {
    this.game = null
  }
  run(controlId, options) {
    if (INVALID_CONTROLS.find((control) => control === controlId)) return
    if (!this[controlId]) return
    console.log(controlId, options)
  }
  init(game) {
    this.game = game
  }
}

const remotes = new Remotes()
export default remotes
