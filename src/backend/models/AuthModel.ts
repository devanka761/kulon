import { model, Model, Schema } from "mongoose"
import { IAuth } from "../types/auth.types"

export type IAuthModel = Model<IAuth>

const schema = new Schema(
  {
    email: { type: String, required: true },
    otp: {
      type: {
        code: { type: Number, required: true },
        expiry: { type: Number, required: true }
      },
      _id: false
    },
    rate: { type: Number, required: true },
    cd: { type: Number }
  },
  {
    versionKey: false
  }
)

const Auth: IAuthModel = model<IAuth>("Auth", schema)

export default Auth
