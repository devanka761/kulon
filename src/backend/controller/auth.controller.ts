import fs from "fs"
import nodemailer, { Transporter } from "nodemailer"
import { isProd, rNumber } from "../lib/generators"
import validate from "../lib/validate"
import cfg from "../../config/cfg"
import { AccountProvider, IAccount, IAccountData } from "../types/account.types"
import { IRepTempB, ISival } from "../types/validate.types"
import Auth from "../models/AuthModel"
import Account from "../models/AccountModel"
import guest from "../main/guests"
import webhook from "../lib/webhook"

export async function authLogin(s: ISival): Promise<IRepTempB> {
  if (!validate(["email"], s)) return { code: 400, msg: "AUTH_ERR_01" }
  s.email = s.email.toString().toLowerCase()
  const mailValid = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g
  if (!s.email.match(mailValid)) return { code: 400, msg: "AUTH_ERR_02" }

  let gencode: number = rNumber(6)
  const expiry = Date.now() + 1000 * 60 * 10

  const existingAuth = await Auth.findOne({ email: s.email })

  if (existingAuth) {
    if (!existingAuth.deleting && existingAuth.rate >= 3) {
      existingAuth.deleting = true
      await existingAuth.save()
      setTimeout(async () => {
        await existingAuth.deleteOne()
      }, 1000 * 10)
    }

    if (existingAuth.rate >= 3) {
      return { code: 429, msg: "AUTH_RATE_LIMIT" }
    }

    existingAuth.rate += 1
    existingAuth.otp.expiry = expiry
    await existingAuth.save()
    gencode = Number(existingAuth.otp.code)
  } else {
    await Auth.create({
      email: s.email,
      otp: {
        code: gencode,
        expiry: expiry
      },
      rate: 0,
      cd: 0
    })
  }
  console.log(gencode, s.email)
  if (isProd) {
    emailCode(s.email, gencode.toString())
  }

  webhook(cfg.DISCORD_ACCOUNTLOG, {
    description: "Trying to `LOGIN`",
    theme: "BLURPLE",
    fields: [{ name: "Email", value: s.email }]
  })

  return { code: 200, msg: "OK", data: { email: s.email } }
}

export async function authVerify(s: ISival): Promise<IRepTempB> {
  if (!validate(["email", "code"], s)) return { code: 404 }
  s.email = s.email.toString().toLowerCase()
  const mailValid = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g
  if (!s.email.match(mailValid)) return { code: 404, msg: "AUTH_ERR_02" }
  s.code = Number(s.code)

  const existingAuth = await Auth.findOne({ email: s.email })

  if (!existingAuth) {
    return { code: 404, msg: "AUTH_ERR_03" }
  }

  webhook(cfg.DISCORD_ACCOUNTLOG, {
    description: "Trying to `VERIFY`",
    theme: "BLURPLE",
    fields: [
      { name: "Email", value: s.email },
      { name: "Code", value: s.code },
      { name: "Attemp", value: `${existingAuth.cd + 1}` }
    ]
  })

  if (!existingAuth.deleting && existingAuth.cd >= 4) {
    existingAuth.deleting = true
    await existingAuth.save()
    setTimeout(async () => {
      await existingAuth.deleteOne()
    }, 1000 * 10)
  }

  if (existingAuth.cd >= 4) {
    return { code: 429, msg: "AUTH_RATE_LIMIT" }
  }

  if (existingAuth.otp.code !== s.code) {
    existingAuth.cd += 1
    await existingAuth.save()
    return { code: 404, msg: "AUTH_ERR_04" }
  }

  if (existingAuth.otp.expiry < Date.now()) {
    return { code: 404, msg: "AUTH_ERR_05", data: { restart: 1 } }
  }

  return await processUser(s.email)
}

