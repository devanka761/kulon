import express, { Request, Response } from "express"
import { cdUser, isUser } from "../main/middlewares"
import { rep } from "../lib/generators"
import { joinRandomLobby } from "../controller/lobby.controller"
const router = express.Router()

router.use(cdUser, isUser, express.json({ limit: "1MB" }))

router.get("/joinRandom", async (req: Request, res: Response) => {
  const lobby = rep(await joinRandomLobby(req.user!.id))
  return res.status(lobby.code).json(lobby)
})

export default router
