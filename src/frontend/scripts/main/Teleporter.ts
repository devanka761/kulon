import { IGameObjectTeleporter, IGameObjectTeleporterType } from "../types/maps.types"
import { Person } from "./Person"

const TILE_SIZE = 16

export class Teleporter extends Person {
  from: IGameObjectTeleporterType
  constructor(config: IGameObjectTeleporter) {
    super({
      ...config,
      src: "null"
    })
    this.from = config.from

    this.talk = [
      {
        events: [{ type: "teleportFromDirection", who: "hero", teleporter: this }]
      }
    ]

    this.collisionBox = {
      xOffset: 0,
      yOffset: 0,
      width: TILE_SIZE,
      height: TILE_SIZE
    }
  }

  update() {}
  draw() {}
}
