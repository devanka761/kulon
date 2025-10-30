import { IRepTempB, ISival } from "../types/validate.types"
import { shop_items, cloud_items } from "../lib/shared"
import Account from "../models/AccountModel"
import { IAccount } from "../types/account.types"
import { isMidtransProd } from "../lib/generators"
import xhr from "../lib/xhr"
import cfg from "../../config/cfg"
import Donate from "../models/DonateModel"
import { IDonate } from "../types/donate.types"
import Mail from "../models/MailModel"
import zender from "../lib/zender"
import webhook from "../lib/webhook"

interface IMidtransRequest {
  url: string
  authorization: string
}

function encodeMidtrans(): IMidtransRequest {
  const url = isMidtransProd ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com"
  const SERVER_KEY = cfg[`${isMidtransProd ? "PR" : "SB"}_MIDTRANS_SERVER_KEY`]
  const authorization = Buffer.from(`${SERVER_KEY}:`).toString("base64")

  return { url: `${url}/v2`, authorization }
}

const DONATE_KEYS = ["expiry_time", "transaction_time", "transaction_status"]
const CHARGE_KEYS = ["actions", "qr_string"]

const STATUS = {
  cancel: "CANCELED",
  expire: "EXPIRED",
  settlement: "PAID"
}

export async function createDonate(uid: string, itemId: string): Promise<IRepTempB> {
  const item = shop_items.find((itm) => itm._n === itemId && itm.group === "9")
  if (!item) return { code: 400, msg: "DN_ITM_NOT_VALID" }

  const benefit = cloud_items.find((itm) => itm.id === item.id)
  if (!benefit) return { code: 400, msg: "DN_ITM_NOT_VALID" }

  const hasActive = await Donate.findOne({ owner: uid }).lean()
  if (hasActive) return { code: 401, msg: "DN_PENDING", data: hasActive }

  const account = (await Account.findOne({ id: uid }).lean()) as IAccount

  const order_id = "kln-" + Date.now().toString(36)

  const options = {
    payment_type: "qris",
    transaction_details: { order_id: order_id, gross_amount: item.price },
    item_details: [{ price: item.price, quantity: 1, name: benefit.name.id }],
    customer_details: { userid: uid, email: account.data.email },
    custom_expiry: { expiry_duration: 360 },
    qris: { acquirer: "gopay" }
  }

  const midtrans = encodeMidtrans()
  const res = await xhr.post(`${midtrans.url}/charge`, midtrans.authorization, options)
  if (res.error) {
    return { code: 500 }
  }

  const responseKeys = Object.keys(res)
  if ([...DONATE_KEYS, ...CHARGE_KEYS].find((itm) => !responseKeys.find((k) => itm === k))) {
    return { code: 500 }
  }

  const donate: IDonate = {
    orderId: order_id,
    owner: uid,
    item: item._n,
    price: item.price,
    url: res.actions || [],
    qr: res.qr_string || null,
    expiry: new Date(res.expiry_time).getTime(),
    transaction_time: new Date(res.transaction_time).getTime(),
    transaction_status: res.transaction_status
  }

  await Donate.create(donate)

  webhook(cfg.DISCORD_DONATION, {
    description: `${order_id.toUpperCase()}: Rp${item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`,
    theme: "BLURPLE",
    author: { name: `ID ${uid}` },
    footer: { text: "CREATED" },
    ts: true
  })

  return { code: 200, data: donate }
}

export async function updateDonate(s: ISival): Promise<void> {
  if (!s.order_id) return

  const midtrans = encodeMidtrans()
  const res = await xhr.get(`${midtrans.url}/${s.order_id}/status`, midtrans.authorization)
  if (res.error) return

  const responseKeys = Object.keys(res)
  const notValid = DONATE_KEYS.find((itm) => !responseKeys.find((k) => itm === k))
  console.log(notValid)
  if (notValid) {
    return
  }

  const order = await Donate.findOne({ orderId: s.order_id })

  if (!order) return
  const uid = order.owner

  const item = shop_items.find((itm) => itm._n === order.item)
  if (!item) return

  if (order.transaction_status === res.transaction_status) return

  if (res.transaction_status === "cancel" || res.transaction_status === "expire") {
    await order.deleteOne()
  } else if (res.transaction_status === "settlement") {
    const mail_data = {
      id: `donate-${s.order_id}-${Date.now().toString()}`,
      owner: uid,
      ts: Date.now(),
      title: { en: "THANKS!", id: "MAKASIH!" },
      sub: { en: "Server", id: "Server" },
      text: {
        en: "Hello, there! Thank you for supporting Kulon and being part of the growth! Here are rewards as our appreciation as promised.\nENJOY!!",
        id: "Gokil! Makasih ya udah support dan menjadi bagian dari perkembangan Kulon. Terimalah sedikit hadiah berikut sebagai bentuk apresiasi seperti yang udah dijanjikan.\nENJOY!!"
      },
      rewards: [{ id: item.id, amount: item.amount + (item.bonus || 0) }]
    }

    await Mail.create(mail_data)
    zender("system", uid, "donateSettlement", { mail: mail_data })
    await order.deleteOne()
  }

  webhook(cfg.DISCORD_DONATION, {
    theme: "RED",
    footer: { text: res.transaction_status === "cancel" ? "CANCELED" : "EXPIRED" }
  })
  const statusKey = res.transaction_status as keyof typeof STATUS
  if (!STATUS[statusKey]) return

  webhook(cfg.DISCORD_DONATION, {
    description: `${s.order_id.toUpperCase()}: Rp${item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`,
    theme: res.transaction_status === "settlement" ? "LIME" : "RED",
    author: { name: `ID ${uid}` },
    footer: { text: STATUS[statusKey] },
    ts: true
  })
}
