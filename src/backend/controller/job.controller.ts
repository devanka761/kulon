import { IRepTempB, ISival } from "../types/validate.types"
import Item from "../models/ItemModel"
import { IItem } from "../types/item.types"
import { IJob, IJobToReturn } from "../types/job.types"
import { mission_list } from "../lib/shared"
import validate from "../lib/validate"
import dbjob from "../main/job"
import User from "../models/UserModel"
import zender from "../lib/zender"
import prog from "../main/prog"
import webhook from "../lib/webhook"
import cfg from "../../config/cfg"
import { exitCurrentLobby } from "./lobby.controller"

export async function createJob(uid: string, s: { mission_id: string }): Promise<IRepTempB> {
  if (!validate(["mission_id"], s)) return { code: 400, msg: "MM_JOB_INVALID" }
  const mission = mission_list.find((m) => m.id === s.mission_id)
  if (!mission || mission.ready < 1 || mission.beta) return { code: 404, msg: "MM_JOB_INVALID" }

  const price_id = mission.price[0]
  const price_amount = mission.price[1]

  const candidateItems = await Item.find({
    owner: uid,
    itemId: price_id,
    amount: { $gte: price_amount },
    $or: [{ expiry: { $gt: Date.now() } }, { expiry: { $exists: false } }]
  }).lean()

  let itemValid: IItem | undefined

  if (candidateItems.length > 0) {
    const tempItems = candidateItems.filter((item) => item.expiry)
    const permItems = candidateItems.filter((item) => !item.expiry)

    if (tempItems.length > 0) {
      itemValid = tempItems.sort((a, b) => (a.expiry || 0) - (b.expiry || 0))[0]
    } else if (permItems.length > 0) {
      itemValid = permItems[0]
    }
  }

  if (!itemValid) return { code: 400, msg: `EXC_NOT_ENOUGH` }

  const jobData: IJob = dbjob.create(uid, s.mission_id, itemValid.id)

  exitCurrentLobby(uid)

  return { code: 200, data: jobData }
}

export async function exitFromJob(uid: string): Promise<void> {
  const job = dbjob.getByPlayer(uid)
  if (!job) return
  if (job.status >= 4) return
  const users = await User.find({ id: { $in: job.players.map((usr) => usr.id) } }).lean()
  const userToInclude = users.find((usr) => usr.id === uid)
  users.forEach((usr) => {
    zender(uid, usr.id, "jobExit", { user: userToInclude })
  })
  if (job.status === 3 && !prog.isDone(uid, "jobleft")) {
    prog.update(uid, "jobleft", 1)
  }
  if (job.status < 2) {
    dbjob.removePlayer(uid, job.id)
  } else {
    webhook(cfg.DISCORD_MISSION, {
      author: { name: `JID ${job.code}` },
      title: "Mission Failed",
      theme: "RED",
      fields: [
        { name: "Mission ID", value: `MID ${job.mission}` },
        { name: "Reason", value: `ID ${uid} left the job` }
      ]
    })
  }

  if (job.host === uid) dbjob.remove(job.id)
}

export async function findJob(uid: string, job_code: string): Promise<IRepTempB> {
  if (!validate(["job_code"], { job_code })) return { code: 400, msg: "MM_JOB_INVALID" }
  const jobCode = Number(job_code)

  const job = dbjob.getByCode(jobCode)
  if (!job) return { code: 404, msg: "JOB_ID_NOT_FOUND" }
  if (job.players.find((usr) => usr.id === uid)) return { code: 200, data: job }
  if (job.invite > 1) return { code: 404, msg: "TM_NOT_PUBLIC_ANYMORE" }
  if (job.status > 1) return { code: 404, msg: "JOB_ONGOING" }

  const jobData = { ...job, id: null }

  const data = {
    job: jobData,
    user: await User.findOne({ id: job.host }).lean()
  }

  return { code: 200, data }
}

export async function joinJob(uid: string, job: IJob): Promise<IRepTempB> {
  const mission = mission_list.find((mission) => mission.id === job.mission)
  if (!mission) return { code: 404, msg: "MM_JOB_INVALID", data: "mission" }

  if (job.players.length < 1) return { code: 404, msg: "MM_JOB_INVALID", data: "couldnt add player" }

  const missionMaxPlayers = mission.max
  if (job.players.length >= missionMaxPlayers) return { code: 404, msg: "JOB_FULL" }

  const addPlayer = dbjob.addPlayer(uid, job.id)
  if (!addPlayer) return { code: 404, msg: "MM_JOB_INVALID", data: "couldnt add player" }

  const users = await User.find({ id: { $in: addPlayer.players.map((usr) => usr.id) } }).lean()
  const jobToReturn: IJobToReturn = {
    ...addPlayer,
    users
  }
  const userToInclude = users.find((usr) => usr.id === uid)
  addPlayer.players.forEach((usr) => zender(uid, usr.id, "jobJoin", { user: userToInclude }))

  exitCurrentLobby(uid)

  return { code: 200, data: jobToReturn }
}

export async function joinJobByCode(uid: string, s: ISival): Promise<IRepTempB> {
  if (!validate({ code: "number" }, s)) return { code: 404, msg: "MM_JOB_INVALID", data: "number" }

  const job = dbjob.getByCode(s.code)
  if (!job) return { code: 404, msg: "JOB_ID_NOT_FOUND" }
  if (job.status > 1) return { code: 404, msg: "JOB_ONGOING" }
  if (job.invite > 1) return { code: 404, msg: "TM_NOT_PUBLIC_ANYMORE" }
  if (job.players.find((usr) => usr.id === uid)) return { code: 404 }

  return await joinJob(uid, job)
}

export async function joinJobByInvite(uid: string, s: ISival): Promise<IRepTempB> {
  if (!validate(["invite"], s)) return { code: 400, msg: "MM_JOB_INVALID" }
  const job = dbjob.getByPlayer(s.invite)
  if (!job) return { code: 404, msg: "JOB_ID_NOT_FOUND" }
  if (job.status > 1) return { code: 404, msg: "JOB_ONGOING" }
  if (job.invite > 2) return { code: 404, msg: "TM_NOT_PUBLIC_ANYMORE" }
  if (job.players.find((usr) => usr.id === uid)) return { code: 404 }

  return await joinJob(uid, job)
}

export async function startJob(uid: string): Promise<IRepTempB> {
  const job = dbjob.getByPlayer(uid)
  if (!job) return { code: 404, msg: "JOB_ID_NOT_FOUND" }
  if (job.status > 1) return { code: 404, msg: "JOB_ONGOING" }

  const upgradeStatus = dbjob.upgradeStatus(job.id, 2)
  if (!upgradeStatus) return { code: 404, msg: "JOB_ID_NOT_FOUND" }

  job.players.forEach((usr) => {
    zender(uid, usr.id, "jobStart", {})
  })

  webhook(cfg.DISCORD_MISSION, {
    author: { name: `JID ${job.code}` },
    title: "Mission Started",
    theme: "BLURPLE",
    fields: [
      { name: "Mission ID", value: `MID ${job.mission}` },
      { name: "Host", value: `ID ${job.host}` },
      { name: "Crew", value: job.players.map((usr) => `ID ${usr.id}`).join("\n") }
    ]
  })

  return { code: 200 }
}
