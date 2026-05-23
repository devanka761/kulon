import { WebSocket } from "ws"
import { IAny } from "./ValidateTypes"

export interface IPeer {
  id: string
  socket: WebSocket
}

export type SocketMessage = {
  [key: string]: IAny
}

export type SocketHandler = {
  [key: string]: (uid: string, data: SocketMessage) => void
}
export interface ISocket {
  type: string
  from: string
  uid: string
}

export interface IZender {
  key: string
  from: string
  type: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface ISocketConfig {
  id: string
  host: string
}

export interface ILobbies {
  [key: string]: string[]
}
