import cloud_items from "../../../../public/json/items/cloud_items.json"
import { ISival } from "../types/lib.types"
import Minigames from "../data/minigames"
import { eroot, futor, kel } from "../lib/kel"
import waittime from "../lib/waittime"
import NewObject from "./NewObject"

function createForm(): HTMLFormElement {
  const form = kel("form")
  form.action = "/uwu/newEvent"
  form.method = "POST"
  form.classList.add("form")
  return form
}
let numberChoice = 0
function createChoice(plch = "Ngga Setuju!\\No, I do not agree!", passedValue: string | null = null, checked: boolean = false) {
  numberChoice++
  const inp_id = "o" + numberChoice + Date.now().toString(36)
  const card = document.createElement("div")
  card.classList.add("opt")
  card.innerHTML = `
  <input type="text" name="opt-${inp_id}" id="opt-${inp_id}" autocomplete="off" placeholder="ex: ${plch}" maxlength="50" ${passedValue ? 'value="' + passedValue + '"' : ""} />
  <div class="opt-actions">
    <div class="opt-next">
      <input type="checkbox" name="next-${inp_id}" id="next-${inp_id}" ${checked ? "checked" : ""} />
      <label for="next-${inp_id}">Fire Next Events</label>
    </div>
    ${numberChoice > 1 ? '<div class="btn opt-remove" id="rem-' + inp_id + '"><i class="fa-solid fa-trash-can"></i></div>' : ""}
  </div>`
  const btnRem = futor(".opt-remove", card)
  if (btnRem) btnRem.onclick = () => card.remove()
  return card
}
function createPage(plch = "Aku menulis surat ini dari jarak 3000 km! \\ I wrote this letter from 3000 km!", passedValue: string | null = null) {
  numberChoice++
  const inp_id = "o" + numberChoice + Date.now().toString(36)
  const card = document.createElement("div")
  card.classList.add("opt")
  card.innerHTML = `
  <textarea name="opt-${inp_id}" id="opt-${inp_id}" maxlength="3000" placeholder="ex: ${plch}" rows="3" required>${passedValue || ""}</textarea>
  <div class="opt-actions">
    ${numberChoice > 1 ? '<div class="btn opt-remove" id="rem-' + inp_id + '"><i class="fa-solid fa-trash-can"></i></div>' : ""}
  </div>`
  const btnRem = futor(".opt-remove", card)
  if (btnRem) btnRem.onclick = () => card.remove()
  return card
}

interface IEventMethod {
  [key: string]: (...args: ISival) => HTMLFormElement
}

