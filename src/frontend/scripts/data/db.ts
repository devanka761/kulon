import BagAPI from "../APIs/BagAPI"
import InvitesAPI from "../APIs/InvitesAPI"
import JobAPI from "../APIs/JobAPI"
import MailsAPI from "../APIs/MailsAPI"
import RoomAPI from "../APIs/RoomAPI"
import TrophiesAPI from "../APIs/TrophiesAPI"
import WaitingAPI from "../APIs/WaitingAPI"
import { IDB } from "../types/db.types"

const db: IDB = {
  provider: {},
  me: {},
  bag: new BagAPI(),
  room: new RoomAPI(),
  mails: new MailsAPI(),
  trophies: new TrophiesAPI(),
  job: new JobAPI(),
  invites: new InvitesAPI(),
  pmc: undefined,
  version: 0,
  onduty: 0,
  waiting: new WaitingAPI()
}
export default db
