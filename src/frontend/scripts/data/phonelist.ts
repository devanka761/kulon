import { Bag } from "../Contents/Bag"
import Friends from "../Contents/Friends"
import Jobs from "../Contents/Jobs"
import Mails from "../Contents/Mails"
import Setting from "../Contents/Setting"
import Shop from "../Contents/Shop"
import Team from "../Contents/Team"
import Trophies from "../Contents/Trophies"
import { Hint, hintHasUnread } from "../Events/Hint"
import itemRun from "../Props/itemRun"
import MailSender from "../Specials/MailSender"
import TeleportMachine from "../Specials/TeleportMachine"
import { IPhoneApp } from "../types/db.types"
import db from "./db"

const phonelist: IPhoneApp[] = [
  {
    id: "hint",
    g: [2],
    n: "PHONE_HINT",
    ic: "fa-duotone fa-solid fa-sneaker-running",
    hasUnread: () => hintHasUnread(),
    async r(config) {
      new Hint(config).init()
    }
  },
  {
    id: "jobs",
    g: [1],
    n: "PHONE_JOBS",
    ic: "fa-duotone fa-solid fa-briefcase",
    hasUnread: () => db.invites.getAll.length >= 1,
    r(config) {
      new Jobs(config).init()
    }
  },
  {
    id: "team",
    g: [1],
    n: "PHONE_TEAM",
    ic: "fa-duotone fa-solid fa-people-group",
    r(config) {
      new Team(config).init()
    }
  },
  {
    id: "friends",
    g: [1, 2],
    n: "PHONE_FRIENDS",
    ic: "fa-sharp-duotone fa-solid fa-address-book",
    hasUnread: () => db.room.req.length >= 1,
    r(config) {
      new Friends(config).init()
    }
  },
  {
    id: "shop",
    g: [1, 2],
    n: "PHONE_SHOP",
    ic: "fa-sharp-duotone fa-solid fa-shopping-bag",
    cl: { 1: "b-shop-1", 2: "b-shop-2" },
    r(config) {
      new Shop(config).init()
    }
  },
  {
    id: "trophies",
    g: [1, 2],
    n: "PHONE_TROPHY",
    ic: "fa-sharp-duotone fa-solid fa-trophy-star",
    cl: { 1: "b-trophies-1", 2: "b-trophies-2" },
    hasUnread: () => db.trophies.unclaimeds.length >= 1,
    r(config) {
      new Trophies(config).init()
    }
  },
  {
    id: "backpack",
    g: [1, 2],
    n: "PHONE_BACKPACK",
    ic: "fa-sharp-duotone fa-solid fa-backpack",
    r(config) {
      new Bag(config).init()
    }
  },
  {
    id: "mails",
    g: [1, 2],
    n: "PHONE_MAIL",
    ic: "fa-sharp-duotone fa-solid fa-envelope",
    hasUnread: () => db.mails.getAll.length >= 1,
    r(config) {
      new Mails(config).init()
    }
  },
  {
    id: "teleporter",
    g: [1, 2],
    a: [6],
    n: "PHONE_TELEPORT",
    ic: "fa-sharp-duotone fa-solid fa-location-dot",
    r(config) {
      new TeleportMachine(config).init()
    }
  },
  {
    id: "mailsender",
    g: [1, 2],
    a: [7],
    n: "PHONE_MAIL_SENDER",
    ic: "fa-sharp-duotone fa-solid fa-envelopes-bulk",
    r(config) {
      new MailSender(config).init()
    }
  },
  {
    id: "adminmoderation",
    g: [761],
    n: "PHONE_MODERATION",
    ic: "fa-sharp-duotone fa-solid fa-user-secret",
    r(config) {
      config.onComplete()
    }
  },
  {
    id: "setting",
    g: [1, 2],
    n: "PHONE_SETTING",
    ic: "fa-sharp-duotone fa-solid fa-gear",
    r(config) {
      new Setting(config).init()
    }
  },
  {
    id: "leave_job",
    g: [2],
    n: "PHONE_LEAVE_JOB",
    ic: "fa-sharp-duotone fa-solid fa-person-to-door",
    r(config) {
      itemRun.run("leaveJob", config).init()
    }
  }
]

export default phonelist
