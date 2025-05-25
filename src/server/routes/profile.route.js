const express = require("express");
const { isUser, cdUser } = require("../main/middlewares");
const hprofile = require("../controllers/profile.controller");
const { rep } = require("../main/helper");
const router = express.Router();

router.use(cdUser, isUser, express.json({limit: "1MB"}));

router.post("/addfriend", (req, res) => {
  const addfriend = rep(hprofile.addfriend(req.session.user.id, req.body));
  return res.json(addfriend);
});
router.post("/unfriend", (req, res) => {
  const unfriend = rep(hprofile.unfriend(req.session.user.id, req.body));
  return res.json(unfriend);
});
router.post("/acceptfriend", (req, res) => {
  const acceptfriend = rep(hprofile.acceptfriend(req.session.user.id, req.body));
  return res.json(acceptfriend);
});
router.post("/ignorefriend", (req, res) => {
  const ignorefriend = rep(hprofile.ignorefriend(req.session.user.id, req.body));
  return res.json(ignorefriend);
});
router.post("/cancelfriend", (req, res) => {
  const cancelfriend = rep(hprofile.cancelfriend(req.session.user.id, req.body));
  return res.json(cancelfriend);
});

router.get("/find/:userid", (req, res) => {
  const isMany = req.query?.multiple || 0;
  const findProfile = rep(hprofile.find(req.session.user.id, req.params.userid, isMany));
  return res.json(findProfile);
});

module.exports = router;