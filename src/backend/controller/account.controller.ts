import { AnyBulkWriteOperation } from "mongoose"
import User from "../models/UserModel"
import { ICreateUser, ISkin, IUser } from "../types/user.types"
import { IRepTempB, ISival } from "../types/validate.types"
import { ISocketConfig } from "../types/peer.types"
import { escapeRegex, isProd, rUid } from "../lib/generators"
import peer from "../lib/peer"
import cfg from "../../config/cfg"
import Friend from "../models/FriendModel"
import Item from "../models/ItemModel"
import Mail from "../models/MailModel"
import { IItem, IReturnItem } from "../types/item.types"
import Trophy from "../models/TrophyModel"
import prog from "../main/prog"
import { IAccount, IExchange } from "../types/account.types"
import validate from "../lib/validate"
import { PEER_CONFIG } from "../../config/peer.json"
import { shop_items, skinlist, trophylist } from "../lib/shared"
import zender from "../lib/zender"
import clientBuild from "../lib/clientBuild"
import Account from "../models/AccountModel"
import webhook from "../lib/webhook"
import { exitCurrentLobby } from "./lobby.controller"

function initSocketClient(uid: string): ISocketConfig {
  zender("system", uid, "newLogin", { userId: uid })

  const oldClientId = peer.parse(uid)
  if (oldClientId) {
    exitCurrentLobby(uid)
    peer.remove(oldClientId)
    peer.unregister(uid)
  }

  const clientId = rUid()
  peer.register(uid, clientId)
  const host = (isProd ? cfg.APP_HOST : `localhost:${cfg.APP_PORT}`) as string
  return { id: clientId, host }
}

export async function getMe(uid: string): Promise<IRepTempB> {
  const user = await User.findOne({ id: uid }).lean()
  if (!user) return { code: 200, data: { me: null } }

  const socket = initSocketClient(uid)

  const roomList = await Friend.find({ users: uid }).lean()
  const userids = roomList.map((room) => room.users.find((usr) => usr !== uid))
  const users = await User.find({ id: { $in: userids } }).lean()

  const room = roomList.map((userData) => {
    return {
      ...userData,
      user: users.find((user) => user.id === userData.users.find((usr) => usr !== uid))
    }
  })

  room.forEach((usr) => {
    if (usr.user?.id) {
      zender(uid, usr.user.id, "crewOnline", { userId: uid })
    }
  })

  const bag = await Item.find({ owner: uid }, { owner: 0 }).lean()
  const mails = await Mail.find({ owner: uid }, { owner: 0 }).lean()
  const trophyList = await Trophy.find({ owner: uid }, { owner: 0 }).lean()

  trophyList.forEach((trophy) => prog.add(uid, trophy))
  const trophies = prog.getMany(uid)

  const provider = (await Account.findOne({ id: uid }).lean()) as IAccount

  const dataToReturn = {
    provider: {
      email: provider.data.provider === "anonymous" ? null : provider.data.email,
      name: provider.data.provider === "anonymous" ? "Guest" : provider.data.provider
    },
    me: user,
    socket,
    room,
    bag,
    mails,
    trophies,
    peer: PEER_CONFIG,
    build: clientBuild.buildVersion,
    package: clientBuild.packageVersion
  }

  return { code: 200, data: dataToReturn }
}

const isUsername = /^[A-Za-z0-9_]+$/
const usernameDeny1 = /^user/
const usernameDeny2 = /^admin/
const usernameExisted = ["dvnkz", "dvnkz_", "devanka"]

