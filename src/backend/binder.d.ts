import { type WebSocket } from "ws"
import { IAccountSession } from "./types/AccountTypes"

declare module "express-ws" {
  interface WebSocketWithHeartbeat extends WebSocket {
    isAlive: boolean
  }
}

declare module "express-session" {
  interface SessionData {
    user?: IAccountSession
  }
}

declare module "express" {
  interface Request {
    user?: IAccountSession
  }
}

export {}
