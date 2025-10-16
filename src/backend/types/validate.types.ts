/* eslint-disable @typescript-eslint/no-explicit-any */
export type ValidateObj = {
  [key: string]: "string" | "number" | "boolean"
}

export type ValidateArr = string[]

export type SivalType = string | number | boolean
export type ISival = any

export type IReqType = "POST" | "GET"

export interface IRepTempB {
  ok?: boolean
  code: number
  msg?: string
  data?: any
}

export interface IRepB extends IRepTempB {
  ok: boolean
  msg: string
}
