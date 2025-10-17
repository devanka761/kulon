import { Interactable } from "./Interactable"

export class Prop extends Interactable {
  constructor(config) {
    super(config)
    this.collisionBox = undefined
  }
}
