import BagAPI from "../APIs/BagAPI"
import InvitesAPI from "../APIs/InvitesAPI"
import JobAPI from "../APIs/JobAPI"
import MailsAPI from "../APIs/MailsAPI"
import RoomAPI from "../APIs/RoomAPI"
import TrophiesAPI from "../APIs/TrophiesAPI"
import WaitingAPI from "../APIs/WaitingAPI"
import { Game } from "../main/Game"
import { ISival } from "./lib.types"

export interface ICustomColor {
  1: string
  2: string
}

export interface IPhoneApp {
  id: string
  g: number[]
  n: string
  ic: string
  a?: number[]
  cl?: ICustomColor
  hasUnread?(): boolean
  r(config: ISival): void
}

export interface IPMCConfig {
  game?: Game
  onComplete: (...args: ISival) => ISival
  classBefore?: IPMC
  [key: string]: unknown
}

export interface IPMC {
  readonly id: string
  isLocked: boolean
  classBefore?: IPMC
  onComplete?: (...args: ISival) => ISival
  destroy?(cb?: IPMC | IPhoneApp | boolean | null): void | Promise<ISival>
  run?(...args: ISival): ISival
  init(...args: ISival): ISival | Promise<ISival>
  r?(...args: ISival): ISival
}

export interface IPMX {
  readonly id: string
  addClaim(state: string, status: boolean | string): void
  destroy(): void | Promise<void>
  init(...args: ISival): void
}

export interface IProvider {
  name?: string
  email?: string | null
}

export interface ISkin {
  Bodies: string
  Eyes: string
  Outfits: string
  Backpacks: string
  Beards: string
  Glasses: string
  Hairstyles: string
  Hats: string
}

export interface IUser {
  id: string
  username: string
  joined: number
  trophies: string[]
  skin: Partial<ISkin>
  access: number[]
}

export interface IDB {
  provider: IProvider
  me: IUser
  bag: BagAPI
  room: RoomAPI
  mails: MailsAPI
  trophies: TrophiesAPI
  job: JobAPI
  invites: InvitesAPI
  pmc?: IPMC
  pmx?: IPMX
  version: number
  onduty: number
  waiting: WaitingAPI
}

export interface IPlayers {
  id: string
  ts: number
  ready: boolean
  done: boolean
}
