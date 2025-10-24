import { IUser } from "./db.types"
import { ILocale } from "./lib.types"

export type JobStates = {
  [key: string]: boolean | string
}
export interface IJobItem {
  id: string
  amount: number
  itemId?: string
}
export type JobBag = {
  [key: string]: IJobItem
}

export interface IPlayersMatchMaking {
  id: string
  ts: number
  ready: boolean
  done: boolean
}
export interface IJob {
  id: string
  itemId: string
  code: number
  host: string
  status: number
  mission: string
  invite: number
  states: JobStates
  bag: JobBag
  players: IPlayersMatchMaking[]
}

export interface IJobInvite extends IJob {
  ts: number
}

export interface IJobToReturn extends IJob {
  users: IUser[]
}

export interface IJobInvite extends IJob {
  ts: number
}

type DIRECTION = "up" | "down" | "left" | "right"
type POSITION = "x" | "y"

export interface IMissionList {
  id: string
  map: string
  name: string
  desc: ILocale
  beta?: boolean
  memory: { ts: number; text: ILocale }[]
  mode: number
  group: number
  min: number
  max: number
  ready: number
  price: [string, number]
  spawn: { area: string; x: number; y: number; direction: DIRECTION; inc: POSITION }
  reqs?: string[]
  bag?: { id: string; amount: number }[]
  payout: {
    fail: { id: string; amount: number }[]
    success: { id: string; amount: number }[]
  }
}

export interface IInvites {
  job: IJobInvite
  user: IUser
}
