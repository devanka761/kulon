import peers from "../data/Peers"

export default class MembersAPI {
  constructor() {
    this.data = []
  }
  get(memberId) {
    return this.data.filter((member) => member.id === memberId)
  }
  getFriend(memberId) {
    return this.data.find((member) => member.id === memberId && member.type === "friend")
  }
  getCrew(memberId) {
    return this.data.find((member) => member.id === memberId && member.type === "crew")
  }
  get getAll() {
    return this.data
  }
  getMembersByBoard(boardIndex) {
    if (boardIndex === 1) {
      return this.data.filter((member) => member.type === "crew")
    } else if (boardIndex === 2) {
      return this.data.filter((member) => member.type === "friend")
    }
    return []
  }
  add(...memberData) {
    memberData.forEach((member) => {
      this.data.push(member)
    })
    return this
  }
  removeOne(memberType, memberId) {
    const member = this.data.find((member) => member.type === memberType && member.id === memberId)
    if (!member) return
    member.destroy()
    peers.remove(memberId)
    this.data.splice(this.data.indexOf(member), 1)
  }
  remove(memberId) {
    const members = this.get(memberId)
    members.forEach((member, idx) => {
      member.destroy()
      this.data.splice(idx, 1)
    })
  }
  reset() {
    this.data.forEach((member) => member.destroy())
    this.data.splice(0, this.data.length)
  }
}