export async function createUser(uid: string, s: ICreateUser): Promise<IRepTempB> {
  if (!s.username || typeof s.username !== "string") return { code: 400, msg: "ACC_NO_USERNAME" }
  s.username = s.username.trim()
  if (!s.username.match(isUsername)) return { code: 400, msg: "ACC_USERNAME_NOT_VALID" }
  if (s.username.length < 5 || s.username.length > 20) return { code: 400, msg: "ACC_USERNAME_LIMIT" }
  if (s.username.replace(/_/g, "").length < 3) return { code: 400, msg: "ACC_USERNAME_CANNOT_BE_USED" }

  const regex = new RegExp(`^${escapeRegex(s.username)}$`, "i")
  const users = await User.find({
    $or: [{ id: uid }, { username: regex }]
  }).lean()

  const userExists = users.find((user) => user.id === uid)
  if (userExists) return { code: 400, msg: "ACC_USER_ALREADY_EXIST" }

  const usernameClaimed = users.find((user) => user.username.match(regex))
  if (usernameClaimed) return { code: 400, msg: "ACC_USERNAME_NOT_AVAILABLE" }

  if (s.username.toLowerCase().match(usernameDeny1) || s.username.toLowerCase().match(usernameDeny2) || usernameExisted.find((uname) => uname === s.username.toLowerCase())) return { code: 400, msg: "ACC_USERNAME_NOT_AVAILABLE", data: { username: s.username } }

  if (Object.keys(s.skin || {}).filter((sk) => !skinsValid.find((skin) => skin === sk)).length >= 1) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }
  const skinNotValid = Object.values(s.skin).filter((sk) => !skinlist.find((skin: string) => skin === sk))
  if (skinNotValid.length >= 1) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }
  const hasDvnkzSkin = Object.values(s.skin).find((skid) => skid.includes("Dvnkz"))
  if (hasDvnkzSkin) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }
  const data: IUser = {
    username: s.username,
    skin: {},
    id: uid,
    joined: Date.now(),
    trophies: [],
    access: []
  }
  Object.keys(s.skin)
    .filter((sk) => {
      const iSkin = sk as keyof IUser["skin"]
      return s.skin[iSkin] !== "null"
    })
    .forEach((sk) => {
      const iSkin = sk as keyof IUser["skin"]
      return (data.skin[iSkin] = s.skin[iSkin])
    })

  await User.create(data)
  await Item.create(
    {
      owner: uid,
      id: Date.now().toString(36) + "_69",
      itemId: "69",
      amount: 5
    },
    {
      owner: uid,
      id: Date.now().toString(36) + "_420",
      itemId: "420",
      amount: 15
    }
  )
  await Mail.create({
    owner: uid,
    id: "mail_initial_" + uid,
    title: { en: "Welcome!", id: "Selamat Datang!" },
    sub: { en: "System", id: "Sistem" },
    text: {
      en: "Hello, there! Here we are on journey of the Kulon. Please take these welcome gifts for joining us.\nHAVE FUN!!",
      id: "Halo! Selamat datang di perjalanan para Kulon. Semoga betah dengan petualangan sederhana ini. Terimalah sedikit hadiah berikut sebagai bentuk kebahagiaan atas tergabungnya anggota Kulon yang baru.\nENJOY!!"
    },
    ts: Date.now(),
    rewards: [
      { id: "69", amount: 155 },
      { id: "420", amount: 185 },
      { id: "CL00001", amount: 1, expiry: 1000 * 60 * 60 * 24 * 7 },
      { id: "CL00003", amount: 1, expiry: 1000 * 60 * 60 * 24 * 3 },
      { id: "CL00004", amount: 1, expiry: 1000 * 60 * 60 * 24 * 3 }
    ]
  })

  webhook(cfg.DISCORD_USERNAME, {
    author: { name: `ID ${uid}` },
    theme: "LIME",
    fields: [{ name: "Claimed", value: s.username, inline: true }]
  })

  return getMe(uid)
}

export async function mailClaim(uid: string, mailId: string): Promise<IRepTempB> {
  const mail = await Mail.findOne({ id: mailId, owner: uid })
  if (!mail) return { code: 404, msg: "MAIL_NO_ID" }

  const rewardItemIds = mail.rewards.map((rw) => rw.id)

  const userStackableItems = await Item.find({
    owner: uid,
    itemId: { $in: rewardItemIds },
    expiry: { $exists: false }
  }).lean()

  const bulkOps: AnyBulkWriteOperation[] = []
  const itemsToReturn: IReturnItem[] = []
  const webhookRewards: string[] = []

  for (const reward of mail.rewards) {
    if (reward.expiry) {
      const newItem: IItem = {
        owner: uid,
        id: Date.now().toString(36) + `_${reward.id}`,
        itemId: reward.id,
        amount: reward.amount,
        expiry: Date.now() + reward.expiry
      }
      bulkOps.push({ insertOne: { document: newItem } })
      itemsToReturn.push(newItem)
      webhookRewards.push(`ITM ${reward.id} [ +${reward.amount} ] 🕘`)
    } else {
      const existingItem = userStackableItems.find((item) => item.itemId === reward.id)
      if (existingItem) {
        bulkOps.push({
          updateOne: {
            filter: { id: existingItem.id, owner: uid },
            update: { $inc: { amount: reward.amount } }
          }
        })
        itemsToReturn.push({ ...existingItem, amount: existingItem.amount + reward.amount, placeholder: reward.amount })
      } else {
        const newItem: IItem = { owner: uid, id: Date.now().toString(36) + `_${reward.id}`, itemId: reward.id, amount: reward.amount }
        bulkOps.push({ insertOne: { document: newItem } })
        itemsToReturn.push(newItem)
      }
      webhookRewards.push(`ITM ${reward.id} [ +${reward.amount} ]`)
    }
  }

  if (bulkOps.length > 0) {
    await Item.bulkWrite(bulkOps)
  }

  await mail.deleteOne()

  webhook(cfg.DISCORD_MAIL, {
    description: "```\n" + webhookRewards.join("\n") + "\n```",
    theme: "BLURPLE",
    author: { name: `ID ${uid}` },
    footer: { text: mailId }
  })

  return { ok: true, code: 200, data: itemsToReturn }
}

