import { model, Model, Schema } from "mongoose"
import { IUser } from "../types/user.types"

export type IUserModel = Model<IUser>

const schema = new Schema(
  {
    id: { type: String, required: true },
    username: { type: String, required: true },
    joined: { type: Number, required: true },
    trophies: { type: [String], required: true },
    access: { type: [Number] },
    skin: {
      type: {
        Bodies: { type: String },
        Eyes: { type: String },
        Outfits: { type: String },
        Backpacks: { type: String },
        Beards: { type: String },
        Glasses: { type: String },
        Hairstyles: { type: String },
        Hats: { type: String }
      },
      required: true,
      _id: false
    }
  },
  {
    versionKey: false
  }
)

const User: IUserModel = model<IUser>("User", schema)

export default User
