const express = require("express");
const { isUser, cdUser } = require("../main/middlewares");
const { rep } = require("../main/helper");
const hjob = require("../controllers/job.controller");
const router = express.Router();

router.use(cdUser, isUser, express.json({limit: "1MB"}));

router.post("/create", (req, res) => {
  const createJob = rep(hjob.createJob(req.session.user.id, req.body));
  return res.json(createJob);
});
router.post("/invite", (req, res) => {
  const sendInvite = rep(hjob.sendInvite(req.session.user.id, req.body));
  return res.json(sendInvite);
});
router.post("/accept", (req, res) => {
  const acceptInvite = rep(hjob.acceptInvite(req.session.user.id, req.body));
  return res.json(acceptInvite);
});
router.post("/join", (req, res) => {
  const joinCode = rep(hjob.joinCode(req.session.user.id, req.body));
  return res.json(joinCode);
});
router.post("/kick", (req, res) => {
  const playerKick = rep(hjob.playerKick(req.session.user.id, req.body));
  return res.json(playerKick);
});
router.get("/find/:job_code", (req, res) => {
  const findJobCode = rep(hjob.findJobCode(req.session.user.id, req.params.job_code));
  return res.json(findJobCode);
});
router.post("/launch", (req, res) => {
  const launchJob = rep(hjob.launchJob(req.session.user.id, req.body));
  return res.json(launchJob);
});

module.exports = router;