import db from "../data/db"
import { Teleporter } from "../main/Teleporter"
import { ILocale } from "./lib.types"

export type GameObjectType = "Person" | "Interactable" | "Teleporter"
export type GameObjectSrc = string[] | string

export type DirectionType = "up" | "down" | "left" | "right"

export interface IGameObject {
  id?: string
  finished?: IObjectEvent[]
  type: GameObjectType
  x: number
  y: number
}

export interface IChoiceOption {
  text: ILocale
  cancel?: boolean
}

interface IPos {
  x: number
  u: number
}

export interface IObjectEvent {
  type: string
  who?: string
  x?: number
  y?: number
  map?: string
  direction?: string
  time?: number
  door?: boolean
  text?: ILocale
  options?: IChoiceOption[]
  noCancel?: boolean
  states?: string[]
  teleporter?: Teleporter
  from?: {
    up?: IPos
    down?: IPos
    left?: IPos
    right?: IPos
  }
  id?: string
  amount?: number
  first?: boolean
  crew?: boolean
  user?: typeof db.me
  action?: string
  src?: string
  which?: string
}
export interface IObjectTalk {
  local_req?: string[]
  required?: string[]
  events: IObjectEvent[]
}

export interface IGameObjectPerson extends IGameObject {
  src: GameObjectSrc
  shadow?: boolean
  talk?: IObjectTalk[]
  direction?: DirectionType
  isRemote?: boolean
  canControlled?: boolean
}
export interface IGameObjectInteractable extends IGameObject {
  src: GameObjectSrc
  shadow?: boolean
  talk?: IObjectTalk[]
  offset?: number[]
  states?: string[]
}
export interface TeleporeterFromPosition {
  x: number
  y: number
  direction?: DirectionType
}
export interface IGameObjectTeleporterType {
  up?: TeleporeterFromPosition
  down?: TeleporeterFromPosition
  left?: TeleporeterFromPosition
  right?: TeleporeterFromPosition
}

export interface IGameObjectTeleporter extends IGameObject {
  from: IGameObjectTeleporterType
}

export type GameObjectData = IGameObjectPerson | IGameObjectInteractable | IGameObjectTeleporter

export interface IGameObjects {
  [key: string]: GameObjectData
}
export interface IWalls {
  [key: string]: boolean
}
export interface ICutscenes {
  [key: string]: IObjectTalk[]
}
export interface ISafeZone {
  x: number
  y: number
}

export interface IMapConfig {
  id: string
  lowerSrc: string
  upperSrc: string
  sound?: string
  footstep?: "a" | "b"
  configObjects: IGameObjects
  walls: IWalls
  cutscenes: ICutscenes
  safeZone?: ISafeZone
}

export interface IMapList {
  [key: string]: IMapConfig
}
