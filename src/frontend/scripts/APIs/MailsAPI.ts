import { IMail } from "../types/mail.types"

export default class MailsAPI {
  private data: IMail[] = []
  get(mailId: string): IMail | undefined {
    return this.data.find((mail) => mail.id === mailId)
  }
  get getAll(): IMail[] {
    return this.data
  }
  add(mailData: IMail): MailsAPI {
    this.data.push(mailData)
    return this
  }
  remove(mailId: string): void {
    const mail = this.data.findIndex((mail) => mail.id === mailId)
    if (mail === -1) return
    this.data.splice(mail, 1)
  }
  bulkUpdate(mails: IMail[]): void {
    if (!Array.isArray(mails)) mails = [mails]
    mails.forEach((mail) => {
      this.add(mail)
    })
  }
  reset(): void {
    this.data.splice(0, this.data.length)
  }
}
