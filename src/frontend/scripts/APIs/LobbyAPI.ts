import { IUser } from "../types/db.types"

export default class LobbyAPI {
  private data: IUser[] = []
  private enabled: boolean = false
  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  get status(): boolean {
    return this.enabled
  }

  add(...args: IUser[]): void {
    this.data.push(...args)
  }

  get(userId: string): IUser | undefined {
    return this.data.find((usr) => usr.id === userId)
  }

  remove(userId: string): void {
    const memberIdx = this.data.findIndex((usr) => usr.id === userId)
    if (memberIdx < 0) return
    this.data.splice(memberIdx, 1)
  }

  get getAll(): IUser[] {
    return this.data
  }

  reset(): void {
    this.disable()
    this.data.splice(0, this.data.length)
  }
}
