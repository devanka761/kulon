import express, { Request, Response } from "express"
import { cdUser, isUser } from "../main/middlewares"
import { rep } from "../lib/generators"
import { createJob, findJob, joinJobByCode, joinJobByInvite, startJob } from "../controller/job.controller"
import { joinRandomLobby } from "../controller/lobby.controller"
const router = express.Router()

router.use(cdUser, isUser, express.json({ limit: "1MB" }))

router.post("/create", async (req: Request, res: Response) => {
  const job = rep(await createJob(req.user?.id as string, req.body))
  return res.status(job.code).json(job)
})
router.get("/find/:job_code", async (req: Request, res: Response) => {
  const { job_code } = req.params
  const job = rep(await findJob(req.user?.id as string, job_code))
  return res.status(job.code).json(job)
})

router.post("/join/code", async (req: Request, res: Response) => {
  const job = rep(await joinJobByCode(req.user?.id as string, req.body))
  return res.status(job.code).json(job)
})
router.post("/join/invite", async (req: Request, res: Response) => {
  const job = rep(await joinJobByInvite(req.user?.id as string, req.body))
  return res.status(job.code).json(job)
})
router.post("/start", async (req: Request, res: Response) => {
  const job = rep(await startJob(req.user?.id as string))
  return res.status(job.code).json(job)
})

router.get("/joinRandom", async (req: Request, res: Response) => {
  const lobby = rep(await joinRandomLobby(req.user!.id))
  return res.status(lobby.code).json(lobby)
})

export default router
