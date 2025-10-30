export type AccountProvider = "google" | "github" | "discord" | "kulon" | "anonymous"

export interface IAccountData {
  id: string
  email: string
  provider: AccountProvider
}

export interface IAccount {
  id: string
  data: IAccountData
  anon?: number
}

export interface IAccountTemp {
  id?: string
  data: Partial<IAccountData>
  anon?: number
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
