import express, { Request, Response } from "express"
import { cdUser, isUser } from "../main/middlewares"
import { rep } from "../lib/generators"
import { acceptFriend, addFriend, cancelFriend, declineFriend, removeFriend, usersFind } from "../controller/profile.controller"
const router = express.Router()

router.use(cdUser, isUser, express.json({ limit: "1MB" }))

router.get("/find/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  const findProfile = rep(await usersFind(req.user?.id as string, userid))
  return res.status(findProfile.code).json(findProfile)
})

router.post("/addfriend/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  const setfriend = rep(await addFriend(req.user?.id as string, userid))
  return res.status(setfriend.code).json(setfriend)
})

router.post("/acceptfriend/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  const setfriend = rep(await acceptFriend(req.user?.id as string, userid))
  return res.status(setfriend.code).json(setfriend)
})

router.post("/ignorefriend/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  const setfriend = rep(await declineFriend(req.user?.id as string, userid))
  return res.status(setfriend.code).json(setfriend)
})

router.post("/cancelfriend/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  const setfriend = rep(await cancelFriend(req.user?.id as string, userid))
  return res.status(setfriend.code).json(setfriend)
})

router.post("/unfriend/:userid", async (req: Request, res: Response) => {
  const { userid } = req.params
  const setfriend = rep(await removeFriend(req.user?.id as string, userid))
  return res.status(setfriend.code).json(setfriend)
})

export default router
