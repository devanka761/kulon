import modal from "../lib/modal"
import Editor from "./Editor"
import { ISival } from "../types/lib.types"
import { eroot, futor, kel } from "../lib/kel"
import { IGameObjectTeleporterType, TeleporeterFromPosition } from "../types/maps.types"
import waittime from "../lib/waittime"

export interface INewObjectConfig {
  id?: string
  x: number
  y: number
  editor: Editor
}

export default class NewTeleporter {
  private passed?: boolean = false
  private x: number
  private y: number
  private id?: string
  private editor: Editor
  private up?: TeleporeterFromPosition
  private down?: TeleporeterFromPosition
  private left?: TeleporeterFromPosition
  private right?: TeleporeterFromPosition
  private el: HTMLDivElement = kel("div", "newArea")
  private form!: HTMLFormElement
  private isLocked: boolean = false

  constructor(config: Partial<IGameObjectTeleporterType> & INewObjectConfig, isPassed?: boolean) {
    this.passed = isPassed
    this.x = config.x
    this.y = config.y
    this.id = config.id || "TELE_" + Date.now().toString(36).toUpperCase()
    this.up = config.up
    this.down = config.down
    this.left = config.left
    this.right = config.right
    this.editor = config.editor
  }
  get Editor(): Editor {
    return this.editor
  }
  private _createElement(): void {
    this.el.innerHTML = `
    <form action="/uwu/newObject" method="post" class="form" id="object-form">
      <div class="field">
        <div class="title">Tile Teleporter</div>
      </div>
      <div class="field onObject">
        <label for="obj-id">Object ID</label>
        <input type="text" name="obj-id" id="obj-id" maxlength="40" autocomplete="off" placeholder="ex: LadderSSA" value="${this.id}" />
      </div>
      <div class="field">
        <div class="txt">From Up (to destination)</div>
        <div class="froms">
          <div class="from">
            <label for="up-x">X</label>
            <input type="number" name="up-x" id="up-x" autocomplete="off" placeholder="${this.x}" min="-1000" max="1000" value="${this.up?.x ? this.up.x : this.x}" required />
          </div>
          <div class="from">
            <label for="up-y">Y</label>
            <input type="number" name="up-y" id="up-y" autocomplete="off" placeholder="${this.y - 1}" min="-1000" max="1000" value="${this.up?.y ? this.up.y : this.y - 1}" required />
          </div>
          <div class="from">
            <label for="up-direction">Direction</label>
            <input list="up-directions" name="up-direction" id="up-direction" placeholder="up" value="${this.up?.direction ? this.up.direction : "up"}" required />
            <datalist id="up-directions">
              <option value="up"></option>
              <option value="down"></option>
              <option value="left"></option>
              <option value="right"></option>
            </datalist>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="txt">From Down (to destination)</div>
        <div class="froms">
          <div class="from">
            <label for="down-x">X</label>
            <input type="number" name="down-x" id="down-x" autocomplete="off" placeholder="${this.x}" min="-1000" max="1000" value="${this.down?.x ? this.down.x : this.x}" required />
          </div>
          <div class="from">
            <label for="down-y">Y</label>
            <input type="number" name="down-y" id="down-y" autocomplete="off" placeholder="${this.y + 1}" min="-1000" max="1000" value="${this.down?.y ? this.down.y : this.y + 1}" required />
          </div>
          <div class="from">
            <label for="down-direction">Direction</label>
            <input list="down-directions" name="down-direction" id="down-direction" placeholder="down" value="${this.down?.direction ? this.down.direction : "down"}" required />
            <datalist id="down-directions">
              <option value="up"></option>
              <option value="down"></option>
              <option value="left"></option>
              <option value="right"></option>
            </datalist>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="txt">From Left (to destination)</div>
        <div class="froms">
          <div class="from">
            <label for="left-x">X</label>
            <input type="number" name="left-x" id="left-x" autocomplete="off" placeholder="${this.x - 1}" min="-1000" max="1000" value="${this.left?.x ? this.left.x : this.x - 1}" required />
          </div>
          <div class="from">
            <label for="left-y">Y</label>
            <input type="number" name="left-y" id="left-y" autocomplete="off" placeholder="${this.y}" min="-1000" max="1000" value="${this.left?.y ? this.left.y : this.y}" required />
          </div>
          <div class="from">
            <label for="left-direction">Direction</label>
            <input list="left-directions" name="left-direction" id="left-direction" placeholder="left" value="${this.left?.direction ? this.left.direction : "left"}" required />
            <datalist id="left-directions">
              <option value="up"></option>
              <option value="down"></option>
              <option value="left"></option>
              <option value="right"></option>
            </datalist>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="txt">From Right (to destination)</div>
        <div class="froms">
          <div class="from">
            <label for="right-x">X</label>
            <input type="number" name="right-x" id="right-x" autocomplete="off" placeholder="${this.x + 1}" min="-1000" max="1000" value="${this.right?.x ? this.right.x : this.x + 1}" required />
          </div>
          <div class="from">
            <label for="right-y">Y</label>
            <input type="number" name="right-y" id="right-y" autocomplete="off" placeholder="${this.y}" min="-1000" max="1000" value="${this.right?.y ? this.right.y : this.y}" required />
          </div>
          <div class="from">
            <label for="right-direction">Direction</label>
            <input list="right-directions" name="right-direction" id="right-direction" placeholder="right" value="${this.right?.direction ? this.right.direction : "right"}" required />
            <datalist id="right-directions">
              <option value="up"></option>
              <option value="down"></option>
              <option value="left"></option>
              <option value="right"></option>
            </datalist>
          </div>
        </div>
      </div>
      <div class="field">
        <div class="action-buttons buttons triple">
          <div class="btn btn-remove">DELETE</div>
          <div class="btn btn-cancel">CANCEL</div>
          <button class="btn btn-ok" type="submit">OK</button>
        </div>
      </div>
    </form>`
  }

