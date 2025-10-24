import { Request, Response, NextFunction } from "express"
import Account from "../models/AccountModel"
import User from "../models/UserModel"

const userCDs = new Map()

export function cdUser(req: Request, res: Response, next: NextFunction) {
  const user_ips: string | string[] = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"] || req.socket.remoteAddress || "unknown"

  let ip: string = ""
  if (typeof user_ips === "string") {
    ip = user_ips
  } else {
    ip = user_ips[0]
  }

  const uid = req.user?.id ? req.user.id : ip

  if (userCDs.has(uid) && userCDs.get(uid) > Date.now()) {
    res.status(429).json({ ok: false, code: 429, msg: "TO_MANY_REQUEST" })
    return
  }

  if (userCDs.has(uid)) userCDs.delete(uid)
  userCDs.set(uid, Date.now() + 500)
  next()
}
export async function isUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) return res.status(401).json({ ok: false, code: 401, msg: "UNAUTHORIZED" })

  const userExists = await User.exists({ id: req.user.id })
  if (!userExists) return res.status(401).json({ ok: false, code: 401, msg: "UNAUTHORIZED" })

  next()
}
export async function isAccount(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) return res.status(401).json({ ok: false, code: 401, msg: "UNAUTHORIZED" })

  const accountExists = await Account.exists({ id: req.user.id })
  if (!accountExists) return res.status(401).json({ ok: false, code: 401, msg: "UNAUTHORIZED" })

  next()
}
export async function isMod(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) return res.status(401).json({ ok: false, code: 401, msg: "UNAUTHORIZED" })

  const accountIsMod = await User.exists({ id: req.user.id, access: 7 })
  if (!accountIsMod) return res.status(403).json({ ok: false, code: 403, msg: "FORBIDDEN" })

  next()
}
