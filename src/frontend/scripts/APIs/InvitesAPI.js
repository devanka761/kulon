export default class InvitesAPI {
  constructor() {
    this.data = []
  }
  get(inviteId, userId) {
    return this.data.find((invite) => invite.job.id === inviteId && invite.user.id === userId)
  }
  get getAll() {
    return this.data
  }
  add(inviteData) {
    this.remove(inviteData.job.id, inviteData.user.id)
    this.data.push(inviteData)
    return this
  }
  remove(inviteId, userId) {
    const invite = this.data.findIndex((invite) => invite.job.id === inviteId && invite.user.id === userId)
    if (invite === -1) return
    this.data.splice(invite, 1)
  }
  bulkUpdate(invites) {
    if (!Array.isArray(invites)) invites = [invites]
    invites.forEach((invite) => {
      this.add(invite)
    })
  }
  reset() {
    this.data.splice(0, this.data.length)
  }
}