const EventMethod: IEventMethod = {
  textMessage(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Text Message</div>
    </div>
    <div class="field">
      <label for="who">Who - <small><i>optional</i></small></label>
      <input type="text" name="who" id="who" autocomplete="off" placeholder="ex: Encik Slamet" maxlength="40" ${s.who ? 'value="' + s.who + '"' : ""} />
    </div>
    <div class="field">
      <label for="text">Message - <small>separate languages with \\ (id\\en)</small></label>
      <textarea name="text" id="text" maxlength="1000" placeholder="ex: Dapetin kuncinya terlebih dahulu\\You need to get the key first" rows="3" required>${s.text ? s.text.id + " \\ " + s.text.en : ""}</textarea>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  teleport(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Teleport</div>
    </div>
    <div class="field">
      <label for="who">Object ID</label>
      <input type="text" autocomplete="off" name="who" id="who" placeholder="ex: Person_A01" maxlength="40" ${s.who ? 'value="' + s.who + '"' : ""} required />
    </div>
    <div class="field">
      <label for="x">Coor X</label>
      <input type="number" autocomplete="off" name="x" id="x" placeholder="ex: 9" min="-1000" max="1000" ${s.x ? 'value="' + s.x + '"' : ""} required />
    </div>
    <div class="field">
      <label for="y">Coor Y</label>
      <input type="number" autocomplete="off" name="y" id="y" placeholder="ex: 12" min="-1000" max="1000" ${s.y ? 'value="' + s.y + '"' : ""} required />
    </div>
    <div class="field">
      <label for="direction">Direction</label>
      <input list="directions"  name="direction" id="direction" placeholder="ex: down" ${s.direction ? 'value="' + s.direction + '"' : ""} required />
      <datalist id="directions">
        <option value="down"></option>
        <option value="up"></option>
        <option value="right"></option>
        <option value="left"></option>
      </datalist>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  walk(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Walk</div>
    </div>
    <div class="field">
      <label for="who">Object ID</label>
      <input type="text" autocomplete="off" name="who" id="who" placeholder="ex: Person_A01" maxlength="40" ${s.who ? 'value="' + s.who + '"' : ""} required />
    </div>
    <div class="field">
      <label for="direction">Direction</label>
      <input list="directions"  name="direction" id="direction" placeholder="ex: down" ${s.direction ? 'value="' + s.direction + '"' : ""} required />
      <datalist id="directions">
        <option value="down"></option>
        <option value="up"></option>
        <option value="right"></option>
        <option value="left"></option>
      </datalist>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  choices(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Choices</div>
    </div>
    <div class="field">
      <label for="who">Who - <small><i>optional</i></small></label>
      <input type="text" autocomplete="off" name="who" id="who" placeholder="ex: Encik Slamet" maxlength="40" ${s.who ? 'value="' + s.who + '"' : ""} />
    </div>
    <div class="field">
      <label for="text">Message - <small>separate languages with \\ (id\\en)</small></label>
      <textarea name="text" id="text" maxlength="1000" placeholder="ex: ex: Gimana? Setuju?\\Do you agree?" rows="3" required>${s.text ? s.text.id + " \\ " + s.text.en : ""}</textarea>
    </div>
    <div class="field">
      <div class="txt">Options - <small>separate languages with \\ (id\\en)</small></div>
      <div class="opts">
      </div>
      <div class="btn btn-add-opt">
        <i class="fa-solid fa-plus"></i> Add Option
      </div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    const optList = futor(".opts", form)
    if (s.options?.length >= 1) {
      s.options.forEach((opt: ISival) => {
        optList.append(createChoice("Bentar.. \\ Lemme think about this..", `${opt.text.id} \\ ${opt.text.en}`, !opt.cancel))
      })
    }
    return form
  },
  changeMap(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Change Map</div>
    </div>
    <div class="field">
      <label for="map">Map ID</label>
      <input list="maps" name="map" id="map" placeholder="ex: SafeHouse" ${s.map ? 'value="' + s.map.replace("kulon", "") + '"' : ""} required />
      <datalist id="maps" class="datalist-map">
      </datalist>
    </div>
    <div class="field">
      <label for="x">Coor X</label>
      <input type="number" name="x" id="x" autocomplete="off" placeholder="ex: 9" min="-1000" max="1000" ${typeof s.x === "number" ? 'value="' + s.x + '"' : ""} required />
    </div>
    <div class="field">
      <label for="y">Coor Y</label>
      <input type="number" name="y" id="y" autocomplete="off" placeholder="ex: 12" min="-1000" max="1000" ${typeof s.y === "number" ? 'value="' + s.y + '"' : ""} required />
    </div>
    <div class="field">
      <label for="direction">Direction</label>
      <input list="directions" name="direction" id="direction" placeholder="ex: down" ${s.direction ? 'value="' + s.direction + '"' : ""} required />
      <datalist id="directions">
        <option value="down"></option>
        <option value="up"></option>
        <option value="right"></option>
        <option value="left"></option>
      </datalist>
    </div>
    <div class="opt-actions">
      <div class="opt-next">
        <input type="checkbox" name="door" id="door"${s.door ? " checked" : ""} />
        <label for="door">Door Sound</label>
      </div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  addClaims(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Add Claims</div>
    </div>
    <div class="field">
      <label for="states">States - <small><i>separate with comma</i></small></label>
      <input type="text" name="states" id="states" autocomplete="off" placeholder="ex: TOOK_KEY, TURNED_OFF_COMPUTER" ${s.states ? 'value="' + s.states.join(", ").trim() + '"' : ""} required />
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  addFlags(mode = "Local", s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Add ${mode} States</div>
    </div>
    <div class="field">
      <label for="states">States - <small><i>separate with comma</i></small></label>
      <input type="text" name="states" id="states" autocomplete="off" placeholder="ex: TOOK_KEY, TURNED_OFF_COMPUTER" ${s.states ? 'value="' + s.states.join(", ").trim() + '"' : ""} required />
    </div>
    <div class="field">
      <label for="text">Chat Text - <small><i>optional</i> - <small>separate languages with \\ (id\\en)</small></small></label>
      <input type="text" name="text" id="text" autocomplete="off" placeholder="ex: mematikan komputer dan mengambil kunci \\ turned off the computer and took the key" maxlength="200" ${s.text ? 'value="' + s.text.id + " \\ " + s.text.en + '"' : ""} />
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  addStates(s) {
    return this.addFlags("Story", s)
  },
  addLocalFlags(s) {
    return this.addFlags("Local", s)
  },
  removeFlags(mode = "Local", s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Remove ${mode} States</div>
    </div>
    <div class="field">
      <label for="states">States - <small><i>separate with comma</i></small></label>
      <input type="text" name="states" id="states" autocomplete="off" placeholder="ex: TOOK_KEY, TURNED_OFF_COMPUTER" ${s.states ? 'value="' + s.states.join(", ").trim() + '"' : ""} required />
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  removeStates(s) {
    return this.removeFlags("Story", s)
  },
  removeLocalFlags(s) {
    return this.removeFlags("Local", s)
  },
  missionBoard() {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Mission Board</div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  minigame(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Minigame</div>
    </div>
    <div class="field">
      <label for="id">Minigame</label>
      <input list="minigames" name="id" id="id" placeholder="ex: fingclo" ${s.id ? 'value="' + s.id + '"' : ""} required />
      <datalist id="minigames">
      </datalist>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    Object.keys(Minigames).forEach((k) => {
      const opt = document.createElement("option")
      opt.value = k
      const cardList = futor("#minigames", form)
      cardList.append(opt)
    })
    return form
  },
  additem(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Add Item</div>
    </div>
    <div class="field">
      <label for="id">Item ID</label>
      <input list="items_id" name="id" id="id" placeholder="ex: J0001" ${s.id ? 'value="' + s.id + '"' : ""} required />
      <datalist id="items_id">
      </datalist>
    </div>
    <div class="field">
      <label for="amount">Amount</label>
      <input type="number" min="1" max="1000" name="amount" id="amount" autocomplete="off" placeholder="ex: 12" ${s.amount ? 'value="' + s.amount + '"' : ""} required />
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    const edatalist = futor("#items_id", form)
    cloud_items
      .filter((itm) => itm.group === "0")
      .forEach((itm) => {
        const opt = document.createElement("option")
        opt.value = itm.id
        opt.innerHTML = itm.name.en
        edatalist.append(opt)
      })
    return form
  },
  payout() {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Mission Complete</div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  backsongControl(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Backsong Control</div>
    </div>
    <div class="field">
      <div class="radios">
        <div class="radio">
          <input type="radio" id="action-pause" name="action" value="pause" required="true" ${s.action === "pause" ? "checked " : ""}/>
          <label for="action-pause">Pause</label>
        </div>
        <div class="radio">
          <input type="radio" id="action-resume" name="action" value="resume" required="true" ${s.action === "resume" ? "checked " : ""}/>
          <label for="action-resume">Resume</label>
        </div>
      </div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  playSound(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Play Sound</div>
    </div>
    <div class="field">
      <label for="src">src</label>
      <input type="txt" minlength="2" maxlength="200" name="src" id="src" autocomplete="off" placeholder="ex: 12" ${s.src ? 'value="' + s.src + '"' : ""} required />
    </div>
    <div class="field">
      <div class="txt">Type</div>
      <div class="radios">
        <div class="radio">
          <input type="radio" id="which-sfx" name="which" value="sfx" required="true" ${s.which === "sfx" ? "checked " : ""}/>
          <label for="which-sfx">SFX</label>
        </div>
        <div class="radio">
          <input type="radio" id="which-ui" name="which" value="ui" required="true" ${s.which === "ui" ? "checked " : ""}/>
          <label for="which-ui">UI</label>
        </div>
      </div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  jumpScare() {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">JumpScare</div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  },
  addnote(s) {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Add Note</div>
    </div>
    <div class="field">
      <label for="text">Note Name -  <small>separate languages with \\ (id\\en)</small></label>
      <input type="text" autocomplete="off" name="text" id="text" placeholder="ex: Note #2" maxlength="1000" value="${s.text ? s.text.id + " \\ " + s.text.en : ""}" required />
    </div>
    <div class="field">
      <div class="txt">Page Content - <small>separate languages with \\ (id\\en)</small></div>
      <div class="opts">
      </div>
      <div class="btn btn-add-opt">
        <i class="fa-solid fa-plus"></i> Add Option
      </div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    const optList = futor(".opts", form)
    if (s.pages?.length >= 1) {
      s.pages.forEach((opt: ISival) => {
        optList.append(createPage("Bentar.. \\ Lemme think about this..", `${opt.id} \\ ${opt.en}`))
      })
    }
    return form
  },
  readnote() {
    const form = createForm()
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Read Current Note</div>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`
    return form
  }
}

export interface INewEventConfig {
  type: string
  mode: string
  objectEditor: NewObject
  passed?: ISival
}

export default class NewEvent {
  private objectEditor: NewObject
  private type: string
  private mode: string
  private passed?: ISival = null
  private isLocked: boolean = false
  private el: HTMLDivElement = kel("div", "newArea")
  private form!: HTMLFormElement
  constructor(config: INewEventConfig) {
    this.objectEditor = config.objectEditor
    this.type = config.type
    this.mode = config.mode
    this.passed = config.passed
  }
  private _btnListener(): void {
    const btnClose = futor(".btn-cancel", this.form)
    btnClose.onclick = () => this.destroy()
  }
  private _setForm(): void {
    this.form = EventMethod[this.type](this.passed || {})
    this.el.append(this.form)
    if (this.type === "choices") this._choicesModifier()
    if (this.type === "addnote") this._notesModifier()
    if (this.type === "changeMap") this._mapSeeks()
    this._formListener()
  }
  private _choicesModifier(): void {
    const optList = futor(".opts", this.form)
    if (!this.passed || this.passed?.options?.length < 1) {
      optList.append(createChoice("Oke, setuju!\\Yes, I do!", null, true))
      optList.append(createChoice())
    }
    const btnAdd = futor(".btn-add-opt", this.form)
    btnAdd.onclick = () => {
      const newOpt = createChoice("Bentar.. \\ Lemme think about this..")
      optList.append(newOpt)
    }
  }
  private _notesModifier(): void {
    const optList = futor(".opts", this.form)
    if (!this.passed || this.passed?.options?.length < 1) {
      optList.append(createPage())
    }
    const btnAdd = futor(".btn-add-opt", this.form)
    btnAdd.onclick = () => optList.append(createPage())
  }
  private _mapSeeks(): void {
    const emaplist = futor(".datalist-map", this.form)
    const mapdata = this.objectEditor.Editor.data
    Object.keys(mapdata).forEach((k) => {
      const card = document.createElement("option")
      card.value = k.replace("kulon", "")
      emaplist.append(card)
    })
  }
  private _formListener(): void {
    this.form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      this.isLocked = true
      const data: ISival = {}
      const formData = new FormData(this.form)
      formData.forEach((val, key) => {
        if (val.toString().length >= 1) {
          let valToInsert: string | number = val.toString()
          if (key === "x" || key === "y") valToInsert = Number(val)
          data[key] = valToInsert
        }
      })
      data["type"] = this.type
      this.isLocked = false
      await this.destroy()
      this.objectEditor.createEvent(this.type, data, this.mode, this.passed?._n || null)
    }
  }
  async destroy(next?: ISival) {
    this.el.classList.add("out")
    await waittime()
    numberChoice = 0
    this.el.remove()
    this.objectEditor.unlock()
    if (next) next.run()
  }
  run() {
    eroot().append(this.el)
    this._setForm()
    this._btnListener()
  }
}
