/* eslint-disable @typescript-eslint/no-explicit-any */
import cfg from "../../config/cfg"
import { isProd } from "../lib/generators"
import { IQueryParam } from "../types/auth.types"

const HOST: string = isProd ? `https://${cfg.APP_HOST}` : `http://localhost:${cfg.APP_PORT}`

const CallBackURL = {
  google: {
    prod(state: string): string {
      return `https://accounts.google.com/o/oauth2/auth?redirect_uri=https%3A%2F%2Fkulon.devanka.id%2Fx%2Fauth%2Fgoogle%2Fredirect&client_id=${cfg.GOOGLE_CLIENT_ID}&access_type=offline&response_type=code&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&state=${state}`
    },
    dev(state: string): string {
      return `https://accounts.google.com/o/oauth2/auth?redirect_uri=http%3A%2F%2Flocalhost%3A9000%2Fx%2Fauth%2Fgoogle%2Fredirect&client_id=${cfg.GOOGLE_CLIENT_ID}&access_type=offline&response_type=code&prompt=consent&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&state=${state}`
    }
  },
  github: {
    prod(state: string): string {
      return `https://github.com/login/oauth/authorize?client_id=${cfg.GITHUB_CLIENT_ID}&scope=read%3Auser%20user%3Aemail&state=${state}`
    },
    dev(state: string): string {
      return `https://github.com/login/oauth/authorize?client_id=${cfg.GITHUB_CLIENT_ID}&scope=user%3Aemail&state=${state}`
    }
  },
  discord: {
    prod(state: string): string {
      return `https://discord.com/oauth2/authorize?client_id=${cfg.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=https%3A%2F%2Fkulon.devanka.id%2Fx%2Fauth%2Fdiscord%2Fredirect&scope=identify+email&state=${state}`
    },
    dev(state: string): string {
      return `https://discord.com/oauth2/authorize?client_id=${cfg.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A9000%2Fx%2Fauth%2Fdiscord%2Fredirect&scope=identify+email&state=${state}`
    }
  }
}

const RedirectURL: { [key: string]: (v: string) => Promise<any> } = {
  async google(code: string): Promise<any> {
    const getAccess = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: cfg.GOOGLE_CLIENT_ID,
        client_secret: cfg.GOOGLE_CLIENT_SECRET,
        code: code,
        redirect_uri: `${HOST}/x/auth/google/redirect`,
        grant_type: "authorization_code"
      })
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((err) => {
        return { ok: false, errors: err, error: true }
      })
    if (!getAccess.access_token) return getAccess
    const userInfo = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=${getAccess.access_token}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${getAccess.id_token}` }
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((err) => {
        return { ok: false, errors: err, error: true }
      })
    if (!userInfo || userInfo.errors) return userInfo
    return { ok: true, data: userInfo, provider: "google" }
  },
  async github(code: string): Promise<any> {
    const getAccess = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: cfg.GITHUB_CLIENT_ID,
        client_secret: cfg.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: `https://kulon.devanka.id/x/auth/github/redirect`
      })
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((err) => {
        return { ok: false, errors: err, error: true }
      })
    if (!getAccess.access_token) return getAccess
    const userInfo = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: { Authorization: `Bearer ${getAccess.access_token}` }
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((err) => {
        return { ok: false, errors: err, error: true }
      })
    if (!userInfo || userInfo.errors) return userInfo
    const userEmails: any[] = await fetch("https://api.github.com/user/emails", {
      method: "GET",
      headers: { Authorization: `Bearer ${getAccess.access_token}` }
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((err) => {
        return { ok: false, errors: err, error: true }
      })
    const userEmail = userEmails.find((snap) => snap.primary)?.email || null
    userInfo.email = userEmail

    return { ok: true, data: userInfo, provider: "github" }
  },
  async discord(code: string): Promise<any> {
    const getAccess = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: <string>cfg.DISCORD_CLIENT_ID,
        client_secret: <string>cfg.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${HOST}/x/auth/discord/redirect`
      })
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((err) => {
        return { ok: false, errors: err, error: true }
      })
    if (!getAccess.access_token) return getAccess
    const userInfo = await fetch("https://discord.com/api/v10/users/@me", {
      method: "GET",
      headers: { Authorization: `Bearer ${getAccess.access_token}` }
    })
      .then((res) => res.json())
      .then((res) => res)
      .catch((err) => {
        return { ok: false, errors: err, error: true }
      })
    if (!userInfo || userInfo.errors) return userInfo
    return { ok: true, data: userInfo, provider: "discord" }
  }
}

export function isProviderValid(provider: string): boolean {
  const valid_provider: string[] = ["google", "github", "discord"]
  if (valid_provider.find((k) => k === provider)) return true
  return false
}
export function getOAuthUrl(provider: "google" | "github" | "discord", queries: IQueryParam) {
  const state = Buffer.from(JSON.stringify(queries)).toString("base64")
  const redirectUrl = CallBackURL[provider][isProd ? "prod" : "dev"](state)
  return redirectUrl
}
export async function getOAuthUser({ code, provider }: { code: string; provider: string }): Promise<any> {
  const userData = await RedirectURL[provider](code)
  return userData
}
