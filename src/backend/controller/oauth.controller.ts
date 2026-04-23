/* eslint-disable @typescript-eslint/no-explicit-any */
import cfg from "../../config/cfg"
import { isProd, toBase64 } from "../lib/generators"
import xhr from "../lib/xhr"
import { AccountProvider } from "../types/account.types"
import { IQueryParam } from "../types/auth.types"
import { ISival } from "../types/validate.types"

const HOST: string = isProd ? `https://${cfg.APP_HOST}` : `http://localhost:${cfg.APP_PORT}`

const CallBackURL: Record<string, ISival> = {
  luunna(state: string) {
    return `https://devanka.id/luunna/portal?luna=${state}`
  },
  google(state: string) {
    return `https://devanka.id/luunna/google?luna=${state}`
  },
  github(state: string) {
    return `https://devanka.id/luunna/github?luna=${state}`
  },
  discord(state: string) {
    return `https://devanka.id/luunna/discord?luna=${state}`
  },
  facebook(state: string) {
    return `https://devanka.id/luunna/facebook?luna=${state}`
  }
}

export function isProviderValid(provider: string, useIngetYa?: boolean): boolean {
  const valid_provider: AccountProvider[] = ["google", "github", "discord", "facebook", "luunna"]
  if (useIngetYa) valid_provider.push("kulon")
  if (valid_provider.find((k) => k === provider)) return true
  return false
}

export function getOAuthUrl(provider: AccountProvider, queries: IQueryParam) {
  const stateData = {
    client: `${HOST}/x/auth/luunna/redirect`,
    lang: typeof queries.locale === "string" && queries.locale === "en" ? "en" : "id"
  }

  const state = toBase64(stateData)

  const redirectUrl = CallBackURL[provider](state)
  return redirectUrl
}

export async function getOAuthUser(code: string): Promise<any> {
  const token = `Token ${cfg.LUNA_SECRET}`
  const user = await xhr.post("https://devanka.id/luunna/oauth/zzz", token, {
    code
  })
  return user
}
