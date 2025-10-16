import asset from "../data/assets"
import { eroot, futor, kel, qutor } from "../lib/kel"
import waittime from "../lib/waittime"
import { INewAreaConfig } from "../types/editor.types"
import Editor from "./Editor"

export default class NewArea {
  private editor: Editor
  private el: HTMLDivElement = kel("div", "newArea")
  private form!: HTMLFormElement
  constructor(config: { editor: Editor }) {
    this.editor = config.editor
  }
  private _createElement(): void {
    this.el.innerHTML = `
    <form action="/uwu/newmap" method="post" class="form" id="area-form">
      <div class="field">
        <div class="title">NEW AREA</div>
      </div>
      <div class="field">
        <label for="area-name">Area Name</label>
        <input type="text" name="area-name" id="area-name" maxlength="40" autocomplete="off" required />
      </div>
      <div class="field">
        <label for="lower-src">Image Source</label>
        <input list="lowers-src" name="lower-src" id="lower-src" required />
        <datalist id="lowers-src">
        </datalist>
      </div>
      <div class="field">
        <label for="upper-src">Layer Source</label>
        <input list="uppers-src" name="upper-src" id="upper-src" required/>
        <datalist id="uppers-src">
        </datalist>
      </div>
      <div class="field">
        <div class="buttons">
          <div class="btn btn-cancel">CANCEL</div>
          <button class="btn btn-ok" type="submit">OK</button>
        </div>
      </div>
    </form>`
  }
  private _renderCard(sk: string): HTMLOptionElement {
    const option = kel("option")
    option.value = sk
    return option
  }
  private _writeAssets(): void {
    const lowersSrc = futor("#lowers-src", this.el)
    const uppersSrc = futor("#uppers-src", this.el)
    Object.keys(asset)
      .filter((sk) => asset[sk].src.includes(`mp_${this.editor.project_name}`))
      .forEach((sk) => {
        lowersSrc.append(this._renderCard(sk))
        uppersSrc.append(this._renderCard(sk))
      })
  }
  private _formListener(): void {
    const inpName = qutor("#area-name", this.el) as HTMLInputElement
    inpName.readOnly = true
    inpName.focus()
    setTimeout(() => {
      inpName.readOnly = false
    }, 250)
    const btnCancel = futor(".btn-cancel", this.el)
    btnCancel.onclick = () => this.destroy()
    this.form = qutor("#area-form", this.el) as HTMLFormElement
    this.form.onsubmit = (e) => {
      e.preventDefault()
      const data: Partial<INewAreaConfig> = {}
      const formData = new FormData(this.form)
      formData.forEach((val, key) => (data[key as keyof INewAreaConfig] = val as string))
      this.editor.newArea(data as INewAreaConfig)
      this.destroy()
    }
  }
  async destroy(): Promise<void> {
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    this.editor.unlock()
  }
  run() {
    this._createElement()
    eroot().append(this.el)
    this._writeAssets()
    this._formListener()
  }
}
