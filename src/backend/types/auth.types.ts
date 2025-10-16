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
