export default class WaitingAPI {
  constructor() {
    this.data = []
  }
  add(data) {
    this.data.push({ ...data, ts: Date.now() })
  }
  get(dataId) {
    return this.data.find((data) => data.id === dataId)
  }
  getMany(dataId) {
    return this.data.filter((data) => data.id === dataId)
  }
  getAll() {
    return this.data.sort((a, b) => {
      if (a.ts > b.ts) return 1
      if (a.ts < b.ts) return -1
      return 0
    })
  }
  remove(dataId) {
    const index = this.data.findIndex((data) => data.id === dataId)
    if (index === -1) return
    this.data.splice(index, 1)
  }
  removeMany(dataId) {
    this.data = this.data.filter((data) => data.id !== dataId)
  }
  reset() {
    this.data.splice(0, this.data.length)
  }
}
