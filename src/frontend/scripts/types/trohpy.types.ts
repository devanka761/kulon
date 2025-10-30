import { ILocale } from "./lib.types"

export interface ITrophy {
  owner: string
  id: string
  taken: number
  ts?: number
  claimed?: boolean
}

export interface IAchievement {
  taken: number
  display: number
  reward: number
  group: string
  title: ILocale
  desc: ILocale
}
export interface IAchievements {
  [key: string]: IAchievement
}
