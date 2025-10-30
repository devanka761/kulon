import { WebSocket } from "ws"
import { IPeer } from "../types/peer.types"

class Peer {
  private clients: Map<string, IPeer> = new Map<string, IPeer>()
  private users: Map<string, string> = new Map<string, string>()
  private waits: Map<string, string> = new Map<string, string>()
  add(clientId: string, socket: WebSocket): IPeer {
    const client: IPeer = { id: clientId, socket }
    this.clients.set(clientId, client)
    return client
  }
  get(clientId: string): IPeer | null {
    const client = this.clients.get(clientId)
    if (!client) return null
    return client
  }
  remove(clientId: string): boolean {
    const client = this.clients.get(clientId)
    if (!client) return false
    this.clients.delete(clientId)
    return true
  }
  register(uid: string, clientId: string): void {
    this.waits.set(uid, clientId)
  }
  unregister(uid: string): void {
    if (!this.users.has(uid)) return
    this.users.delete(uid)
  }
  validate(uid: string, clientId: string): boolean {
    if (!this.waits.has(uid)) return false
    if (this.waits.get(uid) !== clientId) return false
    this.waits.delete(uid)
    this.users.set(uid, clientId)
    return true
  }
  parse(uid: string): string | null {
    return this.users.get(uid) || null
  }
  get size(): number {
    return this.clients.size
  }
  get entries(): IPeer[] {
    const clients: IPeer[] = []
    this.clients.forEach((client) => clients.push(client))
    return clients
  }
  get players(): string[] {
    const users: string[] = []
    this.users.forEach((user) => users.push(user))
    return users
  }
}

export default new Peer()
