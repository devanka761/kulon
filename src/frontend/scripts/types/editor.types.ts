import { ISival } from "./lib.types"
import { IMapList } from "./maps.types"

export type IActionMode = "Wall" | "Space" | "Object" | "Teleporter" | "Bulk" | null

export interface IMapSave {
  [key: string]: number
}
export interface IEditorConfig {
  project_name: string
  mapdata: IMapList
  finishedEvents: ISival
}
export interface IBulk {
  [key: string]: boolean
}

export interface INewAreaConfig {
  "area-name": string
  "lower-src": string
  "upper-src": string
  "area-sound"?: string
}
