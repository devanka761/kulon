import cfg from "../../config/cfg"
import xhr from "./xhr"

const COLORS = {
  BLURPLE: 5793265,
  RED: 16739950,
  LIME: 7130225,
  YELLOW: 13283420,
  FUCHSIA: 15418781,
  CYAN: 65535
}

interface IDiscordField {
  name: string
  value: string
  inline?: boolean
}

interface IDiscordInput {
  title?: string
  description?: string
  theme?: keyof typeof COLORS
  author?: { name: string }
  footer?: { text: string }
  fields?: IDiscordField[]
  ts?: boolean
}

interface IDiscordMessage extends IDiscordInput {
  color?: number
  timestamp?: Date
}

export default async function webhook(channel: string, message: IDiscordInput): Promise<void> {
  if (!cfg.USE_WEBHOOK) return
  if (!cfg.APP_PRODUCTION) channel = cfg.DISCORD_DEV

  const data: IDiscordMessage = { ...message }

  if (data.theme) {
    data.color = COLORS[data.theme]
    delete data.theme
  }
  if (data.ts) {
    data.timestamp = new Date()
    delete data.ts
  }

  const webhookData = { embeds: [data] }

  const authorization = `Bot ${cfg.DISCORD_BOT_TOKEN}`

  return await xhr.post(`https://discord.com/api/channels/${channel}/messages`, authorization, webhookData)
}
