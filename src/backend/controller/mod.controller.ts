import fs from "fs"
import validate from "../lib/validate"
import { IRepTempB, ISival } from "../types/validate.types"
import { cloud_items } from "../lib/shared"
import { IMail } from "../types/mail.types"
import User from "../models/UserModel"
import Mail from "../models/MailModel"
import zender from "../lib/zender"
import mapEditor from "../main/mapEditor"
import { IAssetMap } from "../types/editor.types"

export async function sendMail(s: ISival): Promise<IRepTempB> {
  if (!validate(["userId", "title", "sub", "text"], s)) return { code: 400, msg: "Invalid Form Body" }

  if (!s.rewards) return { code: 400, msg: "Invalid Form Body" }

  const userId = s.userId.trim()
  const userExists = await User.exists({ id: userId })
  if (!userExists) return { code: 404, msg: "User is not found" }

  const title_id = s.title?.trim()?.split("\\")?.[0]
  const title_en = s.title?.trim()?.split("\\")?.[1] || title_id

  const sub_id = s.sub?.trim()?.split("\\")?.[0]
  const sub_en = s.sub?.trim()?.split("\\")?.[1] || sub_id

  const text_id = s.text?.trim()?.split("\\")?.[0]
  const text_en = s.text?.trim()?.split("\\")?.[1] || text_id

  const notValids: string[] = []

  const rewards = Object.keys(s.rewards)
    .filter((k: string) => {
      const item_id = s.rewards[k]?.split(" ")?.[0] || null
      const item_amount = Number(s.rewards[k]?.split(" ")?.[1] || 0)
      if (!item_id || !item_amount || item_amount < 1) notValids.push(k)
      const item = cloud_items.find((itm) => itm.id === item_id)
      if (!item) notValids.push(k)
      return item
    })
    .map((k) => {
      const item_id = s.rewards[k].split(" ")[0]
      const item_amount = Number(s.rewards[k].split(" ")[1])
      return { id: item_id, amount: item_amount }
    })
  if (notValids.length >= 1) return { code: 400, msg: "There are Invalid Items" }

  const mail_id = "m" + Date.now().toString(36)

  const mail_data: IMail = {
    id: mail_id,
    owner: userId,
    ts: Date.now(),
    title: { id: title_id, en: title_en },
    sub: { id: sub_id, en: sub_en },
    text: { id: text_id, en: text_en },
    rewards
  }

  await Mail.create(mail_data)

  zender("system", userId, "mail", { mail: mail_data })

  return { code: 200 }
}

export async function updateAccess(userId: string, s: ISival): Promise<IRepTempB> {
  if (!s.access) return { code: 400, msg: "Invalid Form Body" }
  if (!Array.isArray(s.access)) return { code: 400, msg: "Invalid Form Body" }
  const newAccess = s.access.filter((k: ISival) => typeof k === "number" && k >= 1)

  const userExists = await User.updateOne({ id: userId }, { $set: { access: newAccess } })
  if (!userExists.modifiedCount) return { code: 404, msg: "User is not found" }

  return { code: 200 }
}

export async function newProject(s: ISival): Promise<IRepTempB> {
  if (!validate(["project_name"], s)) return { code: 400 }
  const project_name = s.project_name.replace(/\s/g, "").toLowerCase()
  if (mapEditor.exists(project_name)) return { code: 400, msg: "The Project Is Already Exist" }
  mapEditor.create(project_name)

  fs.writeFileSync(`./public/json/maps/mp_${project_name}.json`, JSON.stringify({}), "utf-8")
  fs.writeFileSync(`./public/json/assets/st_${project_name}.json`, JSON.stringify([]), "utf-8")
  fs.writeFileSync(`./public/json/scenes/cs_${project_name}.json`, JSON.stringify([]), "utf-8")
  return { code: 200 }
}
export function getEditorMapData(): IRepTempB {
  const data = mapEditor.data

  return { code: 200, data }
}

export function loadProjectMap(project_name: string): IRepTempB {
  if (mapEditor.exists(project_name)) return { code: 200, data: { id: project_name } }
  return { code: 400, msg: "The Project Is Not Available or Has Been Deleted" }
}

