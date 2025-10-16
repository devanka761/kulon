import { IProg, IProgress, ITrophy, ITrophyProgress, IUnCommits } from "../types/trophy.types"
import { trophylist } from "../lib/shared"
import zender from "../lib/zender"
import Trophy from "../models/TrophyModel"
import { ISival } from "../types/validate.types"
import User from "../models/UserModel"
import webhook from "../lib/webhook"
import cfg from "../../config/cfg"

class Prog {
  private data: IProg
  constructor() {
    this.data = {}
  }
  add(uid: string, newData: ITrophy): void {
    if (!this.data[uid]) this.data[uid] = {}
    this.data[uid][newData.id] = {
      taken: newData.taken,
      ts: newData.ts,
      claimed: newData.claimed
    }
  }
  async set(uid: string, trophyId: string, newTaken: number, tempData?: ISival): Promise<void> {
    if (this.isDone(uid, trophyId)) return
    if (!this.data[uid]) this.data[uid] = {}
    if (!this.data[uid][trophyId]) this.data[uid][trophyId] = { taken: 0, temp: tempData }
    if (tempData) {
      this.data[uid][trophyId].temp = tempData
    }
    this.data[uid][trophyId].taken = newTaken

    await this.save(uid, trophyId)
  }
  async update(uid: string, trophyId: string, addedTaken: number, tempData?: ISival): Promise<void> {
    if (this.isDone(uid, trophyId)) return
    if (!this.data[uid]) this.data[uid] = {}
    if (!this.data[uid][trophyId]) this.data[uid][trophyId] = { taken: 0, temp: tempData }
    if (tempData) {
      this.data[uid][trophyId].temp = tempData
    }
    this.data[uid][trophyId].taken += addedTaken

    await this.save(uid, trophyId)
  }
  async save(uid: string, trophyId: string): Promise<void> {
    const item = trophylist[trophyId]

    const curtaken = this.data[uid][trophyId].taken
    const reqtaken = item.taken

    if (curtaken >= reqtaken) {
      this.data[uid][trophyId].taken = reqtaken
      this.data[uid][trophyId].ts = Date.now()

      webhook(cfg.DISCORD_ACHIEVEMENT, {
        author: { name: `ID ${uid}` },
        title: `🏆 ${item.title.en.toUpperCase()}`,
        description: "```\n" + item.desc.en + "\n```",
        theme: "CYAN"
      })

      await this.setCommit(uid, trophyId, this.data[uid][trophyId])
    }
    if (this.data[uid]?.[trophyId]) {
      zender("system", uid, "trophyUpdate", { trophy: { ...this.data[uid][trophyId], id: trophyId } })
    }
  }
  async setCommit(uid: string, trophyId: string, trophy: IProgress): Promise<void> {
    await Trophy.updateOne(
      { owner: uid, id: trophyId },
      {
        $set: {
          owner: uid,
          id: trophyId,
          taken: trophy.taken,
          ts: trophy.ts,
          claimed: trophy.claimed
        }
      },
      { upsert: true }
    )
    await User.updateOne({ id: uid }, { $addToSet: { trophies: trophyId } })
  }
  async claim(uid: string, trophyId: string): Promise<boolean> {
    if (this.isClaimed(uid, trophyId)) return false
    if (!this.isDone(uid, trophyId)) return false
    this.data[uid][trophyId].claimed = true
    await this.setCommit(uid, trophyId, this.data[uid][trophyId])
    return true
  }
  get(uid: string, trophyId: string): ITrophyProgress | null {
    if (!this.data[uid] || !this.data[uid][trophyId]) return null

    const dataToReturn: ITrophyProgress = {
      id: trophyId,
      owner: uid,
      ...this.data[uid][trophyId]
    }
    return dataToReturn
  }
  getMany(uid: string): ITrophyProgress[] {
    return Object.keys(this.data[uid] || {}).map((k) => ({
      owner: uid,
      id: k,
      ...this.data[uid][k]
    }))
  }
  getUnCommits(): IUnCommits {
    const users: string[] = []
    const trophies: ITrophyProgress[] = []

    Object.keys(this.data).forEach((userId) => {
      Object.keys(this.data[userId])
        .filter((k) => !this.isDone(userId, k))
        .forEach((k) => {
          if (!users.find((usr) => usr === userId)) users.push(userId)
          trophies.push({
            owner: userId,
            id: k,
            ...this.data[userId][k]
          })
        })
    })

    return { trophies }
  }
  isDone(uid: string, trophyId: string): boolean {
    if (this.data[uid]?.[trophyId]?.ts) return true
    return false
  }
  isClaimed(uid: string, trophyId: string): boolean {
    if (this.data[uid]?.[trophyId]?.claimed) return true
    return false
  }
  remove(uid: string, trophyId: string): void {
    if (this.data[uid]?.[trophyId]) {
      delete this.data[uid][trophyId]
    }
  }
  destroy(uid: string): void {
    if (this.data[uid]) {
      delete this.data[uid]
    }
  }
}

const prog = new Prog()
export default prog
