import { IItem } from "../types/item.types"

export default class BagAPI {
  private data: IItem[] = []
  get(id: string): IItem | undefined {
    return this.data.find((item) => item.id === id && (!item.expiry || item.expiry > Date.now()))
  }
  find(itemId: string): IItem[] {
    return this.data.filter((item) => item.itemId === itemId && (!item.expiry || item.expiry > Date.now()))
  }
  findOne(itemId: string): IItem | undefined {
    return this.data.find((item) => item.itemId === itemId && (!item.expiry || item.expiry > Date.now()))
  }
  get getAll(): IItem[] {
    return this.data.filter((item) => !item.expiry || item.expiry > Date.now())
  }
  add(itemData: IItem): BagAPI {
    this.data.push(itemData)
    return this
  }
  remove(id: string): void {
    const itemIndex = this.data.findIndex((item) => item.id === id)
    if (itemIndex === -1) return
    this.data.splice(itemIndex, 1)
  }
  update(itemData: IItem): void {
    if (!itemData) return
    const itemIndex = this.data.findIndex((item) => item.id === itemData.id)
    if (itemIndex === -1) {
      this.add(itemData)
      return
    }
    this.data[itemIndex].amount = itemData.amount
  }
  bulkUpdate(items: IItem[]): void {
    if (!Array.isArray(items)) items = [items]
    items.forEach((item) => {
      this.update(item)
    })
  }
  reset(): void {
    this.data.splice(0, this.data.length)
  }
}
