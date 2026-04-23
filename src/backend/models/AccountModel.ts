import { model, Model, Schema } from "mongoose"
import { IAccount } from "../types/account.types"

export type IAccountModel = Model<IAccount>

const schema = new Schema(
  {
    id: { type: String, required: true },
    externalId: { type: String, required: true },
    email: { type: String, required: true },
    created: { type: Number, required: true },
    anon: { type: Number }
  },
  {
    versionKey: false
  }
)

const Account: IAccountModel = model<IAccount>("Account", schema)

export default Account
