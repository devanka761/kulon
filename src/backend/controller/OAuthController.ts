/* eslint-disable @typescript-eslint/no-explicit-any */
import cfg from "../../config/cfg"
import { isProd, toBase64 } from "../lib/generators"
import { AccountProvider } from "../types/AccountTypes"
import { IQueryParam } from "../types/AuthTypes"
import { IAny } from "../types/ValidateTypes"

const HOST: string = isProd ? `https://${cfg.APP_HOST}` : `http://localhost:${cfg.APP_PORT}`

const PROV_HOST = isProd ? "https://devanka.id" : "http://localhost:3000"

const CallBackURL: Record<string, IAny> = {
  luunna(queryString: string) {
    return `${PROV_HOST}/luna/authorize?${queryString}`
  },
  google(queryString: string) {
    return `${PROV_HOST}/luna/google?${queryString}`
  },
  github(queryString: string) {
    return `${PROV_HOST}/luna/github?${queryString}`
  },
  discord(queryString: string) {
    return `${PROV_HOST}/luna/discord?${queryString}`
  },
  facebook(queryString: string) {
    return `${PROV_HOST}/luna/facebook?${queryString}`
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
    client_id: cfg.LUNA_CLIENT_ID,
    redirect_uri: `${HOST}/x/auth/luunna/redirect`,
    lang: typeof queries.locale === "string" && queries.locale === "en" ? "en" : "id",
    state: toBase64(queries)
  }

  const queryString = new URLSearchParams(stateData).toString()

  const redirectUrl = CallBackURL[provider](queryString)
  return redirectUrl
}

export async function getOAuthUser(code: string): Promise<any> {
  const getAccess = await fetch(`${PROV_HOST}/luna/api/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: cfg.LUNA_CLIENT_ID,
      client_secret: cfg.LUNA_CLIENT_SECRET,
      code: code,
      redirect_uri: `${HOST}/x/auth/luunna/redirect`,
      grant_type: "authorization_code"
    })
  })
    .then((res) => res.json())
    .then((res) => res)
    .catch((err) => {
      return { ok: false, errors: err, error: true }
    })
  if (!getAccess.access_token) return getAccess
  const userInfo = await fetch(`${PROV_HOST}/luna/api/v1/user`, {
    method: "GET",
    headers: { Authorization: `Bearer ${getAccess.access_token}` }
  })
    .then((res) => res.json())
    .then((res) => res)
    .catch((err) => {
      return { ok: false, errors: err, error: true }
    })
  return userInfo
}
