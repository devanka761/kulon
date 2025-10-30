import asset from "../data/assets"
import modal from "../lib/modal"
import NewEvent from "./NewEvent"
import Editor from "./Editor"
import { ISival } from "../types/lib.types"
import { eroot, futor, kel, qutor } from "../lib/kel"
import { GameObjectData } from "../types/maps.types"
import waittime from "../lib/waittime"

export interface INewObjectConfig {
  x: number
  y: number
  editor: Editor
  passed: ISival
  isSpace: boolean
}

export default class NewObject {
  private x: number
  private y: number
  private editor: Editor
  private el: HTMLDivElement = kel("div", "newArea")
  private form!: HTMLFormElement
  private passed: ISival
  private isSpace: boolean
  private isLocked: boolean = false
  private flagNumber: number = 0
  private evtNumber: number = 0
  private defaultEvents: ISival = {}
  private flagEvents: ISival = {}

  constructor(
    config: INewObjectConfig,
    private finishEvent: boolean = false
  ) {
    this.x = config.x
    this.y = config.y
    this.editor = config.editor
    this.passed = config.passed
    this.isSpace = config.isSpace
  }
  get Editor(): Editor {
    return this.editor
  }
  private _createElement(): void {
    this.el.innerHTML = `
    <form action="/uwu/newObject" method="post" class="form" id="object-form">
      <div class="field onObject">
        <div class="title">Tile Object</div>
      </div>
      <div class="field onSpace">
        <div class="title">Tile Cutscene Space</div>
      </div>
      <div class="field onFinish">
        <div class="title">On Mission Completed</div>
      </div>
      <div class="field onObject">
        <label for="obj-id">Object ID</label>
        <input type="text" name="obj-id" id="obj-id" maxlength="40" autocomplete="off" placeholder="ex: Computer_B_Desk" required />
      </div>
      <div class="field onObject">
        <label for="obj-type">Object Type</label>
        <input list="objs-type" name="obj-type" id="obj-type" placeholder="ex: Interactable" required />
        <datalist id="objs-type">
          <option value="Person"></option>
          <option value="Interactable"></option>
          <option value="Prop"></option>
        </datalist>
      </div>
      <div class="field onObject">
        <label for="obj-src">Image Source</label>
        <input list="objs-src" name="obj-src" id="obj-src" placeholder="ex: computer_highend" required />
        <datalist id="objs-src">
        </datalist>
      </div>
      <div class="field onObject">
        <div class="txt">Shadow</div>
        <div class="radios">
          <div class="radio">
            <input type="radio" id="noshadow-false" name="obj-noShadow" value="false" required />
            <label for="noshadow-false">Use Shadow</label>
          </div>
          <div class="radio">
            <input type="radio" id="noshadow-true" name="obj-noShadow" value="true" required checked />
            <label for="noshadow-true">No Shadow</label>
          </div>
        </div>
      </div>
      <div class="field onObject">
        <label for="obj-collision">Collision Box</label>
        <input type="text" name="obj-collision" id="obj-collision" placeholder="0,0,1,1 (x,y,width,height)" autocomplete="off" />
      </div>
      <div class="field onObject">
        <label for="obj-offset-x">Animation Frames Length</label>
        <input type="number" min="1" max="20" name="obj-offset-x" id="obj-offset-x" placeholder="ex: 7" autocomplete="off" required />
      </div>
      <div class="field onObject">
        <div class="txt">2nd Animation once Has Flag</div>
        <div class="radios">
          <div class="radio">
            <input type="radio" id="next-false" name="obj-offset-y" value="0" required checked />
            <label for="next-false">No</label>
          </div>
          <div class="radio">
            <input type="radio" id="next-true" name="obj-offset-y" value="1" required />
            <label for="next-true">Yes</label>
          </div>
        </div>
      </div>
      <div class="field onObject">
        <label for="obj-flag">2nd Animation's Flag</label>
        <input type="text" name="obj-flag" id="obj-flag" maxlength="40" autocomplete="off" placeholder="ex: TURNED_OFF_COMPUTER" />
      </div>
      <div class="field onObject onSpace">
        <div class="txt">Flag Type</div>
        <div class="radios triple">
          <div class="radio">
            <input type="radio" id="flag-none" name="obj-flag-type" value="none" required checked />
            <label for="flag-none">None</label>
          </div>
          <div class="radio">
            <input type="radio" id="flag-local" name="obj-flag-type" value="local" required />
            <label for="flag-local">Local</label>
          </div>
          <div class="radio">
            <input type="radio" id="flag-story" name="obj-flag-type" value="story" required />
            <label for="flag-story">Story</label>
          </div>
        </div>
      </div>
      <div class="field onObject onSpace onFinish">
        <div class="txt">Default Events</div>
        <div class="evt evt-default">
        </div>
        <div class="btn btn-evt add-default-evt"><i class="fa-solid fa-plus"></i> Add Event</div>
      </div>
      <div class="hasFlag">
      </div>
      <div class="field onObject onSpace">
        <div class="btn btn-add-hasflag">
          <i class="fa-solid fa-plus"></i> Add Has Flag
        </div>
      </div>
      <div class="field onObject onSpace onFinish">
        <div class="action-buttons buttons triple">
          <div class="btn btn-remove">DELETE</div>
          <div class="btn btn-cancel">CANCEL</div>
          <button class="btn btn-ok" type="submit">OK</button>
        </div>
      </div>
    </form>`
  }
  private _writeID(val: string): void {
    const el = futor("#obj-id", this.el) as HTMLInputElement
    el.value = val
  }
  private _writeType(val: string): void {
    const el = futor("#obj-type", this.el) as HTMLInputElement
    el.value = val
  }
  private _writeSrc(val?: string): void {
    const el = futor("#obj-src", this.el) as HTMLInputElement
    el.value = (val || "null").toString()
  }
  private _writeNoShadow(val: string): void {
    const el = this.el.querySelectorAll(`[name="obj-noshadow"]`) as NodeListOf<HTMLInputElement>
    el.forEach((eobj) => {
      if (eobj.getAttribute("id") === `noshadow-${val.toString()}`) {
        eobj.checked = true
      } else {
        eobj.checked = false
      }
    })
  }
  private _writeOffsetX(val: string): void {
    const el = futor("#obj-offset-x", this.el) as HTMLInputElement
    el.value = val
  }
  private _writeCollision(val?: number[]): void {
    const el = futor("#obj-collision", this.el) as HTMLInputElement
    el.value = val?.join(", ") || "0, 0, 1, 1"
  }
  private _writeOffsetY(val: string): void {
    const el = this.el.querySelectorAll(`[name="obj-offset-y"]`) as NodeListOf<HTMLInputElement>
    el.forEach((eobj) => {
      if (eobj.getAttribute("id") === `next-${Boolean(val)}`) {
        eobj.checked = true
      } else {
        eobj.checked = false
      }
    })
  }
  private _writeFlType(s: ISival): void {
    const el = this.el.querySelectorAll(`[name="obj-flag-type"]`) as NodeListOf<HTMLInputElement>
    const isStory = s.find((fl: ISival) => fl.required)
    const isLocal = s.find((fl: ISival) => fl.local_req)

    let ftype = "none"
    if (isStory) {
      ftype = "story"
    } else if (isLocal) {
      ftype = "local"
    }

    el.forEach((eobj) => {
      if (eobj.getAttribute("id") === `flag-${ftype}`) {
        eobj.checked = true
      } else {
        eobj.checked = false
      }
    })
  }
  private _writeFlag(val?: string): void {
    const el = futor("#obj-flag", this.el) as HTMLInputElement
    el.value = val ?? ""
  }
  private _writeFlagEvents(s: ISival): void {
    const isStory = s.filter((fl: ISival) => fl.required)
    const isLocal = s.filter((fl: ISival) => fl.local_req)

    let currEvent: ISival = null,
      currReq: string | null = null
    if (isStory.length >= 1) {
      currEvent = isStory
      currReq = "required"
    }
    if (isLocal.length >= 1) {
      currEvent = isLocal
      currReq = "local_req"
    }
    if (!currEvent || !currReq) return

    currEvent.forEach((evtObject: ISival) => {
      this._setNewHasFlag(evtObject, evtObject[currReq])
    })
  }

