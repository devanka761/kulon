import { ILocale } from "./lib.types"

export interface IRewards {
  id: string
  amount: number
  expiry?: number
}

export interface IMail {
  owner: string
  id: string
  title: ILocale
  sub: ILocale
  text: ILocale
  ts: number
  rewards: IRewards[]
}
