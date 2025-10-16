export default class BagAPI {
  constructor() {
    this.data = []
  }
  get(id) {
    return this.data.find((item) => item.id === id && (!item.expiry || item.expiry > Date.now()))
  }
  find(itemId) {
    return this.data.filter((item) => item.itemId === itemId && (!item.expiry || item.expiry > Date.now()))
  }
  findOne(itemId) {
    return this.data.find((item) => item.itemId === itemId && (!item.expiry || item.expiry > Date.now()))
  }
  get getAll() {
    return this.data.filter((item) => !item.expiry || item.expiry > Date.now())
  }
  add(itemData) {
    this.data.push(itemData)
    return this
  }
  remove(id) {
    const itemIndex = this.data.findIndex((item) => item.id === id)
    if (itemIndex === -1) return
    this.data.splice(itemIndex, 1)
  }
  update(itemData) {
    if (!itemData) return
    const itemIndex = this.data.findIndex((item) => item.id === itemData.id)
    if (itemIndex === -1) return this.add(itemData)
    this.data[itemIndex].amount = itemData.amount
  }
  bulkUpdate(items) {
    if (!Array.isArray(items)) items = [items]
    items.forEach((item) => {
      this.update(item)
    })
  }
  reset() {
    this.data.splice(0, this.data.length)
  }
}
