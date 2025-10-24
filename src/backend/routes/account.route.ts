import express, { Request, Response } from "express"
import { cdUser, isAccount, isUser } from "../main/middlewares"
import { changeSkin, changeUsername, createUser, getMe, itemExchange, mailClaim, trophyClaim } from "../controller/account.controller"
import { rep } from "../lib/generators"
const router = express.Router()

router.post("/create-user", cdUser, isAccount, express.json({ limit: "1MB" }), async (req: Request, res: Response) => {
  const saveChar = rep(await createUser(req.user?.id as string, req.body))
  return res.status(saveChar.code).json(saveChar)
})

router.use(cdUser, isUser, express.json({ limit: "1MB" }))

router.get("/me", async (req: Request, res: Response) => {
  const me = rep(await getMe(req.user?.id as string))
  return res.status(me.code).json(me)
})

router.post("/mail-claim/:mailId", async (req: Request, res: Response) => {
  const { mailId } = req.params
  const claimMail = rep(await mailClaim(req.user?.id as string, mailId))
  return res.status(claimMail.code).json(claimMail)
})
router.post("/trophy-claim/:trophyId", async (req: Request, res: Response) => {
  const { trophyId } = req.params
  const claimTrophy = rep(await trophyClaim(req.user?.id as string, trophyId))
  return res.status(claimTrophy.code).json(claimTrophy)
})
router.post("/exchange", async (req: Request, res: Response) => {
  const exchange = rep(await itemExchange(req.user?.id as string, req.body))
  return res.status(exchange.code).json(exchange)
})
router.post("/update-username", async (req: Request, res: Response) => {
  const unameChanged = rep(await changeUsername(req.user?.id as string, req.body))
  return res.status(unameChanged.code).json(unameChanged)
})
router.post("/update-skin", async (req: Request, res: Response) => {
  const skinChanged = rep(await changeSkin(req.user?.id as string, req.body))
  return res.status(skinChanged.code).json(skinChanged)
})

export default router
