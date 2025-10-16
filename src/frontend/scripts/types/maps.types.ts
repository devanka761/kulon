import { ISival } from "../../../backend/types/validate.types"

export type GameObjectType = "Person" | "Interactable" | "Teleporter"
export type GameObjectSrc = string[] | string

export type DirectionType = "up" | "down" | "left" | "right"

export interface IGameObject {
  id?: string
  finished?: ISival
  type: GameObjectType
  x: number
  y: number
}
export interface IGameObjectPerson extends IGameObject {
  src: GameObjectSrc
  shadow?: boolean
  talk?: ISival
  direction?: DirectionType
  isRemote?: boolean
  canControlled?: boolean
}
export interface IGameObjectInteractable extends IGameObject {
  src: GameObjectSrc
  shadow?: boolean
  talk?: ISival
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
  [key: string]: ISival
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
