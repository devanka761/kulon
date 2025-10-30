import { ISival } from "../types/lib.types"
import asset from "../data/assets"
import { eroot, futor, kel, qutor } from "../lib/kel"
import LoadAssets from "../lib/LoadAssets"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import Editor from "./Editor"

export default class NewAsset {
  readonly project_name: string
  private type: 0 | 1
  private editor: Editor
  private el: HTMLDivElement = kel("div", "newArea")
  private form!: HTMLFormElement
  private file: File | null = null
  private dataFile: string | null = null
  private isLocked: boolean = false

  constructor(config: { editor: Editor; type: 0 | 1; project_name: string }) {
    this.project_name = config.project_name
    this.editor = config.editor
    this.type = config.type
  }
  private _createElement(): void {
    this.el = kel("div", "newArea")
    this.el.innerHTML = `
    <form action="/uwu/newasset" method="post" class="form" id="area-form">
      <div class="field add rem">
        <div class="title">${this.type ? "ADD" : "REMOVE"} ASSET</div>
      </div>
      <div class="field rem">
        <label for="asset-filename">Asset Name</label>
        <input list="assets-filename" name="asset-filename" id="asset-filename" required />
        <datalist id="assets-filename">
        </datalist>
      </div>
      <div class="field add">
        <label for="asset-file">Asset File</label>
        <input type="file" name="asset-file" id="asset-file" accept=".png,.svg" required />
      </div>
      <div class="field add">
        <label for="asset-name">Asset Name</label>
        <input type="text" name="asset-name" id="asset-name" maxlength="40" autocomplete="off" required />
      </div>
      <div class="field add">
        <label for="asset-folder">Asset Folder Name</label>
        <input type="text" name="asset-folder" id="asset-folder" maxlength="40" autocomplete="off" required />
      </div>
      <div class="field add">
        <label for="asset-extension">Asset Extension</label>
        <select name="asset-extension" id="asset-extension" required>
          <option value=".png">.png</option>
          <option value=".svg">.svg</option>
        </select>
      </div>
      <div class="field add rem">
        <div class="buttons">
          <div class="btn btn-cancel">CANCEL</div>
          <button class="btn btn-ok" type="submit">${this.type ? "UPLOAD" : "DELETE"}</button>
        </div>
      </div>
    </form>`
  }
  private _formListener(): void {
    const btnCancel = futor(".btn-cancel", this.el)
    btnCancel.onclick = () => this.destroy()
    this.form = qutor("#area-form", this.el) as HTMLFormElement
    this.form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      if (this.type && (!this.dataFile || !this.file)) return
      this.isLocked = true
      const formData = new FormData(this.form)
      const data: ISival = {}
      formData.forEach((val, key) => {
        if (key !== "asset-file") data[key] = val
      })
      if (this.type) {
        data["asset-file"] = this.dataFile
      }
      data["project_name"] = this.project_name
      const upFile = await modal.loading(xhr.post(`/x/mod/editor-${this.type ? "addasset" : "remasset"}`, data), "UPLOADING")
      if (!upFile.ok) {
        await modal.alert(upFile.msg || "Something Went Wrong!")
        this.isLocked = false
        return
      }
      if (this.type) {
        await modal.loading(new LoadAssets({ skins: upFile.data.assets }).run(), "DOWNLOADING ASSETS")
      } else {
        delete asset[upFile.data.asset]
      }
      this.isLocked = false
      this.destroy()
    }
    const inpName = futor("#asset-name", this.el) as HTMLInputElement
    const inpExt = futor("#asset-extension", this.el) as HTMLInputElement
    const inpFolder = futor("#asset-folder", this.el) as HTMLInputElement
    inpFolder.value = `mp_${this.project_name}`
    const inpFile = futor("#asset-file", this.el) as HTMLInputElement
    inpFile.onchange = async () => {
      if (!inpFile.files) return

      const file = inpFile.files[0]
      const extRegex = /.png|.svg/i
      const fileExt = file?.name?.match(extRegex)
      if (fileExt) inpExt.value = fileExt[0].toLowerCase()
      if (!inpName.value || inpName.value.length < 1 || inpName.value === (file?.name || "").replace(extRegex, "")) {
        inpName.value = file.name.replace(extRegex, "")
      }
      this.file = file

      if (this.file) {
        const fileBase64: string | ArrayBuffer | null = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            return resolve(reader.result)
          }
          reader.readAsDataURL(file)
        })
        this.dataFile = fileBase64 ? fileBase64.toString() : null
      } else {
        this.dataFile = null
      }
    }
  }
  private _checkType(): void {
    const fields = this.el.querySelectorAll(".field")
    fields.forEach((field) => {
      if (!field.classList.contains(this.type ? "add" : "rem")) {
        field.remove()
      }
    })
    if (this.type !== 1) {
      const assetsDatalist = futor("#assets-filename", this.el)
      Object.keys(asset).forEach((k) => {
        const opt = kel("option")
        opt.value = k
        assetsDatalist.append(opt)
      })
    }
  }
  async destroy(): Promise<void> {
    this.el.classList.add("out")
    await waittime()
    this.file = null
    this.dataFile = null
    this.el.remove()
    this.editor.unlock()
  }
  run(): void {
    this._createElement()
    eroot().append(this.el)
    this._formListener()
    this._checkType()
  }
}
