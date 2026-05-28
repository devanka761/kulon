import BagAPI from "../APIs/BagAPI"
import InvitesAPI from "../APIs/InvitesAPI"
import JobAPI from "../APIs/JobAPI"
import LobbyAPI from "../APIs/LobbyAPI"
import MailsAPI from "../APIs/MailsAPI"
import RoomAPI from "../APIs/RoomAPI"
import TrophiesAPI from "../APIs/TrophiesAPI"
import WaitingAPI from "../APIs/WaitingAPI"
import peers from "../data/Peers"
import socket from "../lib/Socket"
import { Game } from "../main/Game"
import { IAny } from "./LibTypes"

export interface ICustomColor {
  0: string
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
  r(config: IAny): void
}

export interface IPMCConfig {
  game?: Game
  onComplete: (...args: IAny) => IAny
  classBefore?: IPMC
  [key: string]: unknown
}

export interface IPMC {
  readonly id: string
  isLocked: boolean
  classBefore?: IPMC
  onComplete?: (...args: IAny) => IAny
  destroy?(cb?: IPMC | IPhoneApp | boolean | null): void | Promise<IAny>
  run?(...args: IAny): IAny
  init(...args: IAny): IAny | Promise<IAny>
  r?(...args: IAny): IAny
}

export interface IPMXConfig {
  peers: typeof peers
  socket: typeof socket
  job: JobAPI
  me: string
}

export interface IPMX {
  readonly id: string
  addClaim(state: string, status: boolean | string): void
  onInteract?(x: number, y: number, isRemote?: boolean, data?: IAny): void
  destroy(): void | Promise<void>
  setGame?(game: Game): void
  init(...args: IAny): void
}

export interface IProvider {
  id?: string
  lunaId?: string
  method?: number
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
  lobby: LobbyAPI
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
