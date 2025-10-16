import { model, Model, Schema } from "mongoose"
import { IMetadata } from "../types/metadata.types"

export type IMetadataModel = Model<IMetadata>

const schema = new Schema(
  {
    id: { type: String },
    version: { type: Number }
  },
  {
    versionKey: false
  }
)

const Metadata: IMetadataModel = model<IMetadata>("Metadata", schema)

export default Metadata
