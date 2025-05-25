class PlayerState {
  constructor() {
    this.pmc = null;
    this.journey = null;
    this.storyFlags = {};
    this.localFlags = {};
    this.setting = {};
  }
}
const playerState = new PlayerState();
export default playerState;