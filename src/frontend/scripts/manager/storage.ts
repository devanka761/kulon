import LocalList from "../data/LocalList"

const safeMapIds = ["kulonSafeHouse"]

interface ILocalSave {
  save(): void
  getSaveFile(): void
  load(): void
}
interface IStorageData {
  mapId: string
  saveVersion: string
}

interface ISaveData extends IStorageData {
  settings: typeof LocalList
}

class LocalSave implements ILocalSave, IStorageData {
  mapId: string = "kulonSafeHouse"
  saveVersion: string = "761"
  private saveFileKey: string = "Kulon_Save"
  save(): void {
    const saveData: ISaveData = {
      mapId: this.mapId,
      saveVersion: this.saveVersion,
      settings: LocalList
    }
    window.localStorage.setItem(this.saveFileKey, JSON.stringify(saveData))
  }
  getSaveFile(): ISaveData | null {
    if (!window.localStorage) return null
    const file = window.localStorage.getItem(this.saveFileKey)
    return file ? JSON.parse(file) : null
  }
  load(): void {
    const file = this.getSaveFile()
    if (file) {
      if (file.saveVersion && file.saveVersion !== this.saveVersion) return
      if (safeMapIds.find((id) => id === file.mapId)) {
        this.mapId = file.mapId
      }
      if (file.settings) {
        Object.keys(file.settings).forEach((flag) => {
          LocalList[flag] = file.settings[flag]
        })
      }
    }
  }
}

const localSave = new LocalSave()
export default localSave
