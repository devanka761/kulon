process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
require("dotenv").config();
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const { ExpressPeerServer } = require("peer");
const app = express();
const authRouter = require("./routes/auth.route");
const accountRouter = require("./routes/account.route");
const profileRouter = require("./routes/profile.route");
const jobRouter = require("./routes/job.route");
const donateRouter = require("./routes/donate.route");
const adminRouter = require("./routes/admin.route");
const db = require("./main/db");

const h = require("./main/helper");
const xcloud = require("./main/xcloud");
const hjob = require("./controllers/job.controller");
const webhook = require("./main/webhook");
const tob = require("./main/tob");

const appConfig = require("./config.json");

if(!fs.existsSync("./dist")) fs.mkdirSync("./dist");

if (!fs.existsSync("./dist/sessions")) {
  fs.mkdirSync("./dist/sessions");
  console.log("sessions recreated!");
}

db.load();
if(!db.ref.v.version) db.ref.v.version = 1;
if(appConfig.update) db.ref.v.version++, db.save("v");

const HOST = process.env.APP_HOST.toString();
const PORT = Number(process.env.APP_PORT);
const PEER_KEY = h.peerKey;

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "strict" },
    store: new FileStore({ path: "./dist/sessions", logFn() {} }),
  })
);

app.use(express.static("public"));

const termsFile = fs.readFileSync("./templates/terms.txt", "utf-8");
const privacyFile = fs.readFileSync("./templates/privacy.txt", "utf-8");
const notfoundFile = fs.readFileSync("./templates/404.txt", "utf-8");

app.get("/app", (req, res) => {
  return res.sendFile("./public/app.html", { root: "./" });
});
app.get("/terms", (req, res) => {
  return res.send(termsFile);
});
app.get("/privacy", (req, res) => {
  return res.send(privacyFile);
});
app.get("/editor", (req, res) => {
  return res.sendFile("./public/editor.html", { root: "./" });
});

app.use("/x/auth", authRouter);
app.use("/x/account", accountRouter);
app.use("/x/profile", profileRouter);
app.use("/x/job", jobRouter);
app.use("/x/donate", donateRouter);
app.use("/x/admin", adminRouter);

app.get("/zonk", (req, res) => {
  return res.redirect("/x/admin/zonk");
})

app.get("/", (req, res) => {
  return res.sendFile("./public/home.html", { root: "./" });
});

const server = app.listen(PORT, () => {
  console.log(`server ok! http://${HOST}:${PORT}/app`);
  console.log(`peerServer ok! http://${HOST}:${PORT}/cloud/${PEER_KEY}/peers`);
});

const peerServerConfig = {};
peerServerConfig.key = PEER_KEY;
peerServerConfig.alive_timeout = 9000;
if(h.isProd) peerServerConfig.ssl = {
  key: fs.readFileSync(process.env.PEER_SSL_KEY),
  cert: fs.readFileSync(process.env.PEER_SSL_CERT)
};

const peerServer = ExpressPeerServer(server, peerServerConfig);
peerServer.on("message", (c, data) => {
  const udb = db.ref.u;
  const uid = Object.keys(udb).find(key => udb[key].peer === c.getId());
  if(!uid) return;
  if(data.ku) {
    if(data.ku.id === "hb") return c.send({s: xcloud.heartBeat(uid)});
    return c.send({s: xcloud.run(uid, data.ku)});
  }
  if(data.type === 'HEARTBEAT') {
    const heartBeat = xcloud.heartBeat(uid);
    if(heartBeat === 403423) return c.getSocket().close();
    return c.send({s: heartBeat});
  }
});

peerServer.on("connection", (c) => {
  console.log("connected   ", c.getId());
});
peerServer.on("disconnect", (c) => {
  const uid = Object.keys(db.ref.u).find(k => db.ref.u[k]?.peer === c.getId());
  if(uid) {
    hjob.exitFromJob(uid);
    xcloud.heartBeat(uid);
    delete db.ref.u[uid].peer;
    delete db.ref.u[uid].ls;
    webhook.userLog({userid:uid, status: 0});
    db.fileSet(tob[uid].key, "trophies", tob[uid].data);
    delete tob[uid];
  }
  console.log("disconnected", c.getId());
});

app.use("/cloud", peerServer);

app.use("/", (req, res) => {
  if(req.method === "POST") {
    return res.status(404).json({ code:404, msg: "NOT FOUND" });
  }
  return res.send(notfoundFile);
});
