import { rNumber } from "../lib/generators"
import zender from "../lib/zender"
import { IItem } from "../types/ItemTypes"
import { IJob } from "../types/JobTypes"
import { mission_list } from "../lib/shared"
import User from "../models/UserModel"
import prog from "./prog"
import webhook from "../lib/webhook"
import cfg from "../../config/cfg"

function generateJobCode(existingCode: number[] = []) {
  let newCode = rNumber(4)
  while (existingCode.includes(newCode)) {
    newCode = rNumber(4)
  }
  return newCode
}

class Job {
  private data: IJob[]
  constructor() {
    this.data = []
  }
  create(userId: string, missionId: string, itemId: string): IJob {
    const jobExist = this.data.find((item) => item.host === userId)

    if (jobExist) this.remove(jobExist.id)

    const jobCode = generateJobCode(this.data.map((item) => item.code))

    const job: IJob = {
      id: `${Date.now().toString(36)}x${jobCode}`,
      itemId,
      code: jobCode,
      host: userId,
      status: 1,
      mission: missionId,
      invite: 1,
      states: {},
      bag: {},
      players: [{ id: userId, ts: Date.now(), done: false, ready: false }]
    }

    this.data.push(job)
    return job
  }
  getByCode(jobCode: number): IJob | null {
    return this.data.find((item) => item.code === jobCode) || null
  }
  getByPlayer(userId: string): IJob | null {
    return this.data.find((item) => item.players.find((usr) => usr.id === userId)) || null
  }
  getRandom(roomTypes: number[]): IJob | null {
    const missions = mission_list.filter((room) => roomTypes.includes(room.mode))
    if (missions.length < 1) return null

    const jobs = this.data.filter((room) => {
      const mission = missions.find((m) => m.id === room.mission)
      const status = room.status
      const invite = room.invite
      const players = room.players.length
      return status === 1 && invite === 1 && mission && players < mission.max
    })

    const job = jobs.sort((a, b) => b.players.length - a.players.length)

    return job[0]
  }
  get(jobId: string): IJob | null {
    return this.data.find((item) => item.id === jobId) || null
  }

  upgradeStatus(jobId: string, newStatus: 2 | 3): boolean {
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return false

    this.data[jobIndex].status = newStatus
    return true
  }

  setDone(jobId: string, userId: string): boolean {
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return false
    const userIndex = this.data[jobIndex].players.findIndex((user) => user.id === userId)
    if (userIndex === -1) return false
    this.data[jobIndex].players[userIndex].done = true

    if (this.data[jobIndex].players.every((user) => user.done)) {
      this.upgradeStatus(jobId, 3)
      const timing1 = Date.now() + 20000
      this.data[jobIndex].players.forEach((user) => {
        zender("system", user.id, "jobPrepare", { starttime: timing1 })
      })
    }

    return true
  }

  setReady(jobId: string, userId: string): boolean {
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return false
    const userIndex = this.data[jobIndex].players.findIndex((user) => user.id === userId)
    if (userIndex === -1) return false
    this.data[jobIndex].players[userIndex].ready = true

    if (this.data[jobIndex].players.every((user) => user.ready)) {
      this.data[jobIndex].players.forEach((user) => {
        zender("system", user.id, "jobLaunch")
      })
      this.setInitialBag(jobId)
    }
    return true
  }

  setInitialBag(jobId: string) {
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return false

    const missionId = this.data[jobIndex].mission
    const mission = mission_list.find((item) => item.id === missionId)

    if (!mission || !mission.bag) return
    mission.bag.forEach((item) => {
      this.data[jobIndex].bag[item.id] = item
    })
  }

  addBag(jobId: string, item: IItem): void {
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return
    this.data[jobIndex].bag[item.itemId] = item
    const players = this.data[jobIndex].players.map((item) => item.id)
    players.forEach((userId) => {
      zender("system", userId, "jobSetItem", { item })
    })
  }

  addPlayer(userId: string, jobId: string): IJob | null {
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return null

    this.data[jobIndex].players.push({ id: userId, ts: Date.now(), done: false, ready: false })
    return this.data[jobIndex]
  }
  removePlayer(userId: string, jobId: string): boolean {
    const jobIndex = this.data.findIndex((item) => item.id === jobId)
    if (jobIndex === -1) return false

    const userIndex = this.data[jobIndex].players.findIndex((item) => item.id === userId)
    if (userIndex === -1) return false

    this.data[jobIndex].players.splice(userIndex, 1)
    return true
  }

  hasStates(jobId: string, states: string[] | string): boolean {
    states = Array.isArray(states) ? states : [states]
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return true
    const jobStates = Object.keys(this.data[jobIndex].states)
    return states.every((state) => jobStates.includes(state))
  }

  addStates(jobId: string, states: string[] | string, owner?: string) {
    states = Array.isArray(states) ? states : [states]
    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return null

    states.forEach((state) => (this.data[jobIndex].states[state] = owner || true))
  }
  removeStates(jobId: string, states: string[] | string) {
    states = Array.isArray(states) ? states : [states]

    const jobIndex = this.data.findIndex((job) => job.id === jobId)
    if (jobIndex === -1) return null

    states.forEach((state) => delete this.data[jobIndex].states[state])
  }
  remove(jobId: string): boolean {
    const jobIndex = this.data.findIndex((item) => item.id === jobId)
    if (jobIndex === -1) return false

    const users = this.data[jobIndex].players.map((item) => item.id)

    users.forEach((userId) => zender("system", userId, "removeJob", { jobId: jobId }))
    this.data.splice(jobIndex, 1)
    return true
  }
  async exit(uid: string): Promise<void> {
    const job = dbjob.getByPlayer(uid)
    if (!job) return
    if (job.status >= 4) return
    const users = await User.find({ id: { $in: job.players.map((usr) => usr.id) } }).lean()
    const userToInclude = users.find((usr) => usr.id === uid)
    users.forEach((usr) => {
      zender(uid, usr.id, "jobExit", { user: userToInclude })
    })
    if (job.status === 3) {
      if (!prog.isDone(uid, "jobleft")) prog.update(uid, "jobleft", 1)
      dbjob.remove(job.id)
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
}

const dbjob = new Job()
export default dbjob