  private _btnListener(): void {
    const btnCancel = futor(".btn-cancel", this.el)
    btnCancel.onclick = () => this.destroy()

    const btnRemove = futor(".btn-remove", this.el)
    btnRemove.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const confDel = await modal.confirm(`Delete this teleporter?`)
      if (!confDel) {
        this.isLocked = false
        return
      }
      await this.destroy()
      this.editor.removeTeleporter({ id: this.id, x: this.x, y: this.y, type: "Teleporter" })
    }

    const actbtns = futor(".action-buttons", this.el)
    if (!this.passed) {
      btnRemove.remove()
      actbtns.classList.remove("triple")
    }

    this.form = futor("#object-form", this.el) as HTMLFormElement
    this.form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      this.isLocked = true
      const data: ISival = {}
      const formData = new FormData(this.form)
      formData.forEach((val, key) => {
        if (key === "obj-id") {
          data["id"] = val
          return
        }
        const key1 = key.split("-")[0]
        const key2 = key.split("-")[1]
        if (!key1 || !key2) return
        if (!data[key1]) data[key1] = {}
        if (key2 === "direction") {
          data[key1][key2] = val
        } else {
          data[key1][key2] = Number(val)
        }
      })

      this._sendToEditor(data)
    }
  }

  private async _sendToEditor(s: ISival) {
    const dataFrom = { ...s }
    delete dataFrom.id
    await this.destroy()
    this.isLocked = false
    this.editor.editTeleporter(
      s.id,
      {
        x: this.x,
        y: this.y,
        type: "Teleporter",
        from: dataFrom
      },
      this.id || null
    )
  }

  unlock() {
    this.isLocked = false
  }
  async destroy(next?: ISival): Promise<void> {
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    if (next) return next.run()
    this.editor.unlock()
  }
  run(): void {
    this._createElement()
    eroot().append(this.el)
    this._btnListener()
  }
}
