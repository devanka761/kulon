import { model, Model, Schema } from "mongoose"
import { IMail } from "../types/mail.types"

export type IMailModel = Model<IMail>

const schema = new Schema(
  {
    owner: { type: String, required: true },
    id: { type: String, required: true },
    title: {
      type: {
        id: { type: String, required: true },
        en: { type: String, required: true }
      },
      required: true,
      _id: false
    },
    sub: {
      type: {
        id: { type: String, required: true },
        en: { type: String, required: true }
      },
      required: true,
      _id: false
    },
    text: {
      type: {
        id: { type: String, required: true },
        en: { type: String, required: true }
      },
      required: true,
      _id: false
    },
    ts: { type: Number, required: true },
    rewards: {
      type: [
        {
          id: { type: String, required: true },
          amount: { type: Number, required: true },
          expiry: { type: Number }
        }
      ],
      required: true,
      _id: false
    }
  },
  {
    versionKey: false
  }
)

const Mail: IMailModel = model<IMail>("Mail", schema)

export default Mail
