import { IGameObjectInteractable, IObjectTalk } from "../types/maps.types"
import { Interactable } from "./Interactable"

export class Prop extends Interactable {
  talk: IObjectTalk[]
  constructor(config: IGameObjectInteractable) {
    super(config)
    this.talk = config.talk as IObjectTalk[]
    // this.collisionBox = undefined
  }
}