export async function processUser(email: string): Promise<IRepTempB> {
  const provider: AccountProvider = "kulon"

  const existingAccount = await Account.findOne({ "data.email": email, "data.provider": provider }).lean()

  if (existingAccount) {
    await Auth.deleteOne({ email: email })
    return { code: 200, data: { user: existingAccount } }
  }

  const userId = "7" + rNumber(5).toString() + guest.userNumber().toString()

  const newAccount: IAccount = {
    id: userId,
    data: {
      id: userId,
      email: email,
      provider: provider
    }
  }

  await Account.create(newAccount)
  await Auth.deleteOne({ email: email })

  webhook(cfg.DISCORD_ACCOUNTLOG, {
    title: `Registerd: ID ${userId}`,
    theme: "LIME",
    fields: [
      { name: "Linked Email", value: email },
      { name: "Linked Provider", value: provider },
      { name: "Linked ID", value: userId }
    ]
  })

  return { code: 200, data: { user: newAccount } }
}

export async function processThirdParty(s: { user: IAccountData; provider: string }): Promise<IRepTempB> {
  const existingAccount = await Account.findOne({ "data.email": s.user.email, "data.provider": s.provider }).lean()

  if (existingAccount) {
    return { code: 200, data: { user: existingAccount } }
  }

  const userId = "7" + rNumber(5).toString() + guest.userNumber().toString()

  const newAccount: IAccount = {
    id: userId,
    data: {
      id: s.user.id,
      email: s.user.email,
      provider: s.provider as AccountProvider
    }
  }
  await Account.create(newAccount)

  webhook(cfg.DISCORD_ACCOUNTLOG, {
    title: `Registerd: ID ${userId}`,
    theme: "LIME",
    fields: [
      { name: "Linked Email", value: s.user.email },
      { name: "Linked Provider", value: s.provider },
      { name: "Linked ID", value: s.user.id }
    ]
  })

  return { code: 200, data: { user: newAccount } }
}

export async function processAnonymous(ip: string): Promise<IRepTempB> {
  const existingAccount = await Account.findOne({ "data.email": ip, "data.provider": "anonymous" }).lean()

  if (existingAccount) return { code: 200, data: { user: existingAccount } }

  const currAnon = await guest.anonNumber()
  if (currAnon >= 10) return { code: 404, msg: "AUTH_TOO_MANY_ANONS" }

  const userId = "99" + rNumber(3).toString() + guest.userNumber().toString()

  const expiry = Date.now() + 1000 * 60 * 60 * 24

  const newAccount: IAccount = {
    id: userId,
    data: {
      id: userId,
      email: ip,
      provider: "anonymous"
    },
    anon: expiry
  }
  await Account.create(newAccount)

  webhook(cfg.DISCORD_ACCOUNTLOG, {
    title: `Temporary: ID ${userId}`,
    theme: "LIME",
    fields: [
      { name: "Guest IP", value: ip },
      { name: "Guest Expiry", value: new Date(expiry).toLocaleString() }
    ]
  })

  return { code: 200, data: { user: newAccount } }
}

const emailQueue: { index: number; done: number } = { index: 0, done: 0 }

function emailCode(user_email: string, gen_code: string): void {
  emailQueue.index++
  sendEmailCode(emailQueue.index, user_email, gen_code)
}

function sendEmailCode(emailIndex: number, user_email: string, gen_code: string) {
  if (emailQueue.done + 1 !== emailIndex) {
    return setTimeout(() => sendEmailCode(emailIndex, user_email, gen_code), 200)
  }

  const transport: Transporter = nodemailer.createTransport({
    host: <string>cfg.SMTP_HOST,
    port: <number>cfg.SMTP_PORT,
    auth: {
      user: <string>cfg.SMTP_USER,
      pass: <string>cfg.SMTP_PASS
    }
  })

  const email_file = fs
    .readFileSync("./src/backend/templates/email_otp.txt", "utf-8")
    .replace(/{GEN_CODE}/g, gen_code)
    .replace(/{YEAR}/g, new Date().getFullYear().toString())

  transport
    .sendMail({
      from: `"Kulon" <${cfg.SMTP_USER}>`,
      to: user_email,
      subject: `Your login code is ${gen_code}`,
      html: email_file
    })
    .catch((err) => {
      console.error(err)
    })
    .finally(() => {
      transport.close()
      emailQueue.done++
      if (emailQueue.done === emailQueue.index) {
        emailQueue.index = 0
        emailQueue.done = 0
      }
    })
}
