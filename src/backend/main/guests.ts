import fs from "fs"
import Account from "../models/AccountModel"
import User from "../models/UserModel"
import Mail from "../models/MailModel"
import Item from "../models/ItemModel"
import Trophy from "../models/TrophyModel"

const usersFolder = "./public/json/build"
const usersPath = usersFolder + "/userSize"

class Guests {
  private userSize: number = 0
  private anonSize: number = 0
  userNumber(addedNumber: number = 1, isSet?: boolean): number {
    this.userSize = isSet ? addedNumber : this.userSize + addedNumber
    this._saveUsers()
    return this.userSize
  }
  async anonNumber(): Promise<number> {
    const accounts = await Account.find({ anon: { $lt: Date.now() } }).lean()
    const accountIds = accounts.map((account) => account.id)
    if (accountIds.length >= 1) await this._deleteAnons(accountIds)

    this.anonSize = await Account.countDocuments({ anon: { $exists: true } })
    return this.anonSize
  }
  private async _deleteAnons(accountIds: string[]): Promise<void> {
    await Trophy.deleteMany({ owner: { $in: accountIds } })
    await Mail.deleteMany({ owner: { $in: accountIds } })
    await Item.deleteMany({ owner: { $in: accountIds } })
    await User.deleteMany({ id: { $in: accountIds } })
    await Account.deleteMany({ id: { $in: accountIds } })
  }
  private _saveUsers(): void {
    if (!fs.existsSync(usersFolder)) fs.mkdirSync(usersFolder)
    fs.writeFileSync(usersPath, this.userSize.toString(), "utf-8")
  }
  async load(): Promise<void> {
    if (!fs.existsSync(usersFolder)) fs.mkdirSync(usersFolder)
    if (!fs.existsSync(usersPath)) {
      fs.writeFileSync(usersPath, "0", "utf-8")
      return
    }
    const usersData: string = fs.readFileSync(usersPath, "utf-8") || "0"
    this.userSize = Number(usersData.trim())

    await this.anonNumber()
  }
}
const guest = new Guests()
export default guest