  private _setNewHasFlag(talk: ISival = null, flagReq: ISival = null): void {
    const fieldKey = "fk" + this.flagNumber + "_" + Date.now().toString(36)
    if (!this.flagEvents[fieldKey]) this.flagEvents[fieldKey] = {}
    this.flagNumber++
    const field = kel("div")
    field.id = fieldKey
    field.classList.add("field", "onObject", "onSpace")
    field.innerHTML = `
    <div class="txts"><span>Has Flag Events</span><div class="btn btn-rem-field rem-${fieldKey}"><i class="fa-solid fa-circle-x"></i></div></div>
    <input class="evt-inp" type="text" name="talk-${fieldKey}" id="talk-${fieldKey}" autocomplete="off" placeholder="Flags Required | ex: KEY_LOST,NO_FUEL" required />
    <div class="evt evt-flag" k-flagkey="${fieldKey}">
    </div>
    <div class="btn btn-evt add-flag-evt"><i class="fa-solid fa-plus"></i> Add Event</div>`
    const btnAddEvt = futor(".add-flag-evt", field)
    btnAddEvt.onclick = () => this._editEvt(fieldKey)
    const btnRemField = futor(".btn-rem-field", field)
    btnRemField.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const confRem = await modal.confirm("Delete This Has Flag Events?")
      if (!confRem) {
        this.isLocked = false
        return
      }
      delete this.flagEvents[fieldKey]
      field.remove()
      this.isLocked = false
    }
    const ehasFlags = futor(".hasFlag", this.el)
    ehasFlags.append(field)
    if (talk) {
      const inp = qutor(".evt-inp", field) as HTMLInputElement
      inp.value = flagReq.join(", ")
      talk.events.forEach((evt: ISival) => {
        this._addEvent(evt.type, evt, fieldKey)
      })
    }
  }
  private _writeDefaultEvents(s: ISival): void {
    const currEvent = s.find((fl: ISival) => !fl.required && !fl.local_req) || null
    if (!currEvent) return
    currEvent.events.forEach((evt: ISival) => {
      this._addEvent(evt.type, evt)
    })
  }
  private _writeObjSrcDatalist(): void {
    const el = futor("#objs-src", this.el) as HTMLDataListElement
    Object.keys(asset)
      .filter((k) => asset[k].src.includes("props"))
      .forEach((k) => {
        const opt = kel("option")
        opt.value = k
        el.append(opt)
      })
  }
  private _renderData(): void {
    if (this.passed) {
      if (!this.isSpace) {
        this._writeID(this.passed.id)
        this._writeType(this.passed.type)
        this._writeSrc(this.passed.src || null)
        this._writeNoShadow(this.passed.noShadow || false)
        this._writeOffsetX(this.passed.offset?.[0] || 1)
        this._writeCollision(this.passed.collision)
        this._writeOffsetY(this.passed.offset?.[1] || 0)
        this._writeFlag(this.passed.states || null)
      }
      this._writeFlType(this.isSpace ? this.passed[this.passed.id] || [] : this.passed.talk || [])
      this._writeDefaultEvents(this.isSpace ? this.passed[this.passed.id] || [] : this.passed.talk || [])
      this._writeFlagEvents(this.isSpace ? this.passed[this.passed.id] || [] : this.passed.talk || [])
    }
    if (!this.isSpace) this._writeObjSrcDatalist()
  }
  private _btnListener(): void {
    const btnCancel = futor(".btn-cancel", this.el)
    btnCancel.onclick = () => this.destroy()

    const btnAddHasFlag = futor(".btn-add-hasflag", this.el)
    btnAddHasFlag.onclick = () => this._setNewHasFlag()

    const btnRemove = futor(".btn-remove", this.el)
    btnRemove.onclick = async () => {
      if (this.isLocked) return
      this.isLocked = true
      const confDel = await modal.confirm(`Delete this ${this.isSpace ? "space" : "object"}?`)
      if (!confDel) {
        this.isLocked = false
        return
      }
      await this.destroy()
      if (this.isSpace) {
        this.editor.removeSpace(this.passed.id)
      } else {
        this.editor.removeObject(this.passed)
      }
    }

    const actbtns = futor(".action-buttons", this.el)

    if (this.finishEvent || !this.passed) {
      btnRemove.remove()
      actbtns.classList.remove("triple")
    }

    const editDefaultEvt = futor(".add-default-evt", this.el)
    editDefaultEvt.onclick = () => this._editEvt()

    if (this.finishEvent) {
      const fields = this.el.querySelectorAll(".field")
      fields.forEach((field) => {
        if (!field.classList.contains("onFinish")) field.remove()
      })
    } else if (this.isSpace) {
      const fields = this.el.querySelectorAll(".field")
      fields.forEach((field) => {
        if (!field.classList.contains("onSpace")) field.remove()
      })
    } else {
      const fields = this.el.querySelectorAll(".field")
      fields.forEach((field) => {
        if (!field.classList.contains("onObject")) field.remove()
      })
    }

    this.form = futor("#object-form", this.el) as HTMLFormElement
    this.form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      this.isLocked = true
      const data: ISival = {}
      const formData = new FormData(this.form)
      formData.forEach((val, key) => {
        data[key.replace("obj-", "")] = val
      })

      if (Object.keys(this.flagEvents).length >= 1) {
        if (data["flag-type"] !== "local" && data["flag-type"] !== "story") {
          await modal.alert('Flag Type must be set to "Local" or "Story"')
          this.isLocked = false
          return
        }
      }
      this._sendToEditor(data)
    }
  }
  private async _editEvt(mode: string | null = null): Promise<void> {
    if (this.isLocked) return
    this.isLocked = true
    const typelist = [
      { id: "textMessage", label: "Text Message" },
      { id: "changeMap", label: "Change Map", activated: true },
      { id: "addStates", label: "Add Story Flag" },
      { id: "removeStates", label: "Remove Story Flag" },
      { id: "addClaims", label: "Add Claims" },
      { id: "additem", label: "Add Item" },
      { id: "teleport", label: "Teleport" },
      { id: "walk", label: "Walk" },
      { id: "choices", label: "Choices" },
      { id: "addLocalFlags", label: "Add Local Flag" },
      { id: "removeLocalFlags", label: "Remove Local Flag" },
      { id: "minigame", label: "Minigame" },
      { id: "backsongControl", label: "Backsong Controls" },
      { id: "playSound", label: "Play Sound" },
      { id: "payout", label: "Mission Complete" },
      { id: "missionBoard", label: "Mission Board" },
      { id: "jumpScare", label: "JumpScare" },
      { id: "addnote", label: "Add Note" },
      { id: "readnote", label: "Read Current Note" }
    ]
    const setType = await modal.select({
      msg: "Select Event Type",
      ic: "person-walking",
      items: typelist
    })
    if (!setType) {
      this.isLocked = false
      return
    }
    const newEvent = new NewEvent({ type: setType, mode: mode as string, objectEditor: this })
    newEvent.run()
  }
  private _addEvent(event_type: string, s: ISival, flagKey: string | null = null, existkey: string | null = null): void {
    const eventID = existkey || "evt" + this.evtNumber + "_" + Date.now().toString(36)
    if (!existkey) this.evtNumber++
    const card = existkey ? futor(`[k-evtid="${eventID}"]`, this.el) : kel("div", "card")
    card.setAttribute("k-evtid", eventID)
    card.innerHTML = `
    <div class="card-desc">${event_type}</div>
    <div class="btn card-act" title="Delete Event"><i class="fa-solid fa-trash-can"></i></div>`
    if (flagKey) {
      if (!this.flagEvents[flagKey]) this.flagEvents[flagKey] = {}
      if (!this.flagEvents[flagKey].events) this.flagEvents[flagKey].events = {}
      this.flagEvents[flagKey].events[eventID] = s
      const fgEvtList = futor(`[k-flagkey="${flagKey}"]`, this.el)
      if (!existkey) fgEvtList.append(card)
    } else {
      this.defaultEvents[eventID] = s
      if (!existkey) {
        const el = futor(".evt-default", this.el)
        el.append(card)
      }
    }
    const btnEdit = futor(".card-desc", card)
    btnEdit.onclick = () => {
      if (this.isLocked) return
      this.isLocked = true
      const newEvent = new NewEvent({
        type: event_type,
        mode: flagKey as string,
        objectEditor: this,
        passed: { ...s, _n: eventID }
      })
      newEvent.run()
    }
    const btnDelete = futor(".card-act", card)
    btnDelete.onclick = () => {
      if (flagKey) {
        delete this.flagEvents[flagKey].events[eventID]
      } else {
        delete this.defaultEvents[eventID]
      }
      card.remove()
    }
  }
  createEvent(event_type: string, s: ISival, flagKey: string, existkey: string | null = null): void {
    this.unlock()
    if (["addClaims", "addStates", "addLocalFlags", "removeLocalFlags", "removeStates"].includes(event_type)) {
      s.states = s.states.replace(/\s/g, "")
      s.states = s.states.split(",")
    } else if (event_type === "choices") {
      const currOpt: ISival = {}
      Object.keys(s).forEach((k) => {
        if (k.includes("opt-")) {
          const currIdx = k.replace("opt-", "")
          if (!currOpt[currIdx]) currOpt[currIdx] = {}
          currOpt[currIdx].text = {}
          const sprTxt = s[k].split("\\")
          currOpt[currIdx].text.id = sprTxt[0].trim()
          currOpt[currIdx].text.en = (sprTxt[1] || sprTxt[0]).trim()
          delete s[`opt-${currIdx}`]
          if (s[`next-${currIdx}`]) {
            delete s[`next-${currIdx}`]
          } else {
            currOpt[currIdx].cancel = true
          }
        }
      })
      s.options = Object.values(currOpt)
    } else if (event_type === "addnote") {
      const currOpt: ISival = {}
      Object.keys(s).forEach((k) => {
        if (k.includes("opt-")) {
          const currIdx = k.replace("opt-", "")
          if (!currOpt[currIdx]) currOpt[currIdx] = {}
          const sprTxt = s[k].split("\\")
          currOpt[currIdx].id = sprTxt[0].trim()
          currOpt[currIdx].en = (sprTxt[1] || sprTxt[0]).trim()
          delete s[`opt-${currIdx}`]
        }
      })
      s.id = this.passed.id
      s.pages = Object.values(currOpt)
    } else if (event_type === "readnote") {
      s.id = this.passed.id
    }
    if (s.text) {
      const sprTxt = s.text.split("\\")
      s.text = {}
      s.text.id = sprTxt[0].trim()
      s.text.en = (sprTxt[1] || sprTxt[0]).trim()
    }
    if (s.door) s.door = true
    if (s.map) s.map = "kulon" + s.map
    this._addEvent(event_type, s, flagKey, existkey)
  }
  private _sendToEditor(s: ISival): void {
    if (this.finishEvent) {
      this._sendByFinish()
    } else if (this.isSpace) {
      this._sendBySpace(s)
    } else {
      this._sendByObject(s)
    }
  }
  private async _sendBySpace(s: ISival): Promise<void> {
    const data: ISival = {}
    const defEvt = this.defaultEvents
    if (Object.keys(defEvt).length < 1) {
      await modal.alert("Please add at least 1 default event to submit")
      this.isLocked = false
      return
    }
    const flgEvt = this.flagEvents
    const coors = `${this.x},${this.y}`
    if (Object.keys(defEvt).length >= 1 || Object.keys(flgEvt).length >= 1) {
      data[coors] = []
      if (Object.keys(flgEvt).length >= 1) {
        Object.keys(flgEvt).forEach((flagKey) => {
          const recog = s["flag-type"] === "local" ? "local_req" : "required"
          const ereqs = futor(`#talk-${flagKey}`, this.el) as HTMLInputElement
          data[coors].push({
            [recog]: ereqs.value.replace(/\s/g, "").split(","),
            events: Object.values(flgEvt[flagKey].events || {})
          })
        })
      }
      data[coors].push({ events: Object.values(defEvt) })
    }
    if (!data[coors] || data[coors].length < 1) {
      await modal.alert("Please add at least 1 event to submit")
      this.isLocked = false
      return
    }
    await this.destroy()
    this.isLocked = false
    if (data[coors]) {
      this.editor.editSpace(coors, data)
    }
  }
  private async _sendByObject(s: ISival): Promise<void> {
    const data: GameObjectData = {
      type: s.type,
      x: this.x,
      y: this.y,
      src: s.src,
      shadow: s.noShadow === "true" ? false : true,
      offset: undefined,
      collision: undefined,
      talk: undefined,
      states: undefined
    }
    if (s["collision"]) {
      const colls = s.collision.split(",").map((coll: string) => Number(coll.trim()))
      if (colls.length === 4) data.collision = colls
    }
    if (s["offset-x"]) {
      data.offset = []
      data.offset.push(Number(s["offset-x"]))
      data.offset.push(s["offset-y"] === "1" ? 1 : 0)
    }
    if ((s.flag?.length || 0) >= 1) {
      s.flag = s.flag.replace(/\s/g, "")
      s.flag = s.flag.split(",")
      data.states = s.flag
    }
    if ((s.states?.length || 0) >= 1) {
      data.states = s.states
    }
    const defEvt = this.defaultEvents
    const flgEvt = this.flagEvents
    if (Object.keys(defEvt).length >= 1 || Object.keys(flgEvt).length >= 1) {
      data.talk = []
      if (Object.keys(flgEvt).length >= 1) {
        Object.keys(flgEvt).forEach((flagKey) => {
          const recog = s["flag-type"] === "local" ? "local_req" : "required"
          const ereqs = futor(`#talk-${flagKey}`, this.el) as HTMLInputElement
          data.talk?.push({
            [recog]: ereqs.value.replace(/\s/g, "").split(","),
            events: Object.values(flgEvt[flagKey].events || {})
          })
        })
      }
      data.talk.push({ events: Object.values(defEvt) })
    }
    await this.destroy()
    this.isLocked = false
    this.editor.editObject(s.id, data, this.passed?.id || null)
  }
  private async _sendByFinish(): Promise<void> {
    const defEvt = this.defaultEvents
    await this.destroy()
    this.isLocked = false
    this.editor.editFinish(Object.values(defEvt))
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
    this._renderData()
  }
}
