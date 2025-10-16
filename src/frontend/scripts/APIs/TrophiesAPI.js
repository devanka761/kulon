export default class TrophiesAPI {
  constructor() {
    this.data = []
  }
  get(trophyId) {
    return this.data.find((trophy) => trophy.id === trophyId)
  }
  isDone(trophyId) {
    return this.data.some((trophy) => trophy.id === trophyId && trophy.ts)
  }
  get getAll() {
    return this.data
  }
  get doneList() {
    return this.data.filter((trophy) => trophy.ts)
  }
  get unclaimeds() {
    return this.data.filter((trophy) => trophy.ts && !trophy.claimed)
  }
  add(trophyData) {
    this.data.push(trophyData)
    return this
  }
  remove(trophyId) {
    const trophy = this.data.findIndex((trophy) => trophy.id === trophyId)
    if (trophy === -1) return
    this.data.splice(trophy, 1)
  }
  update(trophyData) {
    if (!trophyData) return
    delete trophyData._id
    const trophy = this.data.find((trophy) => trophy.id === trophyData.id)
    if (!trophy) return this.add(trophyData)
    Object.keys(trophyData).forEach((k) => {
      trophy[k] = trophyData[k]
    })
  }
  bulkUpdate(trophies) {
    if (!Array.isArray(trophies)) trophies = [trophies]
    trophies.forEach((trophy) => {
      this.update(trophy)
    })
  }
  reset() {
    this.data.splice(0, this.data.length)
  }
}
