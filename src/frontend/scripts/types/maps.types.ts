import db from "../data/db"
import { Interactable } from "../main/Interactable"
import { Person } from "../main/Person"
import { Player } from "../main/Player"
import { Prop } from "../main/Prop"
import { Teleporter } from "../main/Teleporter"
import { ILocale } from "./lib.types"

export type GameObjectType = "Person" | "Interactable" | "Teleporter" | "Player" | "Prop"
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
  direction?: DirectionType
  time?: number
  door?: boolean
  idx?: number
  text?: ILocale
  pages?: ILocale[]
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
  instant?: boolean
  winners?: string[]
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
  collision?: number[]
  states?: string[]
  floor?: boolean
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

export interface IGameObjectData {
  id?: string
  finished?: IObjectEvent[]
  type: GameObjectType
  x: number
  y: number
  src?: GameObjectSrc
  shadow?: boolean
  talk?: IObjectTalk[]
  offset?: number[]
  collision?: number[]
  states?: string[]
  floor?: boolean
  from?: IGameObjectTeleporterType
  direction?: DirectionType
  isRemote?: boolean
  canControlled?: boolean
}

export type GameObjectData = IGameObjectData | IGameObjectPerson | IGameObjectInteractable | IGameObjectTeleporter

export interface IGameObjects {
  [key: string]: IGameObjectData
}
export interface IWalls {
  [key: string]: boolean
}
export interface ICutscenes {
  [key: string]: IObjectTalk[]
}

export interface IEditorCutscenes {
  [key: string]: IObjectTalk[] | string
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

export type MapGameObject = Interactable | Player | Person | Teleporter | Prop

export interface MapGameObjects {
  [key: string]: MapGameObject
}

export type MapWall = {
  x: number
  y: number
}

export interface MapWalls {
  [key: string]: MapWall
}

export interface ISpawnRule {
  area: string
  x: number
  y: number
  direction: DirectionType
  inc: "x" | "y"
  size?: number
}
