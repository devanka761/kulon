import db from "../data/db"

export default class RoomAPI {
  constructor() {
    this.data = []
  }
  get friend() {
    return this.getAll("isFriend")
  }
  get req() {
    return this.getAll("theirReq")
  }
  get sent() {
    return this.getAll("myReq")
  }
  get(userId) {
    return this.data.find((user) => user.id === userId)
  }
  getAll(type = null) {
    if (!type) return this.data
    return this.data.filter((user) => user[type] && user[type] === true)
  }
  add(userData) {
    this.data.push(userData)
    return this
  }
  remove(userId) {
    const user = this.data.findIndex((user) => user.id === userId)
    if (user === -1) return
    this.data.splice(user, 1)
  }
  reset() {
    this.data.splice(0, this.data.length)
  }
  update(type, userData) {
    if (!type || !userData) return
    const userUpdate = { ...userData }
    delete userUpdate.isFriend
    delete userUpdate.theirReq
    delete userUpdate.myReq
    userUpdate[type] = true
    const user = this.data.find((user) => user.id === userData.id)
    if (!user) return this.add(userUpdate)
    delete user.isFriend
    delete user.theirReq
    delete user.myReq
    user[type] = true
  }
  parse(rooms) {
    if (!Array.isArray(rooms)) rooms = [rooms]
    rooms.forEach((room) => {
      const user = { ...room.user }

      if (room.isFriend) {
        user.isFriend = true
      } else if (room.req === user.id) {
        user.theirReq = true
      } else if (room.req === db.me.id) {
        user.myReq = true
      }

      this.add(user)
    })
  }
}
