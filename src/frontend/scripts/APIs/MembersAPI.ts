import peers from "../data/Peers"
import MemberBuilder from "./MemberBuilder"

export default class MembersAPI {
  private data: MemberBuilder[] = []
  get(memberId: string): MemberBuilder[] {
    return this.data.filter((member) => member.id === memberId)
  }
  getFriend(memberId: string): MemberBuilder | undefined {
    return this.data.find((member) => member.id === memberId && member.type === "friend")
  }
  getCrew(memberId: string): MemberBuilder | undefined {
    return this.data.find((member) => member.id === memberId && member.type === "crew")
  }
  get getAll(): MemberBuilder[] {
    return this.data
  }
  getMembersByBoard(boardIndex: number): MemberBuilder[] {
    if (boardIndex === 1) {
      return this.data.filter((member) => member.type === "crew")
    } else if (boardIndex === 2) {
      return this.data.filter((member) => member.type === "friend")
    }
    return []
  }
  add(...memberData: MemberBuilder[]): MembersAPI {
    memberData.forEach((member) => {
      this.data.push(member)
    })
    return this
  }
  removeOne(memberType: string, memberId: string): void {
    const member = this.data.find((member) => member.type === memberType && member.id === memberId)
    if (!member) return
    member.destroy()
    peers.close(memberId)
    this.data.splice(this.data.indexOf(member), 1)
  }
  remove(memberId: string): void {
    const members = this.get(memberId)
    members.forEach((member, idx) => {
      member.destroy()
      this.data.splice(idx, 1)
    })
  }
  reset(): void {
    this.data.forEach((member) => member.destroy())
    this.data.splice(0, this.data.length)
  }
}
