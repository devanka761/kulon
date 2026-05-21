import fs from "fs"
import { IAchievements } from "../types/TrophyTypes"
import { IShopItem } from "../types/AccountTypes"
import { ICloudItem } from "../types/ItemTypes"
import { IMissionList } from "../types/JobTypes"

export const skinlist = JSON.parse(fs.readFileSync("./public/json/skins/skin_list.json", "utf-8")).map((sk: { id: string }) => sk.id) as string[]

export const trophylist = JSON.parse(fs.readFileSync("./public/json/main/trophies.json", "utf-8")) as IAchievements

export const shop_items = JSON.parse(fs.readFileSync("./public/json/items/shop_items.json", "utf-8")) as IShopItem[]

export const cloud_items = JSON.parse(fs.readFileSync("./public/json/items/cloud_items.json", "utf-8")) as ICloudItem[]

export const mission_list = JSON.parse(fs.readFileSync("./public/json/main/missions.json", "utf-8")) as IMissionList[]
