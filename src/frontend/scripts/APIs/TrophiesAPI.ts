import { ITrophy } from "../types/trohpy.types"

export default class TrophiesAPI {
  private data: ITrophy[] = []
  get(trophyId: string): ITrophy | undefined {
    return this.data.find((trophy) => trophy.id === trophyId)
  }
  isDone(trophyId: string): boolean {
    return this.data.some((trophy) => trophy.id === trophyId && trophy.ts)
  }
  get getAll(): ITrophy[] {
    return this.data
  }
  get doneList(): ITrophy[] {
    return this.data.filter((trophy) => trophy.ts)
  }
  get unclaimeds(): ITrophy[] {
    return this.data.filter((trophy) => trophy.ts && !trophy.claimed)
  }
  add(trophyData: ITrophy): TrophiesAPI {
    this.data.push(trophyData)
    return this
  }
  remove(trophyId: string): void {
    const trophy = this.data.findIndex((trophy) => trophy.id === trophyId)
    if (trophy === -1) return
    this.data.splice(trophy, 1)
  }
  update(trophyData: ITrophy): void {
    if (!trophyData) return
    // delete trophyData._id
    const trophy = this.data.find((trop) => trop.id === trophyData.id)
    if (!trophy) {
      this.add(trophyData)
      return
    }

    Object.assign(trophy, trophyData)
  }
  bulkUpdate(trophies: ITrophy[]): void {
    if (!Array.isArray(trophies)) trophies = [trophies]
    trophies.forEach((trophy) => {
      this.update(trophy)
    })
  }
  reset(): void {
    this.data.splice(0, this.data.length)
  }
}
