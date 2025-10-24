import { ISival } from "../types/lib.types"

interface IWaitingConfig {
  id: string
  [key: string]: ISival
}
interface IWaiting {
  id: string
  ts: number
  [key: string]: ISival
}

export default class WaitingAPI {
  private data: IWaiting[] = []
  add(data: IWaitingConfig): void {
    this.data.push({ ...data, ts: Date.now() })
  }
  get(dataId: string): IWaiting | undefined {
    return this.data.find((data) => data.id === dataId)
  }
  getMany(dataId: string): IWaiting[] {
    return this.data.filter((data) => data.id === dataId)
  }
  getAll() {
    return this.data.sort((a, b) => {
      if (a.ts > b.ts) return 1
      if (a.ts < b.ts) return -1
      return 0
    })
  }
  remove(dataId: string): void {
    const index = this.data.findIndex((data) => data.id === dataId)
    if (index === -1) return
    this.data.splice(index, 1)
  }
  removeMany(dataId: string): void {
    this.data = this.data.filter((data) => data.id !== dataId)
  }
  reset(): void {
    this.data.splice(0, this.data.length)
  }
}
