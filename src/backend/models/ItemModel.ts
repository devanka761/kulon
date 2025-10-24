import { model, Model, Schema } from "mongoose"
import { IItem } from "../types/item.types"

export type IItemModel = Model<IItem>

const schema = new Schema(
  {
    owner: { type: String, required: true },
    id: { type: String, required: true },
    itemId: { type: String, required: true },
    amount: { type: Number, required: true },
    expiry: { type: Number }
  },
  {
    versionKey: false
  }
)

const Item: IItemModel = model<IItem>("Item", schema)

export default Item
