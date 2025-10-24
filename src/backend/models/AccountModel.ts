import { model, Model, Schema } from "mongoose"
import { IAccount } from "../types/account.types"

export type IAccountModel = Model<IAccount>

const schema = new Schema(
  {
    id: { type: String, required: true },
    data: {
      type: {
        id: { type: String, required: true },
        email: { type: String, required: true },
        provider: { type: String, required: true }
      },
      required: true,
      _id: false
    },
    anon: { type: Number }
  },
  {
    versionKey: false
  }
)

const Account: IAccountModel = model<IAccount>("Account", schema)

export default Account
