import express, { Request, Response, Router } from "express"
import { authLogin, authVerify, processAnonymous, processThirdParty } from "../controller/auth.controller"
import { rep } from "../lib/generators"
import { IAccount } from "../types/account.types"
import { getOAuthUrl, getOAuthUser, isProviderValid } from "../controller/oauth.controller"
import { isAccount } from "../main/middlewares"
import { IQueryParam } from "../types/auth.types"

const router: Router = express.Router()

router.use(express.json({ limit: "100KB" }))

router.get("/isUser", isAccount, (req: Request, res: Response) => {
  res.status(200).json(rep({ code: 200 }))
  return
})

router.post("/sign-in", async (req: Request, res: Response) => {
  const signIn = rep(await authLogin(req.body))
  res.status(signIn.code).json(signIn)
  return
})

router.post("/verify", async (req: Request, res: Response) => {
  const verifyUser = rep(await authVerify(req.body))
  if (!verifyUser.ok) {
    res.status(verifyUser.code).json(verifyUser)
    return
  }
  const userData = verifyUser.data.user as IAccount
  if (verifyUser.code === 200 && userData) {
    req.user = {
      id: userData.id.toString(),
      data: {
        id: userData.data.id.toString(),
        email: userData.data.email,
        provider: userData.data.provider
      }
    }
  }
  res.status(verifyUser.code).json(verifyUser)
  return
})

router.get("/logout", (req: Request, res: Response) => {
  const { r, s, pwa } = req.query

  const url = "/" + (r?.toString() || "app")
  const queries: string[] = []
  if (s) queries.push("s=" + s)
  if (pwa) queries.push("pwa=" + pwa)

  const redirectURL = url + (queries.length >= 1 ? "?" + queries.join("&") : "")

  req.session.destroy(() => {
    res.redirect(redirectURL)
    return
  })
})

router.get("/:provider/redirect", async (req: Request, res: Response) => {
  const { provider } = req.params
  if (!provider) {
    return res.render("404")
  }
  if (req.query?.error) {
    return res.render("autherror")
  }
  if (!req.query?.code) {
    return res.render("autherror")
  }
  const user = await getOAuthUser({ provider, code: req.query.code as string })
  if (!user || user.error) {
    return res.render("autherror")
  }
  const verifyUser = rep(
    await processThirdParty({
      user: user.data,
      provider: user.provider
    })
  )
  if (!verifyUser.ok || verifyUser.code !== 200) {
    return res.render("autherror")
  }
  const userData = verifyUser.data.user as IAccount
  req.user = {
    id: userData.id,
    data: {
      id: userData.data.id,
      email: userData.data.email,
      provider: userData.data.provider
    }
  }

  const { state } = req.query
  if (!state) return res.redirect("/app")

  const states = JSON.parse(Buffer.from(state.toString(), "base64").toString()) as IQueryParam

  const url = states.r
  const queries: string[] = []
  if (states.s) queries.push("s=" + states.s)
  if (states.pwa) queries.push("pwa=" + states.pwa)

  const redirectURL = url + (queries.length >= 1 ? "?" + queries.join("&") : "")

  return res.redirect(redirectURL)
})

router.post("/guest", async (req: Request, res: Response) => {
  const user_ips: string | string[] = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"] || req.socket.remoteAddress || "unknown" + Date.now()

  let ip: string = ""
  if (typeof user_ips === "string") {
    ip = user_ips
  } else {
    ip = user_ips[0]
  }
  const anon = rep(await processAnonymous(ip))

  if (anon.ok && anon.data.user) {
    const userData = anon.data.user as IAccount

    req.user = {
      id: userData.id,
      data: {
        id: userData.data.id,
        email: userData.data.email,
        provider: userData.data.provider
      }
    }
  }

  return res.status(anon.code).json(anon)
})

router.get("/:provider", (req: Request, res: Response) => {
  const { provider } = req.params
  if (!isProviderValid(provider)) {
    return res.render("404")
  }

  const { r, s, pwa } = req.query

  const states: IQueryParam = { r: r ? "/" + r.toString() : "/app" }
  if (s) states.s = s.toString()
  if (pwa) states.pwa = pwa.toString()

  return res.redirect(getOAuthUrl(provider as "github" | "google" | "discord", states))
})

export default router
