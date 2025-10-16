export default class MailsAPI {
  constructor() {
    this.data = []
  }
  get(mailId) {
    return this.data.find((mail) => mail.id === mailId)
  }
  get getAll() {
    return this.data
  }
  add(mailData) {
    this.data.push(mailData)
    return this
  }
  remove(mailId) {
    const mail = this.data.findIndex((mail) => mail.id === mailId)
    if (mail === -1) return
    this.data.splice(mail, 1)
  }
  bulkUpdate(mails) {
    if (!Array.isArray(mails)) mails = [mails]
    mails.forEach((mail) => {
      this.add(mail)
    })
  }
  reset() {
    this.data.splice(0, this.data.length)
  }
}
