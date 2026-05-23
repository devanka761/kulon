import { isProd, rNumber, toBase64 } from "../lib/generators"
import validate from "../lib/validate"
import cfg from "../../config/cfg"
import { IAccount, IExternalAccount } from "../types/AccountTypes"
import { IRepTempB, IAny } from "../types/ValidateTypes"
import Account from "../models/AccountModel"
import guest from "../main/guests"
import webhook from "../lib/webhook"

const HOST: string = isProd ? `https://${cfg.APP_HOST}` : `http://localhost:${cfg.APP_PORT}`

export async function authLogin(s: IAny): Promise<IRepTempB> {
  if (!validate(["email"], s)) return { code: 400, msg: "AUTH_ERR_01" }
  s.email = s.email.toString().toLowerCase()
  const mailValid = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g
  if (!s.email.match(mailValid)) return { code: 400, msg: "AUTH_ERR_02" }

  const stateData = {
    client: `${HOST}/x/auth/luunna/redirect`,
    initialEmail: s.email,
    lang: typeof s.lang === "string" && s.lang === "en" ? "en" : "id",
    s: "1"
  }

  const state = toBase64(stateData)

  const url = `https://devanka.id/luunna/portal?luna=${state}`

  return { code: 200, msg: "OK", data: { url } }
}

export async function processThirdParty(usr: IExternalAccount): Promise<IRepTempB> {
  const existingAccount = await Account.findOne({ externalId: usr.id }).lean()

  if (existingAccount) {
    return { code: 200, data: { user: existingAccount } }
  }

  const userId = "7" + rNumber(5).toString() + guest.userNumber().toString()

  const newAccount: IAccount = {
    id: userId,
    externalId: usr.id,
    email: `usr${usr.id}@luna.devanka.id`,
    created: Date.now()
  }
  await Account.create(newAccount)

  const providersText = usr.data.map((data) => `**ID** ${data.externalId}\n**Email** (${data.provider})\n${data.email}\n**Nickname**\n${data.name || "-"}`)

  webhook("accounts", {
    title: "Registered",
    description: `**ID** ${userId}\n**Luna** ${usr.id}\n\n${providersText.join("\n\n")}`,
    theme: "LIME",
    ts: true
  })

  return { code: 200, data: { user: newAccount } }
}

export async function processAnonymous(ip: string): Promise<IRepTempB> {
  const existingAccount = await Account.findOne({
    email: ip,
    anon: { $gt: Date.now() }
  }).lean()

  if (existingAccount) return { code: 200, data: { user: existingAccount } }

  const currAnon = await guest.anonNumber()
  if (currAnon >= 10) return { code: 404, msg: "AUTH_TOO_MANY_ANONS" }

  const userId = "99" + rNumber(3).toString() + guest.userNumber().toString()

  const expiry = Date.now() + 1000 * 60 * 60 * 24

  const newAccount: IAccount = {
    id: userId,
    email: ip,
    externalId: "-",
    created: Date.now(),
    anon: expiry
  }
  await Account.create(newAccount)

  webhook(cfg.DISCORD_ACCOUNTLOG, {
    title: `Temporary: ID ${userId}`,
    theme: "LIME",
    fields: [
      { name: "Guest IP", value: ip },
      { name: "Guest Expiry", value: new Date(expiry).toLocaleString() }
    ]
  })

  return { code: 200, data: { user: newAccount } }
}
