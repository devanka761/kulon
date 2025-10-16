import { escapeRegex } from "../lib/generators"
import zender from "../lib/zender"
import prog from "../main/prog"
import Account from "../models/AccountModel"
import Friend from "../models/FriendModel"
import User from "../models/UserModel"
import { IUser } from "../types/user.types"
import { IRepTempB } from "../types/validate.types"

export async function usersFind(uid: string, userid: string): Promise<IRepTempB> {
  if (!userid || typeof userid !== "string") return { code: 404, msg: "USER_NOT_FOUND" }

  if (userid.length < 4) return { code: 400, msg: "FR_MIN" }
  if (userid.length > 40) return { code: 400, msg: "FR_MAX" }
  if (uid === userid) return { code: 404, msg: "USER_NOT_FOUND" }

  const regex = new RegExp(escapeRegex(userid), "i")

  const users = await User.find({
    $or: [{ username: { $regex: regex } }, { id: userid }],
    id: { $ne: uid }
  }).lean()

  if (users.length < 1) return { code: 404, msg: "USER_NOT_FOUND" }
  return { code: 200, data: { users } }
}

export async function UserExists(userId: string) {
  const userExists = await User.exists({ id: userId })
  if (!userExists) return false
  return true
}
export async function UserAnon(userId: string) {
  const userExists = await Account.exists({ id: userId, anon: { $exists: true } })
  if (!userExists) return false
  return true
}

export async function addFriend(uid: string, userid: string): Promise<IRepTempB> {
  if (await UserAnon(uid)) return { code: 401, msg: "I_AM_ANON" }
  if (!userid || typeof userid !== "string") return { code: 404, msg: "USER_NOT_FOUND" }
  if (!(await UserExists(userid))) return { code: 404, msg: "USER_NOT_FOUND" }
  if (await UserAnon(userid)) return { code: 404, msg: "USER_IS_ANON" }

  const oldData = await Friend.findOne({ users: { $all: [uid, userid] } })
  if (oldData) {
    if (oldData.isFriend) return { code: 200, msg: "isFriend" }
    if (oldData.req === userid) {
      await oldData.updateOne({ isFriend: true, req: null })
      const zenderData = (await User.findOne({ id: uid }).lean()) as IUser
      zender(uid, userid, "acceptFriend", { user: zenderData })
      return { code: 200, msg: "isFriend" }
    }
    if (oldData.req === uid) return { code: 200, msg: "myReq" }
  }
  const zenderData = (await User.findOne({ id: uid }).lean()) as IUser
  await Friend.create({ users: [uid, userid], isFriend: false, req: uid })
  zender(uid, userid, "addFriend", { user: zenderData })
  return { code: 200, msg: "myReq" }
}

export async function acceptFriend(uid: string, userid: string): Promise<IRepTempB> {
  if (await UserAnon(uid)) return { code: 401, msg: "I_AM_ANON" }
  if (!userid || typeof userid !== "string") return { code: 404, msg: "USER_NOT_FOUND" }
  if (!(await UserExists(userid))) return { code: 404, msg: "USER_NOT_FOUND" }
  if (await UserAnon(userid)) return { code: 404, msg: "USER_IS_ANON" }

  const oldData = await Friend.findOne({ users: { $all: [uid, userid] } })
  if (!oldData) return { code: 404, msg: "notfriend" }

  if (oldData.isFriend) return { code: 200, msg: "isFriend" }

  if (oldData.req === uid) return { code: 404, msg: "myReq" }
  if (oldData.req !== userid) return { code: 404, msg: "notfriend" }

  await oldData.updateOne({ isFriend: true })
  const zenderData = (await User.findOne({ id: uid }).lean()) as IUser
  zender(uid, userid, "acceptFriend", { user: zenderData })

  if (!prog.isDone(uid, "befriends")) {
    const usr1friends = await Friend.find({ users: uid, isFriend: true }).countDocuments()
    prog.set(uid, "befriends", usr1friends)
  }
  if (!prog.isDone(userid, "befriends")) {
    const usr2friends = await Friend.find({ users: userid, isFriend: true }).countDocuments()
    prog.set(userid, "befriends", usr2friends)
  }
  return { code: 200, msg: "isFriend" }
}

export async function declineFriend(uid: string, userid: string): Promise<IRepTempB> {
  if (await UserAnon(uid)) return { code: 401, msg: "I_AM_ANON" }
  if (!userid || typeof userid !== "string") return { code: 404, msg: "USER_NOT_FOUND" }
  if (!(await UserExists(userid))) return { code: 404, msg: "USER_NOT_FOUND" }
  if (await UserAnon(userid)) return { code: 404, msg: "USER_IS_ANON" }

  const oldData = await Friend.findOne({ users: { $all: [uid, userid] } })
  if (!oldData) return { code: 404, msg: "notfriend" }
  if (oldData.req === uid) return { code: 404, msg: "myReq" }

  await oldData.deleteOne()
  const zenderData = (await User.findOne({ id: uid }).lean()) as IUser
  zender(uid, userid, "declineFriend", { user: zenderData })
  return { code: 200, msg: "notfriend" }
}

export async function cancelFriend(uid: string, userid: string): Promise<IRepTempB> {
  if (await UserAnon(uid)) return { code: 401, msg: "I_AM_ANON" }
  if (!userid || typeof userid !== "string") return { code: 404, msg: "USER_NOT_FOUND" }
  if (!(await UserExists(userid))) return { code: 404, msg: "USER_NOT_FOUND" }
  if (await UserAnon(userid)) return { code: 404, msg: "USER_IS_ANON" }

  const oldData = await Friend.findOne({ users: { $all: [uid, userid] } })
  if (!oldData) return { code: 200, msg: "notfriend" }

  await oldData.deleteOne()
  const zenderData = (await User.findOne({ id: uid }).lean()) as IUser
  zender(uid, userid, "cancelFriend", { user: zenderData })

  return { code: 200, msg: "notfriend" }
}

export async function removeFriend(uid: string, userid: string): Promise<IRepTempB> {
  if (await UserAnon(uid)) return { code: 401, msg: "I_AM_ANON" }
  if (!userid || typeof userid !== "string") return { code: 404, msg: "USER_NOT_FOUND" }
  if (!(await UserExists(userid))) return { code: 404, msg: "USER_NOT_FOUND" }
  if (await UserAnon(userid)) return { code: 404, msg: "USER_IS_ANON" }

  const oldData = await Friend.findOne({ users: { $all: [uid, userid] } })
  if (!oldData) return { code: 200, msg: "notfriend" }
  if (!oldData.isFriend) return { code: 200, msg: "notfriend" }
  await oldData.deleteOne()
  const zenderData = (await User.findOne({ id: uid }).lean()) as IUser
  zender(uid, userid, "removeFriend", { user: zenderData })
  return { code: 200, msg: "notfriend" }
}
