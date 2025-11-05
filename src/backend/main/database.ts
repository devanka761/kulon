import mongoose from "mongoose"

import logger from "./logger"

export default class MongoConnection {
  private onConnectedCallback?: () => void
  private isConnectedBefore = false
  constructor(
    private mongoUrl: string,
    private dbName: string
  ) {
    mongoose.connection.on("error", this.onError)
    mongoose.connection.on("disconnected", this.onDisconnected)
    mongoose.connection.on("connected", this.onConnected)
    mongoose.connection.on("reconnected", this.onReconnected)
  }

  public close() {
    logger.info("Closing the MongoDB conection")
    mongoose.connection.close()
  }

  public connect(onConnectedCallback?: () => void) {
    if (onConnectedCallback) {
      this.onConnectedCallback = onConnectedCallback
    }
    mongoose.connect(this.mongoUrl, { dbName: this.dbName })
    mongoose.set("toJSON", { versionKey: false, virtuals: true })
    mongoose.set("toObject", { versionKey: false, virtuals: true })
  }

  private onConnected = () => {
    this.isConnectedBefore = true
    if (this.onConnectedCallback) {
      this.onConnectedCallback()
      this.onConnectedCallback = () => logger.info("Server already listen")
    }
  }

  private onReconnected = () => {
    logger.info("Reconnected to MongoDB")
  }

  private onError = () => {
    console.error(`Could not connect to MongoDB at ${this.mongoUrl}`)
  }

  private onDisconnected = () => {
    if (!this.isConnectedBefore) {
      logger.info("Retrying MongoDB connection")
      setTimeout(() => {
        this.connect()
      }, 2000)
    }
  }
}
