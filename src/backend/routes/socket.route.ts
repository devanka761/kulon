import { Request } from "express"
import { WebSocketWithHeartbeat } from "express-ws"
import logger from "../main/logger"
import peer from "../lib/peer"
import { processSocketMessages, convertProg, timeOnlinePassed } from "../controller/socket.controller"
import { exitFromJob } from "../controller/job.controller"
import webhook from "../lib/webhook"
import cfg from "../../config/cfg"

function webSocketApp(ws: WebSocketWithHeartbeat, req: Request) {
  if (!req.user || !req.user.id) {
    logger.info("❌ Connection rejected: no user ID")
    ws.close()
    return
  }

  const userId = req.user.id
  const clientId = req.query.id?.toString()
  if (!clientId) {
    logger.info("❌ Connection rejected: no client id")
    ws.close()
    return
  }

  const validated = peer.validate(userId, clientId)
  if (!validated) {
    logger.info(`❌ Connection rejected: client with id ${clientId} is not found`)
    ws.close()
    return
  }
  const registered = peer.parse(userId)
  if (!registered) {
    logger.info(`❌ Connection rejected: user with id ${clientId} is not found`)
    ws.close()
    return
  }

  peer.add(clientId, ws)
  logger.info(`Online   ${userId} ${clientId}`)
  webhook(cfg.DISCORD_USERLOG, { description: `ID ${userId} JOINED`, theme: "LIME" })
  ws.isAlive = true

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString())
      processSocketMessages({ ...msg, from: clientId, uid: userId })
    } catch (err) {
      console.error("Failed to parse JSON.", err)
    }
  })
  ws.on("close", () => {
    peer.remove(clientId)
    peer.unregister(userId)
    exitFromJob(userId)
    convertProg()
    logger.info(`Offline  ${userId} ${clientId}`)
    webhook(cfg.DISCORD_USERLOG, { description: `ID ${userId} LEFT`, theme: "RED" })
  })

  ws.on("error", (err: Error) => {
    console.error(err)
  })

  ws.on("pong", () => {
    ws.isAlive = true
    timeOnlinePassed(userId)
  })
}

export default webSocketApp