export function addAssetMap(s: ISival): IRepTempB {
  if (!validate(["asset-name", "asset-folder", "asset-file", "asset-extension", "project_name"], s)) return { code: 400 }
  s.extension = s["asset-extension"]

  if (s.extension !== ".png" && s.extension !== ".svg") return { code: 400, msg: "Asset file extension must be png or svg" }
  if (!mapEditor.exists(s.project_name)) return { code: 400, msg: "The Project Is Not Available or Has Been Deleted" }
  s.name = s["asset-name"].replace(/\s/g, "")
  s.folder = s["asset-folder"].replace(/\s/g, "").toLowerCase()

  const dataurl = decodeURIComponent(s["asset-file"])
  const buffer = Buffer.from(dataurl.split(",")[1], "base64")
  if (buffer.length > 5 * 1000 * 1000) {
    return { code: 413, msg: "FAILED: Request Entity Too Large" }
  }

  const folderExists = fs.existsSync(`./public/assets/maps/${s.folder}`)
  if (!folderExists) fs.mkdirSync(`./public/assets/maps/${s.folder}`)
  const fileExists = fs.existsSync(`./public/assets/maps/${s.folder}/${s.name}${s.extension}`)
  const assetPath = `./public/json/assets/st_${s.project_name}.json`
  if (!fs.existsSync(assetPath)) return { code: 404, msg: "Asset List File Does Not Exist" }
  if (!fileExists) fs.writeFileSync(`./public/assets/maps/${s.folder}/${s.name}${s.extension}`, buffer)

  const assetFile = fs.readFileSync(assetPath, "utf-8")
  const waitingFile = JSON.parse(assetFile)
  const assetsData = { id: s.name, path: `/assets/maps/${s.folder}/${s.name}${s.extension}` }
  waitingFile.push(assetsData)
  fs.writeFileSync(assetPath, JSON.stringify(waitingFile), "utf-8")
  return { code: 200, data: { assets: [assetsData] } }
}

export function remAssetMap(s: ISival): IRepTempB {
  if (!validate(["project_name", "asset-filename"], s)) return { code: 400 }
  s.filename = s["asset-filename"]
  if (!mapEditor.exists(s.project_name)) return { code: 400, msg: "The Project Is Not Available or Has Been Deleted" }

  const assetPath = `./public/json/assets/st_${s.project_name}.json`
  if (!fs.existsSync(assetPath)) return { code: 404, msg: "The Project Is Not Available or Has Been Deleted" }

  const assetBuffer = fs.readFileSync(assetPath, "utf-8")
  const assetList = JSON.parse(assetBuffer) as IAssetMap[]
  const currAsset = assetList.find((st) => st.id === s.filename)
  if (!currAsset) return { code: 400, msg: "Asset Does Not Exist or Has Been Deleted" }
  const currPath = `./public${currAsset.path}`
  if (fs.existsSync(currPath)) fs.rmSync(currPath)
  const newAssetList = assetList.filter((st) => st.id !== currAsset.id)
  fs.writeFileSync(assetPath, JSON.stringify(newAssetList), "utf-8")

  return { code: 200, data: { asset: s.filename } }
}
export function saveProjectMap(s: ISival): IRepTempB {
  if (!validate(["project_name", "file1", "file2"], s)) return { code: 400 }

  if (!mapEditor.exists(s.project_name)) return { code: 400, msg: "The Project Is Not Available or Has Been Deleted" }

  const projectPath = `./public/json/maps/mp_${s.project_name}.json`
  if (!fs.existsSync(projectPath)) return { code: 400, msg: "The Project Is Not Available or Has Been Deleted" }
  const finishedPath = `./public/json/scenes/cs_${s.project_name}.json`
  if (!fs.existsSync(finishedPath)) return { code: 400, msg: "The Project Is Not Available or Has Been Deleted" }

  fs.writeFileSync(projectPath, s.file1, "utf-8")
  fs.writeFileSync(finishedPath, s.file2, "utf-8")
  return { code: 200 }
}
