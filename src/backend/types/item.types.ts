export interface IItem {
  owner: string
  id: string
  itemId: string
  amount: number
  expiry?: number
}

export interface IReturnItem extends IItem {
  placeholder?: number
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
  run: string
  tempable: true
  group: string
}
