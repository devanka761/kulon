import trophy_list from "../../../../public/json/main/trophies.json"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import peers from "../data/Peers"
import ForceClose from "../pages/ForceClose"
import { achievement } from "./achievement"
import notip from "./notip"
import socket from "./Socket"
import waittime from "./waittime"

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class SocketHandler {
  constructor() {
    this.game = null
  }
  newLogin() {
    socket.setExit(1)
    socket.endGameProcess()
    socket.close()
    peers.closeAll()
    new ForceClose({
      msg_1: '<i class="fa-duotone fa-light fa-user-secret"></i>',
      msg_2: lang.CLOUD_SAME_TIME
    })
  }
  addFriend(data) {
    if (!data.user) return
    if (!LocalList["friend_request_notification_disabled"]) {
      notip({
        a: data.user.username,
        b: lang.NP_RECEIVED_DESC,
        ic: "face-sunglasses"
      })
    }
    db.room.update("theirReq", data.user)
    if (db.pmc?.id === "friends") db.pmc.update()
  }
  acceptFriend(data) {
    if (!data.user) return
    if (!LocalList["friend_request_notification_disabled"]) {
      notip({
        a: data.user.username,
        b: lang.NP_ACCEPTED_DESC,
        ic: "user-check"
      })
    }
    db.room.update("isFriend", data.user)
    if (db.pmc?.id === "friends") db.pmc.update()
    if (db.pmc?.id === "matchmaking") db.pmc.updateFriends(data.user)
  }
  declineFriend(data) {
    if (!data.user) return
    db.room.remove(data.user.id)
    if (db.pmc?.id === "friends") db.pmc.update(data.user.id)
  }
  cancelFriend(data) {
    if (!data.user) return
    db.room.remove(data.user.id)
    if (db.pmc?.id === "friends") db.pmc.update(data.user.id)
  }
  removeFriend(data) {
    if (!data.user) return
    db.room.remove(data.user.id)
    if (db.pmc?.id === "friends") db.pmc.update(data.user.id)
  }
  crewOnline(data) {
    if (db.pmc?.id === "matchmaking") {
      db.pmc.members.getFriend(data.userId)?.updateStatus("ONLINE")
    }
  }
  crewOffline(data) {
    if (db.pmc?.id === "matchmaking") {
      db.pmc.members.getFriend(data.userId)?.updateStatus("OFFLINE")
    }
  }
  jobInvite(data) {
    db.invites.add({ job: data.job, user: data.user })
    if (db.pmc?.id === "jobs") {
      db.pmc.updateList()
    }
    if (!LocalList["job_invite_notification_disabled"]) {
      notip({
        a: data.user.username,
        b: lang.NP_JOBINV_DESC,
        ic: "briefcase"
      })
    }
  }
  jobJoin(data) {
    if (db.pmc?.id === "matchmaking") {
      db.job.addPlayer(data.user.id)
      db.job.addUser(data.user)
      db.pmc.updateCrew(data.user)
      const member = db.pmc.members.getFriend(data.user.id)
      if (member) member.updateStatus("JOINED")
      return
    }
    db.waiting.add({ id: "jobjoin", user: data.user })
  }
  shake(data, isNew = false) {
    if (db.pmc?.id !== "matchmaking") return
    const peerMethod = isNew ? "add" : "get"
    const user = db.pmc.members.getCrew(data.from)
    if (!user) return
    const { remote } = peers[peerMethod](user)
    remote.handleSignal(data)
  }
  offer(data) {
    this.shake(data, true)
  }
  answer(data) {
    this.shake(data)
  }
  candidate(data) {
    this.shake(data)
  }
  async jobExit(data) {
    if (db.job.status === 3) {
      const checkCutscene = async (resolve) => {
        if ([1, 3].includes(db.onduty)) {
          return resolve(false)
        } else if (this.game.isCutscenePlaying) {
          await waittime(500)
          return await checkCutscene(resolve)
        }
        return resolve(true)
      }
      const allowed = await new Promise((resolve) => checkCutscene(resolve))
      if (!allowed) return
      this.game.startCutscene([{ type: "playerLeft", user: data.user }])
      return
    }
    if (db.pmc?.id === "prologue") {
      db.pmc.aborted(data.user)
      return
    }
    db.job.removePlayer(data.user.id)
    db.job.removeUser(data.user.id)
    if (db.pmc?.id === "matchmaking") {
      db.pmc.updateCrew(data.user, true)
      return
    }
    if (db.pmc?.id === "prepare") {
      db.pmc.aborted(data.user)
      return
    }
    db.waiting.add({ id: "jobexit", user: data.user })
  }
  jobKick() {
    if (db.pmc?.id === "matchmaking") {
      db.pmc.kicked()
      return
    }
    db.waiting.add({ id: "jobkick" })
  }
  jobInviteType(data) {
    if (!data.invite) return
    db.job.invite = data.invite
    if (db.pmc?.id === "matchmaking") {
      db.pmc.updateInviteType(true)
      return
    }
  }
  jobStart() {
    db.waiting.add({ id: "jobstart" })
    if (db.pmc?.id === "matchmaking") {
      db.pmc.updateQueue()
      return
    }
  }
  jobPrepare(data) {
    if (db.pmc?.id === "matchmaking") {
      db.pmc.prepare(data.starttime)
      return
    }
    db.waiting.add({ id: "jobprepare", starttime: data.starttime })
  }
  prepareReady(data) {
    if (db.pmc?.id === "prepare") {
      db.pmc.updatePlayerStatus(data.from)
      return
    }
    db.waiting.add({ id: "prepareready", userId: data.from })
  }
  jobLaunch() {
    if (db.pmc?.id === "prepare") {
      db.pmc.launch()
      return
    }
    db.waiting.add({ id: "joblaunch" })
  }
  jobSetItem(data) {
    const { item } = data
    db.job.setItem(item)
  }
  trophyUpdate(data) {
    const trophy = data.trophy
    db.trophies.update(trophy)
    if (trophy.ts && !trophy.claimed) {
      const trophyTitle = trophy_list[trophy.id].title[LocalList.lang]

      const delayTime = db.onduty > 1 ? 20000 : 1000
      setTimeout(() => achievement({ title: trophyTitle, desc: lang.ACH_UNLOCKED }), delayTime)
    }
  }
  mail(data) {
    db.mails.add(data.mail)

    if (!LocalList["mail_notification_disabled"]) {
      notip({
        a: lang.NP_MAIL_TITLE,
        b: lang.NP_MAIL_REMAINS.replace("{amount}", db.mails.getAll.length),
        ic: "envelope"
      })
    }
    if (db.pmc?.id === "mails") {
      db.pmc.updateList()
    }
  }
  donateSettlement(data) {
    if (data.mail) this.mail(data)
    if (db.pmc?.id === "invoice") {
      db.pmc.settlement()
    }
  }
  async payout() {
    const checkCutscene = async (resolve) => {
      if ([1, 3].includes(db.onduty)) {
        return resolve(false)
      } else if (this.game.isCutscenePlaying) {
        await waittime(100)
        return await checkCutscene(resolve)
      }
      return resolve(true)
    }
    const allowed = await new Promise((resolve) => checkCutscene(resolve))
    if (!allowed) return
    this.game.startCutscene([{ type: "payout", crew: true }])
  }
  run(data) {
    if (!this.game || !data.type) return
    if (INVALID_CONTROLS.find((control) => control === data.type)) return
    if (this[data.type]) {
      this[data.type](data)
    }
  }
  init(game) {
    this.game = game
  }
}

const socketHandler = new SocketHandler()
export default socketHandler
