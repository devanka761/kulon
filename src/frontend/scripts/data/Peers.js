import { CharacterAPI } from "../APIs/CharacterAPI"
import Peer from "../lib/Peer"
import peerMessage from "../lib/PeerMessage"
import socket from "../lib/Socket"
import socketHandler from "../lib/SocketHandler"
import db from "./db"

class Peers {
  constructor() {
    this.data = new Map()
  }
  size() {
    return this.data.size
  }
  getAll() {
    return this.data
  }
  get arr() {
    const dataToReturn = []
    this.data.forEach((peer) => dataToReturn.push(peer))
    return dataToReturn
  }
  has(userId) {
    return this.data.has(userId)
  }
  add(user) {
    const remote = new Peer({
      onSignal(data) {
        socket.send(data.type, { ...data, to: user.id })
      },
      onMessage: (data) => {
        if (!data.type || !data.from) return
        peerMessage.run(data)
      },
      onDisconnected: () => {
        this.kickFromJob(user)
        this.remove(user.id)
      },
      onUnavailable: () => {
        this.kickFromJob(user)
        this.remove(user.id)
      },
      onConnectionFailed: () => {
        this.kickFromJob(user)
        this.remove(user.id)
      }
    })

    const data = new CharacterAPI({
      user,
      remote,
      mapId: "kulonSafeHouse",
      x: -100,
      y: -100,
      direction: "down"
    })
    this.data.set(user.id, data)
    return data
  }
  get(user) {
    const userId = user.id || user
    return this.data.get(userId)
  }
  kickFromJob(user) {
    socketHandler.run({
      type: "jobExit",
      user,
      from: `system-${Date.now().toString(36)}`
    })
  }
  remove(userId) {
    const character = this.data.get(userId)
    if (character) {
      character.close()
      this.data.delete(userId)
    }
  }
  sendOne(userId, msgType, msgData = {}) {
    const character = this.data.get(userId)
    if (character) character.send({ from: db.me.id, type: msgType, ...msgData })
  }
  send(msgType, msgData = {}) {
    this.data.forEach((character) =>
      character.send({
        from: db.me.id,
        type: msgType,
        ...msgData
      })
    )
  }
  setInitialMap(newMapId) {
    this.data.forEach((char) => char.setMapId(newMapId))
  }
  closeAll() {
    this.data.forEach((character) => character.close())
    this.data.clear()
  }
}

const peers = new Peers()
export default peers
