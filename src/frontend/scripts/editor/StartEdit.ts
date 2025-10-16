import { IMapSave } from "../types/editor.types"
import { eroot, kel, qutor } from "../lib/kel"
import LoadAssets from "../lib/LoadAssets"
import modal from "../lib/modal"
import xhr from "../lib/xhr"
import { SSKelement } from "../types/lib.types"
import Editor from "./Editor"

export default class StartEditor {
  private maplist: IMapSave = {}
  private isLocked: boolean = false
  private el: HTMLDivElement = kel("div", "MapChooser")
  private emaplist!: SSKelement
  constructor(config: { maplist: IMapSave }) {
    this.maplist = config.maplist
  }
  createElement(): void {
    this.el = document.createElement("div")
    this.el.classList.add("MapChooser")
    this.el.innerHTML = `
    <div class="Map-Content">
      <div class="Map-About">
        <div class="Map-Meta">
          <div class="Map-Title">Kulon Editor</div>
          <div class="Map-Desc">by <a href="https://devanka.id" target="_blank">Devanka 761</a></div>
        </div>
        <div class="Map-Back">
          <a href="/app" class="btn btn-back"><i class="fa-solid fa-gamepad"></i> Play Kulon</a>
        </div>
      </div>
      <div class="Map-List">
      </div>
    </div>
    <div class="Map-Actions">
      <div class="btn btn-new-project">
        <i class="fa-solid fa-plus"></i> <span>New Project</span>
      </div>
    </div>`
    this.emaplist = qutor(".Map-List", this.el) as SSKelement
  }
  private _btnListener(): void {
    const btnNewProject = qutor(".btn-new-project", this.el)
    if (btnNewProject)
      btnNewProject.onclick = async () => {
        if (this.isLocked) return
        this.isLocked = true
        const project_name = await modal.prompt("Projet Name")
        if (!project_name) {
          this.isLocked = false
          return
        }
        const setNewProject = await modal.loading(xhr.post("/x/mod/editor-newproject", { project_name }))
        if (!setNewProject.ok) {
          await modal.alert(setNewProject.msg || "Something went wrong!")
          this.isLocked = false
          return
        }
        this.isLocked = false
        this.destroy()
        new Editor({ project_name, mapdata: {}, finishedEvents: [] }).run()
      }
  }
  private _writeMapData(): void {
    Object.keys(this.maplist).forEach((k) => {
      const card = document.createElement("div")
      card.classList.add("card")
      card.innerHTML = `
      <div class="card-title"><span>${k}</span> <i class="fa-solid fa-pen"></i></div>
      <div class="card-actions">
        <div class="btn btn-delete"><i class="fa-solid fa-trash-can fa-fw"></i></div>
      </div>`
      const cardDelete = qutor(".btn-delete", card)
      if (cardDelete)
        cardDelete.onclick = async () => {
          if (this.isLocked) return
          this.isLocked = true
          await modal.alert('Error: This "destroyProject" method can only be accessed by admins')
          this.isLocked = false
        }
      const cardTitle = qutor(".card-title", card)
      if (cardTitle)
        cardTitle.onclick = async () => {
          if (this.isLocked) return
          this.isLocked = true
          const loadProject = await modal.loading(xhr.get(`/x/mod/editor-loadproject/${k}`))
          if (!loadProject.ok) {
            await modal.alert(loadProject.msg || "Something When Wrong")
            this.isLocked = false
            return
          }
          this._setMapData(loadProject.data.id)
        }
      this.emaplist.append(card)
    })
  }
  private async _setMapData(fileid: string): Promise<void> {
    const mpjson = await modal.loading(xhr.get(`/json/maps/mp_${fileid}.json`), "LOADING MAPS")
    const csjons = (await modal.loading(xhr.get(`/json/scenes/cs_${fileid}.json`), "LOADING COMPLETED EVENTS")) || []
    const stjson = await modal.loading(xhr.get(`/json/assets/st_${fileid}.json`), "GETTING ASSETS INFORMATION")
    await modal.loading(new LoadAssets({ skins: stjson }).run(), "DOWNLOADING ASSETS")
    this.isLocked = false
    this.destroy()
    new Editor({ project_name: fileid, mapdata: mpjson, finishedEvents: csjons }).run()
  }
  destroy(): void {
    if (this.isLocked) return
    this.isLocked = true
    this.el.remove()
    this.isLocked = false
  }
  run(): void {
    this.createElement()
    eroot().append(this.el)
    this._writeMapData()
    this._btnListener()
  }
}
