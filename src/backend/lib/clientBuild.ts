import fs from "fs"
import xhr from "./xhr"
import { isProd } from "./generators"

const buildFolder = "./public/json/build"
const buildPath = buildFolder + "/buildNumber.json"

const packageFolder = "./src/config"
const packagePath = packageFolder + "/version.json"

const langFolder = "./public/json/build"
const langPath = langFolder + "/lang.json"

interface ITopLanguage {
  id: string
  val: string
}
interface ISizeLanguage {
  id: string
  val: number
}
interface IRawTopLanguages {
  [key: string]: number
}

class ClientBuild {
  private buildNumber: number = 0
  private clientVersion: string = "0.0.1"
  private toplangs: ITopLanguage[] = []
  private _loadPackageVersion(): void {
    if (!fs.existsSync(packageFolder)) return
    if (!fs.existsSync(packagePath)) return

    const client = JSON.parse(fs.readFileSync(packagePath, "utf-8"))
    this.clientVersion = client.version
  }
  private _loadBuildNumber(): void {
    if (!fs.existsSync(buildFolder)) return
    if (!fs.existsSync(buildPath)) return

    const client = JSON.parse(fs.readFileSync(buildPath, "utf-8"))
    this.buildNumber = client.buildNumber
  }
  get buildVersion(): number {
    return this.buildNumber
  }
  get packageVersion(): string {
    return this.clientVersion
  }
  private async _getTopLangs(): Promise<void> {
    if (!isProd) return
    const url = "https://api.github.com/repos/devanka761/kulon/languages"
    const rawLangs = (await xhr.get(url)) as IRawTopLanguages
    if (rawLangs.error) return
    const newLangs: ISizeLanguage[] = Object.keys(rawLangs).map((k) => ({
      id: k,
      val: rawLangs[k]
    }))
    const totalSize = newLangs.map((lang) => lang.val).reduce((a, b) => a + b, 0)

    const newTopLangs: ITopLanguage[] = newLangs
      .sort((a, b) => {
        if (a.val < b.val) return 1
        if (a.val > b.val) return -1
        return 0
      })
      .map((lang) => ({
        id: lang.id,
        val: Math.round((lang.val / totalSize) * 100) + "%"
      }))

    this.toplangs.splice(0, this.toplangs.length)

    newTopLangs.forEach((lang) => this.toplangs.push(lang))
    this._saveTopLangs(newTopLangs)
  }
  private _saveTopLangs(newTopLangs?: ITopLanguage[]): void {
    if (!fs.existsSync(langFolder)) fs.mkdirSync(langFolder)
    fs.writeFileSync(langPath, JSON.stringify(newTopLangs || this.toplangs), "utf-8")
  }
  private _loadTopLangs(): void {
    if (fs.existsSync(langFolder) && fs.existsSync(langPath)) {
      const rawLangs = JSON.parse(fs.readFileSync(langPath, "utf-8")) as ITopLanguage[]
      rawLangs.forEach((lang) => this.toplangs.push(lang))
    }
  }
  get languages(): ITopLanguage[] {
    return this.toplangs
  }
  init(): void {
    this._loadBuildNumber()
    this._loadPackageVersion()
    this._loadTopLangs()
    this._getTopLangs()
  }
}

const clientBuild = new ClientBuild()
export default clientBuild
