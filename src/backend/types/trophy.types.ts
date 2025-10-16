import { ILocale } from "./mail.types"
import { ISival } from "./validate.types"

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

export interface IProgress {
  taken: number
  temp?: ISival
  ts?: number
  claimed?: boolean
}

export interface ITrophyProgress extends ITrophy {
  temp?: ISival
}

export interface IKeyProgress {
  [key: string]: IProgress
}

export interface IProg {
  [key: string]: IKeyProgress
}

export interface IUnCommits {
  // users: string[]
  trophies: ITrophyProgress[]
}
