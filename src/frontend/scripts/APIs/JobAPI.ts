import db from "../data/db"
import chat from "../manager/Chat"
import lang from "../data/language"
import { IJobItem, IJobToReturn, IPlayersMatchMaking, JobBag } from "../types/job.types"
import { IMapList, IObjectEvent } from "../types/maps.types"
import { IUser } from "../types/db.types"
import SaveList from "../data/SaveList"

export default class JobAPI {
  private data?: IJobToReturn
  private scenes?: IObjectEvent[]
  private map?: IMapList
  get host(): string | undefined {
    return this.data?.host
  }
  get id(): string | undefined {
    return this.data?.id
  }
  get itemId(): string | undefined {
    return this.data?.itemId
  }
  get code(): number | undefined {
    return this.data?.code
  }
  set status(newStatus: number) {
    if (!this.data) return
    this.data.status = newStatus
  }
  get status(): number | undefined {
    return this.data?.status
  }
  get mission(): string | undefined {
    return this.data?.mission
  }
  set invite(newInvite: number) {
    if (!this.data) return
    this.data.invite = newInvite
  }
  get invite(): number | undefined {
    return this.data?.invite
  }
  flag(flagId: string) {
    return {
      val: () => this.data?.states[flagId],
      set: () => {
        if (!this.data) return
        this.data.states[flagId] = true
      },
      delete: () => {
        delete this.data?.states[flagId]
      }
    }
  }
  addPlayer(userId: string): void {
    this.data?.players.push({ id: userId, ts: Date.now(), done: false, ready: false })
  }
  setTs(userId: string, ts: number): void {
    if (!this.data) return
    const player = this.data.users.findIndex((usr) => usr.id === userId)
    if (player === -1) return
    this.data.players[player].ts = ts
  }
  addUser(user: IUser): void {
    if (!this.data) return
    if (!this.data.users) this.data.users = [db.me]
    this.data.users.push(user)
  }
  get users(): IUser[] | undefined {
    if (!this.data) return undefined
    if (!this.data.users) this.data.users = [db.me]
    return this.data.users
  }
  getUser(userId: string): IUser | undefined {
    if (!this.data) return undefined
    return this.data.users?.find?.((user) => user.id === userId)
  }
  removeUser(userid: string): void {
    if (!this.data || !this.data.users) return
    const user = this.data.users.findIndex((usr) => usr.id === userid)
    if (user === -1) return
    this.data.users.splice(user, 1)
  }
  playerExists(userId: string): boolean {
    if (!this.data) return false
    return this.data.players?.some?.((player) => player.id === userId) || false
  }
  removePlayer(userId: string): void {
    if (!this.data || !this.data.players) return
    const player = this.data.players.findIndex((usr) => usr.id === userId)
    if (player === -1) return
    chat.add(userId, lang.TC_LEFT, true)
    this.data.players.splice(player, 1)
  }
  transformPlayers(): void {
    if (!this.data) return
    this.data.players.forEach((player) => {
      player.ready = false
    })
  }
  get players(): IPlayersMatchMaking[] | undefined {
    return this.data?.players
  }
  create(jobData: IJobToReturn): void {
    this.data = { ...jobData }
  }
  set nextMap(newMap: IMapList) {
    this.map = newMap
  }
  get nextMap(): IMapList | undefined {
    return this.map
  }
  clearMap(): void {
    if (!this.map) return
    Object.keys(this.map).forEach((mapId) => {
      delete this.map?.[mapId]
    })
    this.map = undefined
  }
  get bag(): JobBag | undefined {
    return this.data?.bag
  }
  setItem(item: IJobItem): void {
    if (!this.data) return
    this.data.bag[item.id] = { ...item, itemId: item.itemId || item.id }
  }
  getItem(item: string): IJobItem | undefined {
    return this.data?.bag[item]
  }
  set finishScenes(newScene: IObjectEvent[]) {
    this.scenes = newScene
  }
  get finishScenes(): IObjectEvent[] | undefined {
    return this.scenes
  }
  reset(): void {
    Object.keys(SaveList).forEach((k) => {
      delete SaveList[k]
    })

    if (this.data) {
      Object.keys(this.data).forEach((k) => {
        delete this.data?.[k as keyof typeof this.data]
      })

      this.data = undefined
    }

    if (this.map) {
      Object.keys(this.map).forEach((k) => {
        delete this.map?.[k]
      })

      this.map = undefined
    }

    if (this.scenes) {
      this.scenes.splice(0, this.scenes.length)

      this.scenes = undefined
    }
  }
}
