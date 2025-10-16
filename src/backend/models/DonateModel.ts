import { model, Model, Schema } from "mongoose"
import { IDonate } from "../types/donate.types"

export type IDonateModel = Model<IDonate>

const schema = new Schema(
  {
    orderId: { type: String, required: true },
    owner: { type: String, required: true },
    item: { type: String, required: true },
    price: { type: Number, required: true },
    url: {
      type: [
        {
          name: { type: String, required: true },
          method: { type: String, required: true },
          url: { type: String, required: true }
        }
      ],
      _id: false,
      required: true
    },
    qr: { type: String || null, required: true },
    expiry: { type: Number, required: true },
    transaction_time: { type: Number, required: true },
    transaction_status: { type: String, required: true }
  },
  {
    versionKey: false
  }
)

const Donate: IDonateModel = model<IDonate>("Donate", schema)

export default Donate
