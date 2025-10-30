import { AnyBulkWriteOperation } from "mongoose"
import prog from "../main/prog"
import Trophy from "../models/TrophyModel"
import { ISocket, SocketHandler, SocketMessage } from "../types/peer.types"
import { ITrophy } from "../types/trophy.types"
import validate from "../lib/validate"
import dbjob from "../main/job"
import { mission_list } from "../lib/shared"
import zender from "../lib/zender"
import User from "../models/UserModel"
import peer from "../lib/peer"
import { exitFromJob } from "./job.controller"
import { IJob, IMissionList } from "../types/job.types"
import { IItem } from "../types/item.types"
import Item from "../models/ItemModel"
import webhook from "../lib/webhook"
import cfg from "../../config/cfg"

function peerRequests(uid: string, s: SocketMessage) {
  if (!validate(["to"], s)) return
  if (uid === s.to) return

  const job = dbjob.getByPlayer(uid)
  if (!job) return
  if (!job.players.find((usr) => usr.id === s.to)) return

  zender(uid, s.to as string, s.type as string, s)
}

async function calculateWinner(job: IJob, mission: IMissionList) {
  const stateCounts: { [key: string]: number } = {}
  for (const stateKey in job.states) {
    const playerId = job.states[stateKey]
    if (typeof playerId === "string") {
      stateCounts[playerId] = (stateCounts[playerId] || 0) + 1
    }
  }

  let maxCount = 0
  for (const playerId in stateCounts) {
    if (stateCounts[playerId] > maxCount) {
      maxCount = stateCounts[playerId]
    }
  }

  const winners: string[] = []
  for (const playerId in stateCounts) {
    if (stateCounts[playerId] === maxCount) {
      winners.push(playerId)
    }
  }

  const bulkOps: AnyBulkWriteOperation<IItem>[] = []

  bulkOps.push({
    updateOne: { filter: { owner: job.host, id: job.itemId }, update: { $inc: { amount: -mission.price[1] } } }
  })

  job.players.forEach((usr) => {
    const eco1 = mission.payout[winners.find((pl) => pl === usr.id) ? "success" : "fail"][0]
    const eco2 = mission.payout[winners.find((pl) => pl === usr.id) ? "success" : "fail"][1]

    const multiple = usr.id === job.host ? 3 : 1

    bulkOps.push(
      {
        updateOne: { filter: { owner: usr.id, itemId: eco1.id }, update: { $inc: { amount: eco1.amount * multiple } } }
      },
      {
        updateOne: { filter: { owner: usr.id, itemId: eco2.id }, update: { $inc: { amount: eco2.amount * multiple } } }
      }
    )

    zender("job-system", usr.id, "winners", { winners, tss: stateCounts })
  })

  webhook(cfg.DISCORD_MISSION, {
    author: { name: `JID ${job.code}` },
    title: "Mission Completed",
    theme: "LIME",
    fields: [
      { name: "Mission ID", value: `MID ${job.mission}` },
      { name: "Winners", value: winners.map((usr) => `ID ${usr}`).join("\n") }
    ]
  })
  dbjob.remove(job.id)

  if (bulkOps.length >= 1) await Item.bulkWrite(bulkOps)
}

