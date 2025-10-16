import express, { Request, Response } from "express"
import { cdUser, isUser } from "../main/middlewares"
import { rep } from "../lib/generators"
import { createDonate, updateDonate } from "../controller/donate.controller"

const router = express.Router()

router.post("/midtrans/dvnkz/devanka/id/order/notifications", express.json({ limit: "2MB" }), (req: Request, res: Response) => {
  updateDonate(req.body || {})
  return res.json({ ok: true, code: 200, message: "OK" })
})

router.use(cdUser, isUser, express.json({ limit: "1MB" }))

router.post("/create/:itemId", async (req: Request, res: Response) => {
  const { itemId } = req.params
  const donate = rep(await createDonate(req.user?.id as string, itemId))
  return res.status(donate.code).json(donate)
})

export default router
