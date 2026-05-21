import { ILocale } from "./MailTypes"
import { IAny } from "./ValidateTypes"

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
  temp?: IAny
  ts?: number
  claimed?: boolean
}

export interface ITrophyProgress extends ITrophy {
  temp?: IAny
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
