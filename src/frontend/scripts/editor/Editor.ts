import { ISival } from "../types/lib.types"
import asset from "../data/assets"
import { eroot, kel, futor } from "../lib/kel"
import modal from "../lib/modal"
import xhr from "../lib/xhr"
import { IActionMode, IBulk, IEditorConfig, INewAreaConfig } from "../types/editor.types"
import { SSKelement } from "../types/lib.types"
import { GameObjectData, ICutscenes, IEditorCutscenes, IGameObject, IGameObjectTeleporter, IMapConfig, IMapList } from "../types/maps.types"
import NewArea from "./NewArea"
import NewAsset from "./NewAsset"
import NewObject from "./NewObject"
import NewTeleporter from "./NewTeleporter"

const minZoom = 1
const maxZoom = 5
let coorTimeout: ReturnType<typeof setTimeout> | null = null

export default class Editor {
  readonly project_name: string
  private mapdata: IMapList
  private finishedEvents: ISival[]
  private isLocked: boolean = false
  private currArea: string = "none"
  private currImg: HTMLImageElement | null = null
  private currTiles: HTMLDivElement | null = null
  private zoom: number = 2
  private mode: IActionMode = "Wall"
  private tempMode: IActionMode = null
  private bulk: IBulk = {}

  private el: HTMLDivElement = kel("div", "Editor")
  private arealist!: SSKelement
  private currmap!: SSKelement
  private modeTitle!: SSKelement

