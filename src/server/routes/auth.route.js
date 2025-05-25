const fs = require("fs");
const express = require("express");
const { rep } = require("../main/helper");
const hauth = require("../controllers/auth.controller");
const { cdUser, isUser, isAdmin } = require("../main/middlewares");
const hoauth = require("../controllers/oauth.controller");
const router = express.Router();

router.use(express.json({ limit: "1MB" }));

router.post("/sign-in", cdUser, (req, res) => {
  const signIn = rep(hauth.login(req.body));
  return res.json(signIn);
});

router.post("/verify", cdUser, (req, res) => {
  const verifyUser = rep(hauth.verify(req.body));
  if(verifyUser.code === 200) req.session.user = verifyUser.data.user;
  return res.json(verifyUser);
});

router.get("/isAdmin", cdUser, isUser, isAdmin, (req, res) => {
  res.json({ok:true, code:200});
});

router.get("/isUser", cdUser, isUser, (req, res) => {
  const isLogged = rep(hauth.isLogged(req.session.user.id));
  return res.json(isLogged);
});

router.get("/stillUser", cdUser, isUser, (req, res) => {
  const stillUser = rep(hauth.stillUser(req.session.user.id));
  return res.json(stillUser);
});

router.use("/logout", cdUser, (req, res) => {
  req.session?.destroy();
  if(req.method === "POST") return { code:200 };
  return res.redirect("/");
});

const notfoundFile = fs.readFileSync("./templates/404.txt", "utf-8");
const authFailedFile = fs.readFileSync("./templates/auth_error.txt", "utf-8");

router.get("/:provider/redirect", async(req, res) => {
  const { provider } = req.params;
  if(!hoauth.isProviderValid(provider)) return res.send(notfoundFile);
  if(req.query?.error) return res.send(authFailedFile);
  if(!req.query?.code) return res.send(authFailedFile);
  const user = await hoauth.user({ provider, code: req.query.code });
  if(!user || user.error) return res.send(authFailedFile);
  const verifyUser = hauth.processThirdParty({
    user: user.data,
    provider: user.provider
  });
  if(verifyUser.code !== 200) return res.json(verifyUser);
  req.session.user = verifyUser.data.user;
  if(!req.query?.state) return res.redirect("/app");
  const state = JSON.parse(Buffer.from(req.query.state, "base64").toString());
  const redirectUrl = state.returnPage + (state.skipSplash ? ("?skipSplash=" + state.skipSplash) : "")
  return res.redirect(redirectUrl);
});
router.get("/:provider", cdUser, (req, res) => {
  const { provider } = req.params;
  const returnPage = req.query?.returnPage ? ("/" + req.query.returnPage) : "/app";
  const skipSplash = req.query?.skipSplash || 0;
  if(!hoauth.isProviderValid(provider)) return res.send(notfoundFile);
  return res.redirect(hoauth.auth(provider, returnPage, skipSplash));
});

module.exports = router;