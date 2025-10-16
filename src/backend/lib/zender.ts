import { IZender } from "../types/peer.types"
import { rNumber } from "./generators"
import peer from "./peer"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Zend = { [key: string]: any }

export default function zender(uid: string, userid: string, type: string, s?: Zend): boolean {
  if (userid === uid && (!s || !s.force)) return true

  const clientId = peer.parse(userid)
  if (!clientId) return false

  const client = peer.get(clientId)
  if (!client) return false

  const data: IZender = {
    ...s,
    key: `${uid}-${Date.now().toString(36)}_${rNumber(3)}`,
    from: uid,
    type: type
  }
  delete data.force
  client.socket.send(JSON.stringify(data))
  return true
}
