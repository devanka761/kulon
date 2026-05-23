export interface ILocalList {
  bgm_volume: number
  ui_volume: number
  sfx_volume: number
  ambient_volume: number
  footstep_volume: number
  kulonpad_x: number
  kulonpad_y: number
  lang?: "en" | "id"
  [key: string]: string | boolean | number | null | undefined
}