  constructor(config: IEditorConfig) {
    this.project_name = config.project_name
    this.mapdata = config.mapdata
    this.finishedEvents = config.finishedEvents
  }
  get data(): IMapList {
    return this.mapdata
  }
  private _createElement(): void {
    this.el.innerHTML = `
    <div class="mode-outer">
      <div class="mode-title">Kulon Editor: ${this.project_name}</div>
      <div class="mode-content">
        <div class="mode-files">
          <div class="btn btn-add-files"><i class="fa-duotone fa-solid fa-folder-plus fa-fw"></i> Add Asset</div>
          <div class="btn btn-rem-files"><i class="fa-duotone fa-solid fa-folder-minus fa-fw"></i> Remove Asset</div>
        </div>
        <div class="mode-list">
          <div k-mode="Bulk" class="btn btn-mode">Bulk</div>
          <div class="btn btn-help"><i class="fa-duotone fa-circle-question fa-fw"></i></div>
          <div k-mode="Wall" class="btn btn-mode selected">Wall</div>
          <div k-mode="Space" class="btn btn-mode">Space</div>
          <div k-mode="Object" class="btn btn-mode">Object</div>
          <div k-mode="Teleporter" class="btn btn-mode">Teleporter</div>
        </div>
      </div>
    </div>
    <div class="map-outer">
      <div class="file-outer">
        <div class="areas-outer">
          <div class="areas-actions">
            <div class="btn btn-add" title="New Area">
              <i class="fa-solid fa-plus fa-fw"></i>
            </div>
            <div class="btn btn-zoom-in" title="Zoom In">
              <i class="fa-sharp fa-solid fa-magnifying-glass-plus fa-fw"></i>
            </div>
            <div class="btn btn-zoom-out" title="Zoom Out">
              <i class="fa-sharp fa-solid fa-magnifying-glass-minus fa-fw"></i>
            </div>
            <div class="btn btn-footstep" title="Footstep Sound">
              <i class="fa-solid fa-shoe-prints"></i>
            </div>
            <div class="btn btn-finish" title="Finish Scenes">
              <i class="fa-solid fa-person-running fa-fw"></i>
            </div>
            <div class="btn btn-sz" title="Safe Zone">
              <i class="fa-solid fa-location-dot fa-fw"></i>
            </div>
            <div class="btn btn-sound" title="Background Sound">
              <i class="fa-solid fa-music-note fa-fw"></i>
            </div>
            <div class="btn btn-rename" title="Rename">
              <i class="fa-solid fa-i fa-fw"></i>
            </div>
            <div class="btn btn-full" title="Full Screen">
              <i class="fa-solid fa-expand fa-fw"></i>
            </div>
            <div class="btn btn-remove" title="Delete Area">
              <i class="fa-solid fa-trash-can fa-fw"></i>
            </div>
          </div>
          <div class="areas-list">
            <ul></ul>
          </div>
        </div>
        <div class="actions-outer">
          <div class="actions-list">
            <div class="btn btn-export">SAVE <i class="fa-solid fa-caret-right"></i></div>
            <div class="btn btn-close">EXIT</div>
          </div>
        </div>
      </div>
      <div class="tile-outer">
        <div class="currmap">
        </div>
      </div>
    </div>`
    this.arealist = futor(".areas-list ul", this.el) as SSKelement
    this.currmap = futor(".currmap", this.el) as SSKelement
    this.modeTitle = futor(".mode-title", this.el) as SSKelement
  }
  private _btnListener(): void {
    const btnHelp = futor(".btn-help", this.el)
    btnHelp.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      await modal.alert({ msg: "Use <b><b>Bulk</b></b> to select many tiles at once<br/><br/>The bulk list can be set to <b><b>Walls</b></b> or <b><b>Spaces</b></b> by pressing certain buttons after tiles are selected<br/><br/>Yellow: on bulk<br/>Red: walls<br/>Green: cutscene spaces<br/>Blurple: objects<br/><i>&nbsp;</i>", ic: "circle-question" })
      this.isLocked = false
    }
    const btnExport = futor(".btn-export", this.el)
    const btnClose = futor(".btn-close", this.el)
    btnExport.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const typelist = [
        { id: "preview", label: "Preview JSON Map File", actived: true },
        { id: "export", label: "Apply to Server" }
      ]
      const setType = await modal.select({
        msg: "Select Save Type",
        ic: "floppy-disk",
        items: typelist
      })
      if (!setType) {
        this.isLocked = false
        return
      }
      this._setSave(setType)
    }

    btnClose.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const confClose = await modal.confirm("Exit Kulon Map Editor?")
      if (!confClose) {
        this.isLocked = false
        return
      }
      this.isLocked = false
      this.destroy()
    }
    const btnAddAsset = futor(".btn-add-files", this.el)
    btnAddAsset.onclick = () => {
      if (this.isLocked) return
      this.isLocked = true
      new NewAsset({ editor: this, type: 1, project_name: this.project_name }).run()
    }
    const btnRemAsset = futor(".btn-rem-files", this.el)
    btnRemAsset.onclick = () => {
      if (this.isLocked) return
      this.isLocked = true
      new NewAsset({ editor: this, type: 0, project_name: this.project_name }).run()
    }
  }
  private async _renameArea(): Promise<void> {
    let newName = await modal.prompt({ msg: "New Area Name", val: this.currArea.replace("kulon", "") })
    if (!newName) return
    newName = "kulon" + newName.replace(/\s/g, "")
    if (newName === this.currArea) return
    const confName = await modal.confirm(`Renamve "${this.currArea}" to "${newName.replace("kulon", "")}"?`)
    if (!confName) return
    const oldString = JSON.stringify(this.mapdata).toString()
    const oldArea = this.currArea
    const liArea = this.arealist.querySelectorAll("li")
    liArea.forEach((li) => li.remove())
    this.destroy(true)
    const newString = oldString.replaceAll(oldArea, newName)

    const newMapdata = JSON.parse(newString)
    this.mapdata = newMapdata
    this.currArea = newName
    this.run()
  }
  private async _editSafeZone(mapId: string): Promise<void> {
    const oldX = this.mapdata[mapId].safeZone?.x || null
    const oldY = this.mapdata[mapId].safeZone?.y || null
    const currSz = oldX && oldY ? `${oldX},${oldY}` : ""
    const coor = await modal.prompt({
      msg: `Set Safe Zone for Map ${mapId} (x,y)`,
      pholder: "ex: 7,12",
      val: currSz
    })
    if (!coor) return
    const coorX = Number(coor.split(",")?.[0]?.trim() || -1)
    const coorY = Number(coor.split(",")?.[1]?.trim() || -1)
    if (!isNaN(coorX) && coorX >= 0 && !isNaN(coorY) && coorY >= 0) {
      this.mapdata[mapId].safeZone = { x: coorX, y: coorY }
      return
    }
    return
  }
  private async _setSave(setType: string): Promise<void> {
    const noSafeZones = Object.keys(this.mapdata).find((k) => !this.mapdata[k].safeZone)
    if (noSafeZones) {
      const setSZ = await modal.confirm(`Map ${noSafeZones} has no Safe Zone!<br/>Set now?`)
      if (!setSZ) {
        this.isLocked = false
        return
      }
      await this._editSafeZone(noSafeZones)
      return this._setSave(setType)
    }
    if (setType === "preview") {
      this._saveToPreview()
    } else if (setType === "export") {
      this._saveToServer()
    }
  }
  private async _saveToServer(): Promise<void> {
    const file1 = JSON.stringify(this.mapdata)
    const file2 = JSON.stringify(this.finishedEvents)
    const data = { file1, file2, project_name: this.project_name }
    const upProject = await modal.loading(xhr.post("/x/mod/editor-saveproject", data), "SAVING")
    if (!upProject.ok) {
      await modal.alert(upProject.msg || "Something went wrong!")
      this.isLocked = false
      return
    }
    this.isLocked = false
  }
  private async _saveToPreview(): Promise<void> {
    const text1 = JSON.stringify(this.mapdata)
    const text2 = JSON.stringify(this.finishedEvents)
    const file1 = new Blob([text1], { type: "application/json" })
    const file2 = new Blob([text2], { type: "application/json" })
    const fileURL1 = URL.createObjectURL(file1)
    const fileURL2 = URL.createObjectURL(file2)
    await modal.alert({ msg: `Preview Map:<br/><a href="${fileURL1}" target="_blank">Open In New Tab <i class="fa-duotone fa-regular fa-up-right-from-square"></i></a><br/><br/>Preview On Mission Completed:<br/><a href="${fileURL2}" target="_blank">Open In New Tab <i class="fa-duotone fa-regular fa-up-right-from-square"></i></a>`, ic: "circle-check" })
    URL.revokeObjectURL(fileURL1)
    URL.revokeObjectURL(fileURL2)
    this.isLocked = false
  }
  private _zoomListener(): void {
    const zoomIn = futor(".btn-zoom-in", this.el)
    const zoomOut = futor(".btn-zoom-out", this.el)
    const addArea = futor(".btn-add", this.el)
    const removeArea = futor(".btn-remove", this.el)
    const fullDoc = futor(".btn-full", this.el)
    const btnSz = futor(".btn-sz", this.el)
    const btnRename = futor(".btn-rename", this.el)
    const btnFinish = futor(".btn-finish", this.el)
    const btnFootstep = futor(".btn-footstep", this.el)
    const btnSound = futor(".btn-sound", this.el)

    btnSound.onclick = async () => {
      if (this.isLocked || !this.currArea || this.currArea === "none") return
      this.isLocked = true
      const currSound = this.mapdata[this.currArea].sound || null
      const sound = await modal.prompt({ msg: "Area Ambient Sound", val: currSound || "" })
      if (!sound || sound === currSound) {
        this.isLocked = false
        return
      }
      this.mapdata[this.currArea].sound = sound
      this.isLocked = false
    }

    btnFootstep.onclick = async () => {
      if (this.isLocked || !this.currArea || this.currArea === "none") return
      this.isLocked = true
      const currFootstep = this.mapdata[this.currArea].footstep || "a"
      const sound = await modal.select({
        msg: "Footstep Sound",
        items: [
          { id: "a", label: "Default Sound", activated: currFootstep === "a" },
          { id: "b", label: "Grassy Sound", activated: currFootstep === "b" }
        ]
      })

      if (sound === "b") {
        this.mapdata[this.currArea].footstep = "b"
      } else {
        delete this.mapdata[this.currArea].footstep
      }
      this.isLocked = false
    }

    btnFinish.onclick = () => {
      if (this.isLocked) return
      this.isLocked = true
      const x = -1
      const y = -1
      new NewObject(
        {
          x,
          y,
          editor: this,
          passed: {
            id: "finished",
            finished: [{ events: this.finishedEvents }]
          },
          isSpace: true
        },
        true
      ).run()
    }
    btnRename.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      await this._renameArea()
      this.isLocked = false
    }

    btnSz.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      await this._editSafeZone(this.currArea)
      this.isLocked = false
    }

    fullDoc.onclick = async () => {
      const docEl = document.documentElement

      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen()
      } else if ("webkitRequestFullscreen" in docEl && typeof docEl["webkitRequestFullscreen"] === "function") {
        await docEl["webkitRequestFullscreen"]()
      } else if ("msRequestFullscreen" in docEl && typeof docEl["msRequestFullscreen"] === "function") {
        await docEl["msRequestFullscreen"]()
      }

      if (screen.orientation && "lock" in screen.orientation && typeof screen.orientation["lock"] === "function") {
        try {
          await screen.orientation["lock"]("landscape")
        } catch (_err) {
          // console.warn("Gagal mengunci orientasi:", err)
        }
      }
    }

    addArea.onclick = () => {
      if (this.isLocked) return
      this.isLocked = true
      new NewArea({ editor: this }).run()
    }
    removeArea.onclick = async () => {
      if (this.isLocked) return
      const oldAreas = Object.values(this.mapdata)
      if (oldAreas.length <= 1) {
        await modal.alert("Cannot delete the only area you have")
        return
      }
      this.isLocked = true
      const confRem = await modal.confirm(`Remove Area: ${this.currArea}?`)
      if (!confRem) {
        this.isLocked = false
        return
      }
      delete this.mapdata[this.currArea]
      const liArea = futor(`#${this.currArea}`, this.arealist)
      if (liArea) liArea.remove()
      this.isLocked = false
      const areas = Object.values(this.mapdata)
      this._setTileImage(areas[0].id, areas[0].lowerSrc)
    }
    zoomIn.onclick = () => {
      if (this.zoom >= maxZoom) return
      this.zoom = this.zoom + 0.5
      this.currmap.style.transform = `scale(${this.zoom})`
    }
    zoomOut.onclick = () => {
      if (this.zoom <= minZoom) return
      this.zoom = this.zoom - 0.5
      this.currmap.style.transform = `scale(${this.zoom})`
    }
    const btnModes = this.el.querySelectorAll(".btn-mode") as NodeListOf<SSKelement>
    btnModes.forEach((btn) => {
      const work = btn.getAttribute("k-mode") as IActionMode
      btn.onclick = async () => {
        this.tempMode = work === "Bulk" ? null : work
        if (Object.keys(this.bulk).length >= 1) {
          if (this.tempMode === "Wall") {
            Object.keys(this.bulk).forEach((coor) => {
              this._addWall(coor)
              this._addBulk(coor)
            })
            this.tempMode = null
            return
          } else if (this.tempMode === "Space") {
            return this._tileWork(-1, -1)
          } else {
            await modal.alert("Bulk list can only be set to Walls or Spaces")
            this.tempMode = null
            return
          }
        }
        this.tempMode = null
        const btnActived = futor(".btn-mode.selected", this.el)
        btnActived.classList.remove("selected")
        btn.classList.add("selected")
        this.mode = work
      }
    })
  }
  private _setAreas(): void {
    const areas = Object.values(this.mapdata || {})
    areas.forEach((area) => this._setAreaObj(area))
    if (areas.length >= 1) {
      if (this.currArea && this.currArea !== "none") {
        this._setTileImage(this.mapdata[this.currArea].id, this.mapdata[this.currArea].lowerSrc)
      } else {
        this._setTileImage(areas[0].id, areas[0].lowerSrc)
      }
    }
  }
  private _setAreaObj(area: IMapConfig): void {
    const li = document.createElement("li")
    li.id = area.id
    li.innerHTML = area.id.replace("kulon", "")
    li.onclick = () => this._setTileImage(area.id, area.lowerSrc)
    this.arealist.append(li)
  }
  private _setTileImage(area_id: string, area_src: string): void {
    Object.keys(this.bulk).forEach((k) => {
      delete this.bulk[k]
    })
    this.currArea = area_id
    const areaActives = this.arealist.querySelectorAll("li.selected")
    areaActives.forEach((area) => area.classList.remove("selected"))
    futor(`#${area_id}`, this.arealist)?.classList.add("selected")
    this._writeImage(area_id, area_src)
  }
  private _writeImage(area_id: string, area_src: string): void {
    if (this.currImg) this.currImg.remove()
    if (this.currTiles) this.currTiles.remove()
    const img = new Image()
    this.currImg = img
    img.onload = () => {
      this.currmap.append(img)
      this._writeGrid(img)
      this._loadCoor()
    }
    this.currImg.alt = area_id
    this.currImg.src = asset[area_src].src
  }
  private _writeGrid(img: HTMLImageElement): void {
    this.currTiles = document.createElement("div")
    this.currTiles.classList.add("tiles")

    const img_coloumns = img.width / 16
    const img_rows = img.height / 16
    const img_tile_total = img_coloumns * img_rows

    this.currTiles.style.gridTemplateColumns = `repeat(${img_coloumns}, 16px)`
    this.currTiles.style.gridTemplateRows = `repeat(${img_rows}, 16px)`

    let x = 0,
      y = 0
    for (let i = 1; i <= img_tile_total; i++) {
      const tile = document.createElement("div")
      tile.classList.add("tile")
      tile.setAttribute("k-coor", `${x},${y}`)
      const newX = x
      const newY = y
      tile.onclick = () => this._tileWork(newX, newY)
      this.currTiles.append(tile)
      x++
      if (x === img_coloumns) {
        x = 0
        y++
      }
    }

    this.currmap.append(this.currTiles)
  }
  private _loadCoor(): void {
    const walls = Object.keys(this.mapdata[this.currArea].walls)
    walls.forEach((k) => this._addWall(k, true))
    const spaces = Object.keys(this.mapdata[this.currArea].cutscenes)
    spaces.forEach((k) => this._addSpace(k))
    const cobj = this.mapdata[this.currArea].configObjects
    const confobjects = Object.keys(cobj)
    confobjects.forEach((k) => {
      this._addObject(`${cobj[k].x},${cobj[k].y}`)
    })
  }
  private _addBulk(k: string, rm = false): void {
    const etile = futor(`.tiles .tile[k-coor="${k}"]`, this.currmap)
    if (!etile) return

    if (this.bulk[k] || rm) {
      delete this.bulk[k]
      etile.classList.remove("b")
    } else {
      this.bulk[k] = true
      etile.classList.add("b")
    }
  }
  private _addWall(k: string, initial = false): void {
    const etile = futor(`.tiles .tile[k-coor="${k}"]`, this.currmap)
    if (!etile) return

    if (this.mapdata[this.currArea].walls[k] && !initial) {
      delete this.mapdata[this.currArea].walls[k]
      etile.classList.remove("w")
    } else {
      this.mapdata[this.currArea].walls[k] = true
      etile.classList.add("w")
    }
  }
  private _addSpace(k: string, rm = false): void {
    const etile = futor(`.tiles .tile[k-coor="${k}"]`, this.currmap)
    if (!etile) return

    if (rm) {
      etile.classList.remove("s")
    } else {
      etile.classList.add("s")
    }
  }
  private _addObject(k: string, rm = false): void {
    const etile = futor(`.tiles .tile[k-coor="${k}"]`, this.currmap)
    if (!etile) return

    if (rm) {
      etile.classList.remove("o")
    } else {
      etile.classList.add("o")
    }
  }
  private _showLastCoor(x: number, y: number): void {
    if (coorTimeout) {
      this._hideLastCoor()
    }
    this.modeTitle.innerHTML = `Last Coor: ${x}x, ${y}y`
    coorTimeout = setTimeout(() => this._hideLastCoor(), 120000)
  }
  private _hideLastCoor(): void {
    if (coorTimeout) {
      clearTimeout(coorTimeout)
      coorTimeout = null
      this.modeTitle.innerHTML = `Kulon Editor: ${this.project_name}`
    }
  }
  private async _tileWork(x: number, y: number): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    const coor = `${x},${y}`
    this._showLastCoor(x, y)
    if (this.mode === "Bulk" && !this.tempMode) {
      const cobj = this.mapdata[this.currArea].configObjects
      const obj_key = Object.keys(cobj).find((k) => cobj[k].x === x && cobj[k].y === y)

      if (obj_key && cobj[obj_key]) {
        await modal.alert("This tile has been set to Object")
        this.isLocked = false
        return
      }
      if (this.mapdata[this.currArea].cutscenes[coor]) {
        await modal.alert("This tile has been set to Space")
        this.isLocked = false
        return
      }
      if (this.mapdata[this.currArea].walls[coor]) {
        await modal.alert("This tile has been set to Wall")
        this.isLocked = false
        return
      }
      this._addBulk(coor)
      this.isLocked = false
    } else if (this.mode === "Wall" && !this.tempMode) {
      const cobj = this.mapdata[this.currArea].configObjects
      const obj_key = Object.keys(cobj).find((k) => cobj[k].x === x && cobj[k].y === y)
      if (obj_key && cobj[obj_key]) {
        await modal.alert("This tile has been set to Object")
        this.isLocked = false
        return
      }
      if (this.mapdata[this.currArea].cutscenes[coor]) {
        await modal.alert("This tile has been set to Space")
        this.isLocked = false
        return
      }
      this._addWall(coor)
      this.isLocked = false
    } else if (this.mode === "Teleporter" && !this.tempMode) {
      if (this.mapdata[this.currArea].walls[coor]) {
        await modal.alert("This tile has been set to Wall")
        this.isLocked = false
        return
      }
      if (this.mapdata[this.currArea].cutscenes[coor]) {
        await modal.alert("This tile has been set to Space")
        this.isLocked = false
        return
      }
      const cobj = this.mapdata[this.currArea].configObjects
      const obj_key = Object.keys(cobj).find((k) => cobj[k].x === x && cobj[k].y === y)
      if (obj_key && (cobj[obj_key].type === "Interactable" || cobj[obj_key].type === "Person")) {
        await modal.alert("This tile has been set to Interactable/Person")
        this.isLocked = false
        return
      }

      const teleporterConfig = (obj_key ? cobj[obj_key] : {}) as Partial<IGameObjectTeleporter>
      const teleporterData = teleporterConfig.from ? { ...teleporterConfig.from } : {}

      const passed = {
        ...teleporterData,
        id: obj_key,
        x,
        y,
        editor: this
      }

      new NewTeleporter({ ...passed }, !!obj_key).run()
    } else if (this.mode === "Object" && !this.tempMode) {
      if (this.mapdata[this.currArea].walls[coor]) {
        await modal.alert("This tile has been set to Wall")
        this.isLocked = false
        return
      }
      if (this.mapdata[this.currArea].cutscenes[coor]) {
        await modal.alert("This tile has been set to Space")
        this.isLocked = false
        return
      }
      const cobj = this.mapdata[this.currArea].configObjects
      const obj_key = Object.keys(cobj).find((k) => cobj[k].x === x && cobj[k].y === y)
      if (obj_key && cobj[obj_key].type === "Teleporter") {
        await modal.alert("This tile has been set to Teleporter")
        this.isLocked = false
        return
      }

      new NewObject({ x, y, editor: this, passed: obj_key ? { ...cobj[obj_key], id: obj_key } : null, isSpace: false }).run()
    } else if (this.mode === "Space" || this.tempMode === "Space") {
      if (this.mapdata[this.currArea].walls[coor]) {
        await modal.alert("This tile has been set to Wall")
        this.isLocked = false
        return
      }
      const cobj = this.mapdata[this.currArea].configObjects
      const obj_key = Object.keys(cobj).find((k) => cobj[k].x === x && cobj[k].y === y)
      if (obj_key && cobj[obj_key]) {
        await modal.alert("This tile has been set to Object")
        this.isLocked = false
        return
      }
      const skey = coor
      const sobj = this.mapdata[this.currArea].cutscenes[skey]
      let myCoor: IEditorCutscenes | null = null
      if (sobj) {
        myCoor = {}
        myCoor[skey] = sobj
        myCoor.id = skey
      }
      new NewObject({ x, y, editor: this, passed: myCoor, isSpace: true }).run()
    }
  }
  newArea(data: INewAreaConfig): void {
    const areaname = "kulon" + data["area-name"]
    this.mapdata[areaname] = {
      id: areaname,
      lowerSrc: data["lower-src"],
      upperSrc: data["upper-src"],
      configObjects: {},
      walls: {},
      cutscenes: {}
    }
    if (data["area-sound"]) this.mapdata[areaname].sound = data["area-sound"]
    this._setAreaObj(this.mapdata[areaname])
    this._setTileImage(areaname, data["lower-src"])
    this.isLocked = false
  }
  editFinish(finish_data: ICutscenes[]): void {
    this.finishedEvents = finish_data
  }
  editObject(object_id: string, object_data: GameObjectData, old_object_id?: string | null): void {
    if (old_object_id && this.mapdata[this.currArea].configObjects[old_object_id]) {
      delete this.mapdata[this.currArea].configObjects[old_object_id]
    }
    this.mapdata[this.currArea].configObjects[object_id] = object_data
    this._addObject(`${object_data.x},${object_data.y}`)
  }
  removeObject(object_data: GameObjectData): void {
    if (object_data.id && this.mapdata[this.currArea].configObjects[object_data.id]) {
      this._addObject(`${object_data.x},${object_data.y}`, true)
      delete this.mapdata[this.currArea].configObjects[object_data.id]
    }
  }
  editTeleporter(object_id: string, object_data: IGameObjectTeleporter, old_object_id?: string | null): void {
    if (old_object_id && this.mapdata[this.currArea].configObjects[old_object_id]) {
      delete this.mapdata[this.currArea].configObjects[old_object_id]
    }
    this.mapdata[this.currArea].configObjects[object_id] = object_data
    this._addObject(`${object_data.x},${object_data.y}`)
  }
  removeTeleporter(object_data: IGameObject): void {
    if (object_data.id && this.mapdata[this.currArea].configObjects[object_data.id]) {
      this._addObject(`${object_data.x},${object_data.y}`, true)
      delete this.mapdata[this.currArea].configObjects[object_data.id]
    }
  }
  editSpace(space_id: string, space_data: ICutscenes): void {
    if (Object.keys(this.bulk).length >= 1) {
      Object.keys(this.bulk).forEach((k) => {
        if (this.mapdata[this.currArea].cutscenes[k]) {
          delete this.mapdata[this.currArea].cutscenes[k]
        }
        this.mapdata[this.currArea].cutscenes[k] = space_data[space_id]
        this._addSpace(k)
        this._addBulk(k)
      })
      this.tempMode = null
      return
    }
    if (this.mapdata[this.currArea].cutscenes[space_id]) {
      delete this.mapdata[this.currArea].cutscenes[space_id]
    }
    this._addSpace(space_id)
    this.mapdata[this.currArea].cutscenes[space_id] = space_data[space_id]
  }
  removeSpace(space_id: string): void {
    if (this.mapdata[this.currArea].cutscenes[space_id]) {
      this._addSpace(space_id, true)
      delete this.mapdata[this.currArea].cutscenes[space_id]
    }
  }
  unlock(): void {
    this.isLocked = false
    this.tempMode = null
  }
  destroy(restart?: boolean): void {
    this.mapdata = {}
    this.isLocked = false
    this.currArea = "none"
    this.currImg = null
    this.currTiles = null
    this.zoom = 2
    this.mode = "Wall"
    this.tempMode = null
    this.bulk = {}
    this.el.remove()
    if (!restart) window.location.reload()
  }
  run(): void {
    this._createElement()
    eroot().append(this.el)
    this._setAreas()
    this._zoomListener()
    this._btnListener()
  }
}
