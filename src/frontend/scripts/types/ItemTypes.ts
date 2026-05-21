export interface IItem {
  id: string
  itemId?: string
  amount: number
  expiry?: number
  placeholder?: number
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

export interface ICloudItem {
  id: string
  name: {
    id: string
    en: string
  }
  desc: {
    id: string
    en: string
  }
  src: string
  run?: string
  tempable?: boolean
  group: string
}
