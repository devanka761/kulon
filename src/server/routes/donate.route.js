const express = require("express");
const { isUser, cdUser } = require("../main/middlewares");
const { rep } = require("../main/helper");
const hdonate = require("../controllers/donate.controller");
const router = express.Router();

router.post("/midtrans/dvnkz/devanka/id/order/notifications", express.json({limit: "2MB"}), (req, res) => {
  hdonate.update(req.body);
  return res.json({ ok: true, code: 200, message: "OK" });
});

router.use(cdUser, isUser, express.json({limit: "1MB"}));

router.post("/create", async(req, res) => {
  const createDonate = rep(await hdonate.create(req.session.user.id, req.body));
  return res.json(createDonate);
});
router.get("/read/:donate_id", async(req, res) => {
  const readDonate = rep(await hdonate.read(req.session.user.id, req.params.donate_id));
  return res.json(readDonate);
});
module.exports = router;