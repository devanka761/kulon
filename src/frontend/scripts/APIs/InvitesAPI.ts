import { IInvites } from "../types/job.types"

export default class InvitesAPI {
  private data: IInvites[] = []
  get(inviteId: string, userId: string): IInvites | undefined {
    return this.data.find((invite) => invite.job.id === inviteId && invite.user.id === userId)
  }
  exists(userId: string): boolean {
    return this.data.some((invite) => invite.user.id === userId)
  }
  get getAll(): IInvites[] {
    return this.data
  }
  add(inviteData: IInvites): InvitesAPI {
    this.remove(inviteData.job.id, inviteData.user.id)
    this.data.push(inviteData)
    return this
  }
  remove(inviteId: string, userId: string): void {
    const invite = this.data.findIndex((invite) => invite.job.id === inviteId && invite.user.id === userId)
    if (invite === -1) return
    this.data.splice(invite, 1)
  }
  bulkUpdate(invites: IInvites[]): void {
    if (!Array.isArray(invites)) invites = [invites]
    invites.forEach((invite) => {
      this.add(invite)
    })
  }
  reset(): void {
    this.data.splice(0, this.data.length)
  }
}
