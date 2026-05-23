export interface IDonateActions {
  name: string
  method: string
  url: string
}

export interface IDonate {
  orderId: string
  owner: string
  item: string
  url: IDonateActions[]
  qr: string | null
  price: number
  expiry: number
  transaction_time: number
  transaction_status: string
}
