import { model, Model, Schema } from "mongoose"
import { ITrophy } from "../types/trophy.types"

export type ITrophyModel = Model<ITrophy>

const schema = new Schema(
  {
    owner: { type: String, required: true },
    id: { type: String, required: true },
    taken: { type: Number, required: true },
    display: { type: Number, required: true },
    ts: { type: Number },
    claimed: { type: Boolean }
  },
  {
    versionKey: false
  }
)

const Trophy: ITrophyModel = model<ITrophy>("Trophy", schema)

export default Trophy
