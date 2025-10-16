import crypto from "crypto"
import cfg from "../../config/cfg"
import { IRepB, IRepTempB } from "../types/validate.types"

export const peerKey: string = crypto.randomBytes(16).toString("hex")

export const isProd: boolean = cfg.APP_PRODUCTION
export const isMidtransProd: boolean = cfg.MIDTRANS_PRODUCTION

export function genhex(): string {
  return crypto.randomBytes(8).toString("hex") + Date.now().toString(36)
}

export function rep(options: IRepTempB): IRepB {
  const repdata: IRepB = Object.assign(
    {},
    {
      ok: false,
      code: 400,
      msg: "ERROR"
    },
    typeof options === "string" ? {} : options
  )
  if (options.data && typeof options.data === "object") repdata.data = options.data
  if (options.code === 200) {
    repdata.ok = true
    if (!options.msg) repdata.msg = "OK"
  }

  return repdata
}

export function rString(n: number = 8): string {
  return crypto.randomBytes(n).toString("hex")
}

export function rNumber(n: number = 6): number {
  let a: string = ""
  for (let i: number = 1; i < n; i++) {
    a += "0"
  }
  return Math.floor(Math.random() * Number("9" + a)) + Number("1" + a)
}

export function rUid(): string {
  const rstring = rNumber(1).toString() + (Date.now() + rNumber(6)).toString(36).substring(1)
  return rstring + Date.now().toString(36)
}

export function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