export async function trophyClaim(uid: string, trophyId: string): Promise<IRepTempB> {
  if (!trophylist[trophyId]) return { code: 404, msg: "ACH_NO_ID" }

  if (!prog.isDone(uid, trophyId)) return { code: 400, msg: "ACH_NO_ID", data: { no: 1 } }
  if (prog.isClaimed(uid, trophyId)) return { code: 400, msg: "ACH_CLAIMED" }

  const trophyClaim = await prog.claim(uid, trophyId)
  if (!trophyClaim) return { code: 400, msg: "ACH_NO_ID", data: { no: 2 } }

  const rewardAmount = trophylist[trophyId].reward

  const item = await Item.findOneAndUpdate(
    { owner: uid, itemId: "69", expiry: { $exists: false } },
    {
      $inc: { amount: rewardAmount },
      $setOnInsert: {
        id: Date.now().toString(36) + `_69`,
        owner: uid,
        itemId: "69"
      }
    },
    { upsert: true, new: true }
  ).lean()

  const newData = { ...prog.get(uid, trophyId) }

  await Trophy.updateOne({ owner: uid, id: trophyId }, { $set: newData }, { upsert: true })

  return { ok: true, code: 200, data: [{ ...item, placeholder: rewardAmount }] }
}

export async function itemExchange(uid: string, s: IExchange): Promise<IRepTempB> {
  if (!validate({ item_id: "string", amount: "number" }, s)) return { code: 400, msg: "REQ_NOT_VALID" }

  const item_selling = shop_items.find((itm) => itm.id === s.item_id)
  if (!item_selling || item_selling.group !== "0") return { code: 400, msg: "REQ_NOT_VALID" }

  const onPrice = item_selling.price > item_selling.amount
  const amount = onPrice ? item_selling.price * s.amount : s.amount

  const req_item = await Item.findOne({ owner: uid, itemId: item_selling.req, expiry: { $exists: false } })
  if (!req_item || req_item.amount < amount) return { code: 404, msg: "EXC_NOT_ENOUGH" }

  const addedAmount = onPrice ? Math.floor(amount / (item_selling.price / item_selling.amount)) : amount * item_selling.amount

  const newReqItem = await Item.findOneAndUpdate({ owner: uid, itemId: item_selling.req, expiry: { $exists: false } }, { $inc: { amount: -amount } }, { new: true }).lean()
  if (!newReqItem) return { code: 404, msg: "EXC_NOT_ENOUGH" }

  const newSellingItem = await Item.findOneAndUpdate(
    { owner: uid, itemId: item_selling.id, expiry: { $exists: false } },
    {
      $inc: { amount: addedAmount },
      $setOnInsert: {
        id: Date.now().toString(36) + `_${item_selling.id}`,
        owner: uid,
        itemId: item_selling.id
      }
    },
    { upsert: true, new: true }
  ).lean()

  const itemToReturn: IReturnItem[] = [
    { ...newSellingItem, placeholder: addedAmount },
    { ...newReqItem, placeholder: -amount }
  ]

  webhook(cfg.DISCORD_EXCHANGE, {
    theme: "YELLOW",
    author: { name: `ID ${uid}` },
    fields: [
      { name: `ITM ${s.item_id}`, value: `[ +${addedAmount} ]`, inline: true },
      { name: `ITM ${item_selling.req}`, value: `[ -${amount} ]`, inline: true }
    ]
  })

  return { code: 200, data: itemToReturn }
}

