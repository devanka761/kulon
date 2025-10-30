import express, { Request, Response } from "express"
import { cdUser, isAccount, isMod } from "../main/middlewares"
import { rep } from "../lib/generators"
import { addAssetMap, getEditorMapData, loadProjectMap, newProject, remAssetMap, saveProjectMap, sendMail, updateAccess } from "../controller/mod.controller"

const router = express.Router()

router.get("/editor-mapdata", cdUser, isAccount, express.json({ limit: "1MB" }), (req: Request, res: Response) => {
  const editor = rep(getEditorMapData())
  return res.status(editor.code).json(editor)
})

router.get("/editor-loadproject/:project_name", cdUser, isAccount, express.json({ limit: "1MB" }), (req: Request, res: Response) => {
  const editor = rep(loadProjectMap(req.params.project_name))
  return res.status(editor.code).json(editor)
})

router.use(isMod, express.json({ limit: "6MB" }))

router.post("/sendmail", async (req: Request, res: Response) => {
  const mail = rep(await sendMail(req.body))
  return res.status(mail.code).json(mail)
})
router.post("/access/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params
  const newAccess = rep(await updateAccess(userId, req.body))
  return res.status(newAccess.code).json(newAccess)
})

router.post("/editor-newproject", async (req: Request, res: Response) => {
  const editor = rep(await newProject(req.body))
  return res.status(editor.code).json(editor)
})

router.post("/editor-addasset", (req: Request, res: Response) => {
  const editor = rep(addAssetMap(req.body))
  return res.status(editor.code).json(editor)
})

router.post("/editor-remasset", (req: Request, res: Response) => {
  const editor = rep(remAssetMap(req.body))
  return res.status(editor.code).json(editor)
})

router.post("/editor-saveproject", (req: Request, res: Response) => {
  const editor = rep(saveProjectMap(req.body))
  return res.status(editor.code).json(editor)
})

export default router
