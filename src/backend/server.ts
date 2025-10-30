import app from "./app"
import cfg from "../config/cfg"
import logger from "./main/logger"
import MongoConnection from "./main/database"
import guest from "./main/guests"

const PORT = cfg.APP_PORT

async function startServer() {
  await guest.load()
  app.listen(PORT, () => {
    logger.success(`HOMEPAGE >> http://localhost:${PORT}`)
    logger.success(`APP >> http://localhost:${PORT}/app?s=1&pwa=normal`)
    logger.success(`SOCKET >> ws://localhost:${PORT}/socket`)
    logger.success("Running ✔✔✔")
    console.log(" ")
    console.log(" ")
    console.log("Kulon is licensed under")
    console.log("The GNU General Public License v3.0")
    console.log(" ")
    console.log("https://www.gnu.org/licenses/gpl-3.0.html#license-text")
    console.log(" ")
    console.log(" ")
  })
}

const mongoConnection = new MongoConnection(cfg.DB_URI, cfg.DB_NAME)
mongoConnection.connect(startServer)
