const express = require("express");
const { isUser, cdUser } = require("../main/middlewares");
const haccount = require("../controllers/account.controller");
const { rep } = require("../main/helper");
const router = express.Router();

router.use(cdUser, isUser, express.json({limit: "1MB"}));

router.post("/save-char", (req, res) => {
  const saveChar = rep(haccount.saveChar(req.session.user.id, req.body));
  return res.json(saveChar);
});
router.get("/skin", (req, res) => {
  const userSkin = rep(haccount.getSkin(req.session.user.id));
  return res.json(userSkin);
});
router.post("/trophy-claim", async(req, res) => {
  const trophyClaim = rep(haccount.trophyClaim(req.session.user.id, req.body));
  return res.json(trophyClaim);
});
router.get("/my-trophies", async(req, res) => {
  const trophiesPeek = rep(haccount.trophiesPeek(req.session.user.id));
  return res.json(trophiesPeek);
});
router.post("/mail-claim", async(req, res) => {
  const mailClaim = rep(haccount.mailClaim(req.session.user.id, req.body));
  return res.json(mailClaim);
});
router.post("/mail-delete", (req, res) => {
  const mailDelete = rep(haccount.mailDelete(req.session.user.id, req.body));
  return res.json(mailDelete);
});
router.post("/change-username", (req, res) => {
  const changeUsername = rep(haccount.changeUsername(req.session.user.id, req.body));
  return res.json(changeUsername);
});
router.post("/update-skin", (req, res) => {
  const updateSkin = rep(haccount.updateSkin(req.session.user.id, req.body));
  return res.json(updateSkin);
});
router.post("/exchange", (req, res) => {
  const exchange = rep(haccount.exchange(req.session.user.id, req.body));
  return res.json(exchange);
});
router.get("/reconnect", (req, res) => {
  const reconnect = rep(haccount.reconnect(req.session.user.id));
  return res.json(reconnect);
});
module.exports = router;