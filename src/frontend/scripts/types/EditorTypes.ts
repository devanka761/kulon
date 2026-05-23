import { IAny } from "./LibTypes"
import { IMapList } from "./MapsTypes"

export type IActionMode = "Wall" | "Space" | "Object" | "Teleporter" | "Bulk" | null

export interface IMapSave {
  [key: string]: number
}
export interface IEditorConfig {
  project_name: string
  mapdata: IMapList
  finishedEvents: IAny
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
