import { ILocale } from "./lib.types"

export interface ISettingGroup {
  id: string
  icon: string
  name: ILocale
}

export interface ISettingSelect {
  id: string
  label: string
}

export interface ISettingList {
  id: string
  group: string
  type: string
  breaker?: boolean // optional
  name: ILocale

  default?: number | string | boolean
  func?: string
  uniq?: string

  min?: number
  max?: number
  step?: number

  cl?: "br"
  value?: ILocale
  saveId?: "lang"
  label?: ILocale
  list: ISettingSelect[]
}

export interface ISetting {
  groups: ISettingGroup[]
  items: ISettingList[]
}
