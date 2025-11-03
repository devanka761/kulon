import trophy_list from "../../../../public/json/main/trophies.json"
import { CharacterAPI } from "../APIs/CharacterAPI"
import Friends from "../Contents/Friends"
import Invoice from "../Contents/Invoice"
import Jobs from "../Contents/Jobs"
import Mails from "../Contents/Mails"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import peers from "../data/Peers"
import MatchMaking from "../Events/MatchMaking"
import Prepare from "../Events/Prepare"
import Prologue from "../Events/Prologue"
import { Game } from "../main/Game"
import chat from "../manager/Chat"
import ForceClose from "../pages/ForceClose"
import { IUser } from "../types/db.types"
import { ISival } from "../types/lib.types"
import { IAchievements } from "../types/trohpy.types"
import { achievement } from "./achievement"
import audio from "./AudioHandler"
import notip from "./notip"
import socket from "./Socket"
import waittime from "./waittime"

type Resolve = (val?: ISival) => void

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class SocketHandler {
  private game!: Game
  newLogin(): void {
    socket.setExit(1)
    socket.endGameProcess()
    socket.close()
    peers.closeAll()
    new ForceClose({
      msg_1: '<i class="fa-duotone fa-light fa-user-secret"></i>',
      msg_2: lang.CLOUD_SAME_TIME
    })
  }
  addFriend(data: ISival): void {
    if (!data.user) return
    if (!LocalList["friend_request_notification_disabled"]) {
      notip({
        a: data.user.username,
        b: lang.NP_RECEIVED_DESC,
        ic: "face-sunglasses"
      })
    }
    db.room.update("theirReq", data.user)
    if (db.pmc?.id === "friends") {
      const pmc = db.pmc as Friends
      pmc.update()
    }
  }
  acceptFriend(data: ISival): void {
    if (!data.user) return
    if (!LocalList["friend_request_notification_disabled"]) {
      notip({
        a: data.user.username,
        b: lang.NP_ACCEPTED_DESC,
        ic: "user-check"
      })
    }
    db.room.update("isFriend", data.user)

    if (db.pmc?.id === "friends") {
      const pmc = db.pmc as Friends
      pmc.update()
    }

    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.updateFriends(data.user)
    }
  }
  declineFriend(data: ISival): void {
    if (!data.user) return
    db.room.remove(data.user.id)
    if (db.pmc?.id === "friends") {
      const pmc = db.pmc as Friends
      pmc.update()
    }
  }
  cancelFriend(data: ISival): void {
    if (!data.user) return
    db.room.remove(data.user.id)
    if (db.pmc?.id === "friends") {
      const pmc = db.pmc as Friends
      pmc.update()
    }
  }
  removeFriend(data: ISival): void {
    if (!data.user) return
    db.room.remove(data.user.id)
    if (db.pmc?.id === "friends") {
      const pmc = db.pmc as Friends
      pmc.update()
    }
  }
  crewOnline(data: ISival): void {
    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.members.getFriend(data.userId)?.updateStatus("ONLINE")
    }
  }
  crewOffline(data: ISival): void {
    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.members.getFriend(data.userId)?.updateStatus("OFFLINE")
    }
  }
  jobInvite(data: ISival): void {
    if (!LocalList["job_invite_notification_disabled"] && !db.invites.exists(data.user.id)) {
      notip({
        a: data.user.username,
        b: lang.NP_JOBINV_DESC,
        ic: "briefcase"
      })
    }

    db.invites.add({ job: data.job, user: data.user })

    if (db.pmc?.id === "jobs") {
      const pmc = db.pmc as Jobs
      pmc.updateList()
    }
  }
  jobJoin(data: ISival): void {
    if (db.pmc?.id === "matchmaking") {
      db.job.addPlayer(data.user.id)
      db.job.addUser(data.user)
      const pmc = db.pmc as MatchMaking
      pmc.updateCrew(data.user)
      const member = pmc.members.getFriend(data.user.id)
      if (member) member.updateStatus("JOINED")
      return
    }
    db.waiting.add({ id: "jobjoin", user: data.user })
  }
  lobbyJoin(data: ISival): void {
    if (!data.user) return
    const user = data.user as IUser
    db.lobby.add(user)
  }
  lobbyLeft(data: ISival): void {
    db.lobby.remove(data.from)
    this.game.map.unmountRemotePlayer(data.from)
    if (["kulonVilla", "kulonSafeHouse"].find((map) => map === this.game.map.mapId)) {
      chat.add(data.from, lang.LB_LEFT, true)
    }
  }
  shake(data: ISival, isNew: boolean = false): void {
    const peerMethod = isNew ? "add" : "get"

    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking

      const user = pmc.members.getCrew(data.from)
      if (!user) return

      const { remote } = peers[peerMethod](user.user) as CharacterAPI
      remote.handleSignal(data)
    }

    if (db.lobby.status === true) {
      const user = db.lobby.get(data.from)
      if (!user) return

      const { remote } = peers[peerMethod](user) as CharacterAPI
      remote.handleSignal(data)
    }
  }
  offer(data: ISival): void {
    this.shake(data, true)
  }
  answer(data: ISival): void {
    this.shake(data)
  }
  candidate(data: ISival): void {
    this.shake(data)
  }
  async jobExit(data: ISival): Promise<void> {
    if (db.job.status === 3) {
      const checkCutscene = async (resolve: Resolve) => {
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
      const pmc = db.pmc as Prologue
      pmc.aborted(data.user)
      return
    }

    db.job.removePlayer(data.user.id)
    db.job.removeUser(data.user.id)

    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.updateCrew(data.user, true)
      return
    }

    if (db.pmc?.id === "prepare") {
      const pmc = db.pmc as Prepare
      pmc.aborted(data.user)
      return
    }

    db.waiting.add({ id: "jobexit", user: data.user })
  }
  jobKick(): void {
    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.kicked()
      return
    }

    db.waiting.add({ id: "jobkick" })
  }
  jobInviteType(data: ISival): void {
    if (!data.invite) return
    db.job.invite = data.invite

    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.updateInviteType(true)
      return
    }
  }
  jobStart(): void {
    db.waiting.add({ id: "jobstart" })

    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.updateQueue()
      return
    }
  }
  jobPrepare(data: ISival): void {
    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.prepare(data.starttime)
      return
    }

    db.waiting.add({ id: "jobprepare", starttime: data.starttime })
  }
  prepareReady(data: ISival): void {
    if (db.pmc?.id === "prepare") {
      const pmc = db.pmc as Prepare
      pmc.updatePlayerStatus(data.from)
      return
    }

    db.waiting.add({ id: "prepareready", userId: data.from })
  }
  jobLaunch(): void {
    if (db.pmc?.id === "prepare") {
      const pmc = db.pmc as Prepare
      pmc.launch()
      return
    }

    db.waiting.add({ id: "joblaunch" })
  }
  jobSetItem(data: ISival): void {
    const { item } = data
    db.job.setItem(item)
  }
  trophyUpdate(data: ISival): void {
    const trophy = data.trophy
    db.trophies.update(trophy)
    if (trophy.ts && !trophy.claimed) {
      const trophies = trophy_list as IAchievements
      const trophyTitle = trophies[trophy.id].title[LocalList.lang!]

      const delayTime = db.onduty > 1 ? 20000 : 1000
      setTimeout(() => achievement({ title: trophyTitle, description: lang.ACH_UNLOCKED }), delayTime)
    }
  }
  mail(data: ISival): void {
    db.mails.add(data.mail)

    if (!LocalList["mail_notification_disabled"]) {
      notip({
        a: lang.NP_MAIL_TITLE,
        b: lang.NP_MAIL_REMAINS.replace("{amount}", db.mails.getAll.length.toString()),
        ic: "envelope"
      })
    }

    if (db.pmc?.id === "mails") {
      const pmc = db.pmc as Mails
      pmc.updateList()
    }
  }
  donateSettlement(data: ISival): void {
    if (data.mail) this.mail(data)

    if (db.pmc?.id === "invoice") {
      const pmc = db.pmc as Invoice
      pmc.settlement()
    }
  }
  async payout(): Promise<void> {
    const checkCutscene = async (resolve: Resolve) => {
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
  async winners(data: ISival): Promise<void> {
    const newTs = data.tss
    Object.keys(newTs).forEach((userId) => db.job.setTs(userId, -newTs[userId]))

    const checkCutscene = async (resolve: Resolve) => {
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

    this.game.startCutscene([{ type: "winner", winners: data.winners }])
  }
  addClaims(data: ISival): void {
    if (!db.pmx) return

    const states = data.states
    const owner = data.owner

    if (!states || !owner) return
    if (!Array.isArray(states)) return

    audio.emit({ action: "play", type: "sfx", src: "item_collected", options: { id: Date.now().toString() } })

    states.forEach((state) => db.pmx!.addClaim(state, owner))
  }
  run(data: ISival): void {
    if (!this.game || !data.type) return
    if (INVALID_CONTROLS.find((control) => control === data.type)) return
    const type = data.type as keyof SocketHandler
    if (this[type]) {
      this[type](data)
    }
  }
  init(game: Game) {
    this.game = game
  }
}

const socketHandler = new SocketHandler()
export default socketHandler
