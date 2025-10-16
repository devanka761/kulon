import fs from "fs"
import { IMapSave } from "../types/editor.types"

const mapFolder = "./public/json/build"
const mapPath = mapFolder + "/maps.json"

class MapEditor {
  private maplist: IMapSave = {}
  get data(): IMapSave {
    return this.maplist
  }
  get arr(): string[] {
    return Object.keys(this.maplist)
  }
  exists(project_name: string): boolean {
    if (this.maplist[project_name]) return true
    return false
  }
  load(): void {
    if (!fs.existsSync(mapFolder)) return
    if (!fs.existsSync(mapPath)) return

    const maps = JSON.parse(fs.readFileSync(mapPath, "utf-8")) as IMapSave
    Object.keys(maps).forEach((k) => (this.maplist[k] = maps[k]))
  }
}

const mapEditor = new MapEditor()
export default mapEditor
