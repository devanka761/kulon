export interface IAuth {
  email: string
  otp: {
    code: string | number
    expiry: number
  }
  deleting?: boolean
  rate: number
  cd: number
}

// export interface IQueryParam {
//   s?: string
//   r?: string
//   pwa?: string
// }

export type IQueryParam = Record<string, string | number | boolean | null>
