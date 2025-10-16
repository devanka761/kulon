import { IUser } from "../../../backend/types/user.types"
import BagAPI from "../APIs/BagAPI"
import InvitesAPI from "../APIs/InvitesAPI"
import JobAPI from "../APIs/JobAPI"
import MailsAPI from "../APIs/MailsAPI"
import RoomAPI from "../APIs/RoomAPI"
import TrophiesAPI from "../APIs/TrophiesAPI"
import WaitingAPI from "../APIs/WaitingAPI"

export interface IPMC {
  readonly id: string
  isLocked: boolean
  classBefore?: IPMC
  destroy(args?: IPMC | boolean | null): void | Promise<void>
  run?(): IPMC | void | Promise<IPMC | void>
  init(): IPMC | void | Promise<IPMC | void>
}

export interface IProvider {
  name?: string
  email?: string | null
}

export interface IDB {
  provider: IProvider
  me: Partial<IUser>
  bag: BagAPI
  room: RoomAPI
  mails: MailsAPI
  trophies: TrophiesAPI
  job: JobAPI
  invites: InvitesAPI
  pmc?: IPMC
  version: number
  onduty: number
  waiting: WaitingAPI
}
