import { model, Model, Schema } from "mongoose"
import { IFriend } from "../types/friend.types"

export type IFriendModel = Model<IFriend>

const schema = new Schema(
  {
    users: { type: [String], required: true },
    req: { type: String || null },
    isFriend: { type: Boolean, required: true }
  },
  {
    versionKey: false
  }
)

const Friend: IFriendModel = model<IFriend>("Friend", schema)

export default Friend
