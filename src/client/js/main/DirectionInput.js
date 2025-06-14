import kchat from "../manager/KChat.js";

export default class DirectionInput {
  constructor() {
    this.heldDirections = [];

    this.map = {
      "w": "up",
      "btnup": "up",
      "arrowup": "up",
      "s": "down",
      "btndown": "down",
      "arrowdown": "down",
      "a": "left",
      "btnleft": "left",
      "arrowleft": "left",
      "d": "right",
      "btnright": "right",
      "arrowright": "right",
    }
  }

  get direction() {
    return this.heldDirections[0];
  }
  touchStart(key) {
    if(kchat.formOpened) return;
    const dir = this.map[key];
    if (dir && this.heldDirections.indexOf(dir) === -1) {
      this.heldDirections.unshift(dir);
    }
  }
  touchEnd(key) {
    const dir = this.map[key];
    const index = this.heldDirections.indexOf(dir);
    if (index > -1) {
      this.heldDirections.splice(index, 1);
    }
  }
  init() {
    document.addEventListener("keydown", e => {
      if(kchat.formOpened) return;
      const dir = this.map[e.key.toLowerCase()];
      if (dir && this.heldDirections.indexOf(dir) === -1) {
        this.heldDirections.unshift(dir);
      }
    });
    document.addEventListener("keyup", e => {
      const dir = this.map[e.key.toLowerCase()];
      const index = this.heldDirections.indexOf(dir);
      if (index > -1) {
        this.heldDirections.splice(index, 1);
      }
    })

  }

}