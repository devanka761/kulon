const express = require("express");
const { isUser, cdUser, isAdmin } = require("../main/middlewares");
const { rep } = require("../main/helper");
const hadmin = require("../controllers/admin.controller");
const db = require("../main/db");
const router = express.Router();

router.use(isUser, express.json({limit: "5MB"}));

router.get("/zonk/users/:userid", cdUser, isAdmin, (req, res) => {
  return res.json(hadmin.peekUsers(req.params.userid));
});
router.get("/zonk", isAdmin, (req, res) => {
  return res.sendFile("./public/zonk.html", { root: "./" });
});

router.use(cdUser);

router.post("/sendmail", isAdmin, (req, res) => {
  const sendMail = rep(hadmin.sendMail(req.session.user.id, req.body));
  return res.json(sendMail);
});

router.post("/editor-newproject", (req, res) => {
  const newproject = rep(hadmin.newProject(req.session.user.id, req.body));
  return res.json(newproject);
});
router.get("/editor-loadproject/:project_name", (req, res) => {
  const loadproject = rep(hadmin.loadProject(req.params.project_name));
  return res.json(loadproject);
});
router.get("/editor-mapdata", (req, res) => {
  const editorMapdata = rep(hadmin.getEditorMapData());
  return res.json(editorMapdata);
});
router.post("/editor-addasset", (req, res) => {
  const addAsset = rep(hadmin.addAsset(req.session.user.id, req.body));
  return res.json(addAsset);
});
router.post("/editor-remasset", (req, res) => {
  const remAsset = rep(hadmin.remAsset(req.session.user.id, req.body));
  return res.json(remAsset);
});
router.post("/editor-saveproject", (req, res) => {
  const saveproject = rep(hadmin.saveProject(req.session.user.id, req.body));
  return res.json(saveproject);
});
router.post("/set-admin", isAdmin, (req, res) => {
  return res.json(rep(hadmin.setAdmin(req.session.user.id, req.body)));
});
router.post("/ban", isAdmin, (req, res) => {
  return res.json(rep(hadmin.banUser(req.session.user.id, req.body)));
});
router.get("/check-ban/:id", isAdmin, (req, res) => {
  return res.json(rep(hadmin.checkBan(req.session.user.id, req.params.id)));
});
module.exports = router;