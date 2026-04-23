export type AccountProvider = "google" | "discord" | "github" | "tiktok" | "facebook" | "luunna" | "kulon" | "anonymous"

export interface IExternalAccountData {
  externalId: string
  email: string
  provider: AccountProvider
  name?: string
}

export interface IExternalAccount {
  id: string
  data: IExternalAccountData[]
  created: number
}

export interface IAccountSession {
  id: string
  created: number
}

export interface IAccount {
  id: string
  externalId: string
  email: string
  created: number
  anon?: number
}

export type IAccountTemp = Partial<IAccount>

export interface IAccountSafe {
  id: string
  email: string
  lunaId: string
}

export interface IExchange {
  item_id: string
  amount: number
}

export interface IShopItem {
  _n: string
  id: string
  group: string
  req: string
  amount: number
  price: number
  bonus?: number
}