const socketMessage: SocketHandler = {
  async jobInvite(uid, s) {
    if (!validate(["to", "jobId"], s)) return

    const userId = s.to as string
    if (uid === userId) return

    const jobId = s.jobId as string

    const job = dbjob.get(jobId)
    if (!job) return
    if (job.host !== uid && job.invite !== 2) return
    if (!job.players.find((usr) => usr.id === uid)) return
    if (job.players.find((usr) => usr.id === userId)) return

    const mission = mission_list.find((mission) => mission.id === job.mission)
    if (!mission) return

    const missionMaxPlayers = mission.max
    if (job.players.length >= missionMaxPlayers) return
    if (job.players.find((usr) => usr.id === userId)) return

    const clientId = peer.parse(userId)
    if (!clientId) {
      return zender("system", uid, "crewOffline", { userId })
    }

    zender(uid, userId, "jobInvite", {
      job: {
        ...job,
        id: null,
        ts: Date.now()
      },
      user: await User.findOne({ id: uid }).lean()
    })
  },
  offer(uid, s) {
    peerRequests(uid, s)
  },
  answer(uid, s) {
    peerRequests(uid, s)
  },
  candidate(uid, s) {
    peerRequests(uid, s)
  },
  jobExit(uid) {
    exitFromJob(uid)
  },
  jobKick(uid, s) {
    if (!validate(["to"], s)) return
    const userId = s.to as string
    if (uid === userId) return
    const job = dbjob.getByPlayer(uid)
    if (!job) return
    zender("system", userId, "jobKick", {})
    exitFromJob(userId)
  },
  jobInviteType(uid, s) {
    if (!validate({ invite: "number" }, s)) return

    const inviteType = s.invite as 1 | 2 | 3
    if (inviteType < 1 || inviteType > 3) return
    const job = dbjob.getByPlayer(uid)
    if (!job) return
    if (job.host !== uid) return
    job.invite = inviteType
    job.players.forEach((usr) => {
      zender(uid, usr.id, "jobInviteType", { invite: inviteType })
    })
  },
  jobDoneLoading(uid) {
    const job = dbjob.getByPlayer(uid)
    if (!job) return
    dbjob.setDone(job.id, uid)
  },
  prepareReady(uid) {
    const job = dbjob.getByPlayer(uid)
    if (!job) return
    dbjob.setReady(job.id, uid)
    job.players.forEach((usr) => {
      zender(uid, usr.id, "prepareReady", {})
    })
  },
  usePhone(uid) {
    if (prog.isDone(uid, "firstphone")) return
    prog.update(uid, "firstphone", 1)
  },
  async payout(uid) {
    const job = dbjob.getByPlayer(uid)
    if (!job) return

    const host = job.host
    const players = job.players.filter((usr) => usr.id !== host).map((usr) => usr.id)

    if (!prog.isDone(host, "firsthost")) {
      prog.update(host, "firsthost", 1)
    }
    players.forEach((usr) => {
      if (!prog.isDone(usr, "firstcrew")) prog.update(usr, "firstcrew", 1)
    })
    job.players.forEach((usr) => zender(uid, usr.id, "payout"))

    const mission = mission_list.find((k) => k.id === job.mission) as IMissionList
    const eco1 = mission.payout.success[0]
    const eco2 = mission.payout.success[1]

    const bulkOps: AnyBulkWriteOperation<IItem>[] = []

    bulkOps.push(
      {
        updateOne: { filter: { owner: host, id: job.itemId }, update: { $inc: { amount: -mission.price[1] } } }
      },
      {
        updateOne: { filter: { owner: host, itemId: eco1.id }, update: { $inc: { amount: eco1.amount * 3 } } }
      },
      {
        updateOne: { filter: { owner: host, itemId: eco2.id }, update: { $inc: { amount: eco2.amount * 3 } } }
      }
    )

    players.forEach((usr) => {
      bulkOps.push(
        {
          updateOne: { filter: { owner: usr, itemId: eco1.id }, update: { $inc: { amount: eco1.amount } } }
        },
        {
          updateOne: { filter: { owner: usr, itemId: eco2.id }, update: { $inc: { amount: eco2.amount } } }
        }
      )
    })

    webhook(cfg.DISCORD_MISSION, {
      author: { name: `JID ${job.code}` },
      title: "Mission Completed",
      theme: "LIME",
      fields: [{ name: "Mission ID", value: `MID ${job.mission}` }]
    })
    dbjob.remove(job.id)
    if (bulkOps.length >= 1) await Item.bulkWrite(bulkOps)
  },
  addStates(uid, s) {
    if (!s.states || !Array.isArray(s.states)) return
    const job = dbjob.getByPlayer(uid)
    if (!job) return

    dbjob.addStates(job.id, s.states)
  },
  removeStates(uid, s) {
    if (!s.states || !Array.isArray(s.states)) return
    const job = dbjob.getByPlayer(uid)
    if (!job) return

    dbjob.removeStates(job.id, s.states)
  },
  async itemExpired(uid, s) {
    const itemExists = await Item.exists({
      owner: uid,
      id: s.id,
      expiry: { $lt: Date.now() }
    })
    if (!itemExists) return
    if (!prog.isDone(uid, "itemexpired")) prog.update(uid, "itemexpired", 1)
  },
  openDonateMenu(uid) {
    if (!prog.isDone(uid, "sawercoy")) prog.update(uid, "sawercoy", 1)
  },
  endTime(uid) {
    const job = dbjob.getByPlayer(uid)
    if (!job) return
    const mission = mission_list.find((ms) => ms.id === job.mission)
    if (!mission) return
    calculateWinner(job, mission)
  },
  addClaims(uid, s) {
    if (!s.states) return
    const states = s.states as string[]
    // zender("job-system", uid, "addClaims", { states, owner: uid })
    const job = dbjob.getByPlayer(uid)
    if (!job) return
    if (dbjob.hasStates(job.id, states)) return
    dbjob.addStates(job.id, states, uid)
    job.players.forEach((usr) => {
      zender("job-system", usr.id, "addClaims", { states, owner: uid, data: s.data || null })
    })
    const mission = mission_list.find((ms) => ms.id === job.mission)
    if (!mission || mission.mode !== 2) return
    const reqs = mission.reqs || []
    if (dbjob.hasStates(job.id, reqs)) calculateWinner(job, mission)
  }
}

export function processSocketMessages(data: Partial<ISocket>): void {
  if (!data.type || !data.from || !data.uid) return
  if (!socketMessage[data.type]) return
  socketMessage[data.type](data.uid, data)
}

export async function timeOnlinePassed(uid: string): Promise<void> {
  const oldTime = prog.get(uid, "playtime")
  const tempData = (oldTime?.temp || Date.now()) as number

  const addedData = Date.now() - tempData
  prog.update(uid, "playtime", addedData, Date.now())
}

export async function convertProg() {
  // if (!isProd) return
  const { trophies } = prog.getUnCommits()

  const bulkOps: AnyBulkWriteOperation<ITrophy>[] = trophies.map((trophy) => ({
    updateOne: {
      filter: { owner: trophy.owner, id: trophy.id },
      update: {
        $set: {
          owner: trophy.owner,
          id: trophy.id,
          taken: trophy.taken,
          ts: trophy.ts,
          claimed: trophy.claimed
        }
      },
      upsert: true
    }
  }))

  if (bulkOps.length > 0) await Trophy.bulkWrite(bulkOps)
}
