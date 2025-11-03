import { CharacterAPI } from "../APIs/CharacterAPI"
import Peer from "../lib/Peer"
import peerMessage from "../lib/PeerMessage"
import socket from "../lib/Socket"
import socketHandler from "../lib/SocketHandler"
import { IUser } from "../types/db.types"
import { ISival } from "../types/lib.types"
import db from "./db"

class Peers {
  private data: Map<string, CharacterAPI> = new Map()
  size() {
    return this.data.size
  }
  getAll(): Map<string, CharacterAPI> {
    return this.data
  }
  get arr(): CharacterAPI[] {
    const dataToReturn: CharacterAPI[] = []
    this.data.forEach((peer) => dataToReturn.push(peer))
    return dataToReturn
  }
  has(userId: string): boolean {
    return this.data.has(userId)
  }
  add(user: IUser): CharacterAPI | undefined {
    if (this.has(user.id)) return this.get(user.id)

    const remote = new Peer({
      onSignal(data) {
        socket.send(data.type, { ...data, to: user.id })
      },
      onMessage: (data: ISival) => {
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
  get(user: IUser | string): CharacterAPI | undefined {
    const userId = typeof user === "string" ? user : user.id
    return this.data.get(userId)
  }
  kickFromJob(user: IUser): void {
    if (!db.job.getUser(user.id) && !db.job.playerExists(user.id)) return
    socketHandler.run({
      type: "jobExit",
      user,
      from: `system-${Date.now().toString(36)}`
    })
  }
  remove(userId: string): void {
    const character = this.data.get(userId)
    if (character) {
      character.close()
      this.data.delete(userId)
    }
  }
  sendOne(userId: string, msgType: string, msgData: ISival = {}): void {
    const character = this.data.get(userId)
    if (character) character.send({ from: db.me.id, type: msgType, ...msgData })
  }
  send(msgType: string, msgData: ISival = {}): void {
    this.data.forEach((character) =>
      character.send({
        from: db.me.id,
        type: msgType,
        ...msgData
      })
    )
  }
  setInitialMap(newMapId: string): void {
    this.data.forEach((char) => char.setMapId(newMapId))
  }
  closeAll(): void {
    this.data.forEach((character) => character.close())
    this.data.clear()
  }
}

const peers = new Peers()
export default peers
