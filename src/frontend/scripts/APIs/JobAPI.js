import db from "../data/db"
import chat from "../manager/Chat"
import lang from "../data/language"

export default class JobAPI {
  constructor() {
    this.data = {}
    this.scenes = null
    this.map = null
  }
  get host() {
    return this.data.host
  }
  get id() {
    return this.data.id
  }
  get itemId() {
    return this.data.itemId
  }
  get code() {
    return this.data.code
  }
  set status(newStatus) {
    this.data.status = newStatus
  }
  get status() {
    return this.data.status
  }
  get mission() {
    return this.data.mission
  }
  set invite(newInvite) {
    this.data.invite = newInvite
  }
  get invite() {
    return this.data.invite
  }
  flag(flagId) {
    return {
      val: () => this.data.flags[flagId],
      set: () => {
        this.data.flags[flagId] = true
      },
      delete: () => {
        this.data.flags[flagId] = false
        delete this.data.flags[flagId]
      }
    }
  }
  addPlayer(userId) {
    this.data.players.push({ id: userId, ts: Date.now() })
  }
  addUser(user) {
    if (!this.data.users) this.data.users = [db.me]
    this.data.users.push(user)
  }
  get users() {
    if (!this.data.users) this.data.users = [db.me]
    return this.data.users
  }
  getUser(userId) {
    return this.data.users.find((user) => user.id === userId)
  }
  removeUser(userid) {
    const user = this.data.users.findIndex((user) => user.id === userid)
    if (user === -1) return
    this.data.users.splice(user, 1)
  }
  playerExists(userId) {
    return this.data.players.some((player) => player.id === userId)
  }
  removePlayer(userId) {
    const player = this.data.players.findIndex((player) => player.id === userId)
    if (player === -1) return
    chat.add(userId, lang.TC_LEFT, true)
    this.data.players.splice(player, 1)
  }
  transformPlayers() {
    this.data.players.forEach((player) => {
      delete player.ts
      player.ready = false
    })
  }
  get players() {
    return this.data.players
  }
  create(jobData) {
    Object.keys(jobData).forEach((k) => {
      this.data[k] = jobData[k]
    })
  }
  set nextMap(newMap) {
    this.map = newMap
  }
  get nextMap() {
    return this.map
  }
  clearMap() {
    Object.keys(this.map).forEach((mapId) => {
      delete this.map[mapId]
    })
    this.map = null
  }
  get bag() {
    return this.data.bag
  }
  setItem(item) {
    this.data.bag[item.id] = { ...item, itemId: item.id }
  }
  getItem(item) {
    return this.data.bag[item]
  }
  set finishScenes(newScene) {
    this.scenes = newScene
  }
  get finishScenes() {
    return this.scenes
  }
  reset() {
    Object.keys(this.data).forEach((k) => {
      delete this.data[k]
    })
  }
}
