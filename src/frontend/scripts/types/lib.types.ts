export type SSKelement = HTMLElementTagNameMap[keyof HTMLElementTagNameMap]

export interface KelementAttr {
  c?: string
  class?: string
  "."?: string
  id?: string
  "#"?: string
  a?: {
    [key: string]: string | number | boolean
  }
  attr?: {
    [key: string]: string | number | boolean
  }
  child?: SSKelement | string | (SSKelement | string)[]
  e?: SSKelement | string | (SSKelement | string)[]
}
