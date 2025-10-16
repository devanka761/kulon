import { type WebSocket } from "ws"
import { IAccount } from "./types/account.types"

declare module "express-ws" {
  interface WebSocketWithHeartbeat extends WebSocket {
    isAlive: boolean
  }
}

declare module "express-session" {
  interface SessionData {
    user?: IAccount
  }
}

declare module "express" {
  interface Request {
    user?: IAccount
  }
}

export {}