export async function changeUsername(uid: string, s: ISival): Promise<IRepTempB> {
  if (!validate(["username", "item_id"], s)) return { code: 400, msg: "ACC_NO_USERNAME" }
  const username = s.username.trim() as string
  const itemId = s.item_id as string

  if (username.length < 5 || username.length > 20) return { code: 400, msg: "ACC_USERNAME_LIMIT" }
  if (username.replace(/_/g, "").length < 3) return { code: 400, msg: "ACC_USERNAME_CANNOT_BE_USED" }

  if (username.toLowerCase().match(usernameDeny1) || username.toLowerCase().match(usernameDeny2) || usernameExisted.find((uname) => uname === username.toLowerCase())) return { code: 400, msg: "ACC_USERNAME_NOT_AVAILABLE", data: { username: username } }

  const regex = new RegExp(`^${escapeRegex(s.username)}$`, "i")

  const userClaimed = await User.findOne({
    username: regex,
    id: { $ne: uid }
  }).lean()

  if (userClaimed) return { code: 404, msg: "ACC_USERNAME_NOT_AVAILABLE" }

  const user = await User.findOne({ id: uid })
  if (!user) return { code: 404, msg: "USER_NOT_FOUND" }

  const oldName = user.username
  const newName = username

  if (oldName.toLowerCase() === newName.toLowerCase()) return { code: 200, data: [] }

  const updatedCard = await Item.findOneAndUpdate(
    {
      owner: uid,
      id: itemId,
      itemId: "CL00001",
      amount: { $gte: 1 },
      $or: [{ expiry: { $exists: false } }, { expiry: { $gt: Date.now() } }]
    },
    { $inc: { amount: -1 } },
    { new: true }
  ).lean()

  if (!updatedCard) return { code: 404, msg: "ACC_NO_NAME_CARD_TICKET" }

  await user.updateOne({ username: newName })

  if (!prog.isDone(uid, "reborn")) prog.update(uid, "reborn", 1)

  webhook(cfg.DISCORD_USERNAME, {
    author: { name: `ID ${uid}` },
    theme: "BLURPLE",
    fields: [
      { name: "Claimed", value: newName, inline: true },
      { name: "Available", value: oldName, inline: true }
    ]
  })

  return { code: 200, data: [updatedCard] }
}

const skinsValid = ["Backpacks", "Beards", "Bodies", "Eyes", "Glasses", "Hairstyles", "Hats", "Outfits"]

export async function changeSkin(uid: string, s: ISival): Promise<IRepTempB> {
  if (!validate(["item_id"], s)) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }

  if (!s.skin) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }
  const skinKeys = Object.keys(s.skin)
  if (!validate(skinKeys, s.skin)) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }

  const skins = s.skin as ISkin

  if (skinKeys.filter((sk) => !skinsValid.find((skin) => skin === sk)).length >= 1) return { code: 404, msg: "ACC_SKIN_NOT_VALID" }
  const skinNotValid = Object.values(skins).filter((sk) => !skinlist.find((skin: string) => skin === sk))
  if (skinNotValid.length >= 1) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }

  const user = await User.findOne({ id: uid })
  if (!user) return { code: 404, msg: "USER_NOT_FOUND" }

  const hasDvnkzSkin = Object.values(skins).find((sk: string) => sk.includes("Dvnkz"))
  if (hasDvnkzSkin && (!user.access || !user.access.includes(7))) return { code: 400, msg: "ACC_SKIN_NOT_VALID" }

  const newSkin: Partial<ISkin> = {}

  if (hasDvnkzSkin) {
    newSkin.Outfits = hasDvnkzSkin
  } else {
    Object.keys(skins)
      .filter((sk) => skins[sk as keyof ISkin] !== "null")
      .forEach((sk) => (newSkin[sk as keyof ISkin] = skins[sk as keyof ISkin]))
  }

  if (newSkin.Hairstyles && newSkin.Hats) {
    newSkin.Hairstyles = "Hairstyle_01_" + newSkin.Hairstyles.substring(newSkin.Hairstyles.length - 2, newSkin.Hairstyles.length)
  }

  const updatedCard = await Item.findOneAndUpdate(
    {
      owner: uid,
      id: s.item_id,
      itemId: "CL00002",
      amount: { $gte: 1 },
      $or: [{ expiry: { $exists: false } }, { expiry: { $gt: Date.now() } }]
    },
    { $inc: { amount: -1 } },
    { new: true }
  ).lean()

  if (!updatedCard) return { code: 404, msg: "CHAR_NO_APPR_CARD_TICKET" }

  await user.updateOne({ skin: newSkin })

  if (!prog.isDone(uid, "newlook")) prog.update(uid, "newlook", 1)

  const data = {
    skin: newSkin,
    items: [updatedCard]
  }

  return { code: 200, data }
}
