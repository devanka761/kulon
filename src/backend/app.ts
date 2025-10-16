import fs from "fs"
import express, { Request, Response, NextFunction } from "express"
import expressWs, { WebSocketWithHeartbeat } from "express-ws"
import session from "express-session"
import MongoStore from "connect-mongo"
import authRoute from "./routes/auth.route"
import accountRoute from "./routes/account.route"
import profileRoute from "./routes/profile.route"
import jobRoute from "./routes/job.route"
import donateRoute from "./routes/donate.route"
import modRoute from "./routes/mod.route"
import cfg from "../config/cfg"
import { sessionUserBinder } from "./main/binder"
import webSocketApp from "./routes/socket.route"
import clientBuild from "./lib/clientBuild"
import { version } from "../config/version.json"
import mapEditor from "./main/mapEditor"

const deps = JSON.parse(fs.readFileSync("./public/json/build/deps.json", "utf-8") || "{}")

clientBuild.init()
mapEditor.load()

const server = expressWs(express())
const { app, getWss } = server

app.use(
  session({
    secret: cfg.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "strict" },
    store: MongoStore.create({
      mongoUrl: cfg.DB_URI,
      dbName: cfg.DB_NAME,
      collectionName: "sessions"
    })
  })
)

app.use(sessionUserBinder)
app.use(express.static("public"))
app.set("view engine", "ejs")

app.ws("/socket", (wsClient, req: Request) => {
  const ws = wsClient as WebSocketWithHeartbeat
  webSocketApp(ws, req)
})

const interval = setInterval(() => {
  getWss().clients.forEach((client) => {
    const ws = client as WebSocketWithHeartbeat
    if (ws.isAlive === false) {
      return ws.terminate()
    }

    ws.isAlive = false
    ws.ping()
  })
}, 10000)

getWss().on("close", () => clearInterval(interval))

app.use("/x/auth", authRoute)
app.use("/x/account", accountRoute)
app.use("/x/profile", profileRoute)
app.use("/x/job", jobRoute)
app.use("/x/donate", donateRoute)
app.use("/x/mod", modRoute)

app.get("/app", (req: Request, res: Response) => {
  res.render("app")
})

app.get("/editor", (req: Request, res: Response) => {
  res.render("editor")
})

const legals = ["privacy", "terms", "license"]

app.get("/legal/:legal_text", (req: Request, res: Response, next: NextFunction) => {
  const { legal_text } = req.params

  if (legals.find((legal) => legal === legal_text)) return res.render(legal_text)

  return next()
})

app.get("/", (req: Request, res: Response) => {
  res.render("home", { version, ...deps, langs: clientBuild.languages })
})

app.use("/", (req: Request, res: Response) => {
  const isJsonRequest = req.headers.accept?.includes("application/json") || req.headers["x-requested-with"] === "XMLHttpRequest"
  if (req.method.toLowerCase() === "get" && !isJsonRequest) {
    return res.status(404).render("404")
  }
  return res.status(404).json({ ok: false, code: 404, msg: "Your requested data is not found", error: "Not Found" })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err)
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      ok: false,
      code: 413,
      msg: "CONTENT_TOO_LARGE"
    })
  }

  console.error(err)

  return res.status(500).json({
    ok: false,
    code: 500,
    msg: "ERROR"
  })
})

export default app
