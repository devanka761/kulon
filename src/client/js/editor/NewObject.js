import modal from "../helper/modal.js";
import asset from "../manager/asset.js";
import NewEvent from "./NewEvent.js";

export default class NewObject {
  constructor({ x, y, editor, passed, isSpace }, finishEvent = false) {
    this.x = x;
    this.y = y;
    this.editor = editor;
    this.passed = passed;
    this.isSpace = isSpace;
    this.isLocked = false;
    this.defaultEvents = {};
    this.flagEvents = {};
    this.flagNumber = 0;
    this.evtNumber = 0;
    this.finishEvent = finishEvent;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("newArea");
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
        <input list="objs-type" name="obj-type" id="obj-type" placeholder="ex: StaticLocal" required />
        <datalist id="objs-type">
          <option value="Person"></option>
          <option value="StaticLocal"></option>
          <option value="StaticCloud"></option>
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
    </form>`;
  }
  writeID(val) {
    this.objid.value = val;
  }
  writeType(val) {
    this.objtype.value = val;
  }
  writeSrc(val) {
    this.objsrc.value = (val || "null").toString();
  }
  writeNoShadow(val) {
    this.objnoshadow.forEach(eobj => {
      if(eobj.getAttribute("id") === `noshadow-${val.toString()}`) {
        eobj.checked = true;
      } else {
        eobj.checked = false;
      }
    });
  }
  writeOffsetX(val) {
    this.objoffsetx.value = val;
  }
  writeOffsetY(val) {
    this.objoffsety.forEach(eobj => {
      if(eobj.getAttribute("id") === `next-${Boolean(val)}`) {
        eobj.checked = true;
      } else {
        eobj.checked = false;
      }
    });
  }
  writeFlType(s) {
    const isStory = s.find(fl => fl.required);
    const isLocal = s.find(fl => fl.local_req);

    let ftype = "none";
    if(isStory) {
      ftype = "story";
    } else if(isLocal) {
      ftype = "local";
    }

    this.objfltype.forEach(eobj => {
      if(eobj.getAttribute("id") === `flag-${ftype}`) {
        eobj.checked = true;
      } else {
        eobj.checked = false;
      }
    });
  }
  writeFlag(val) {
    this.objflag.value = val ?? "";
  }
  writeFlagEvents(s) {
    const isStory = s.filter(fl => fl.required);
    const isLocal = s.filter(fl => fl.local_req);

    let currEvent = null, currReq = null;
    if(isStory.length >= 1) currEvent = isStory, currReq = "required";
    if(isLocal.length >= 1) currEvent = isLocal, currReq = "local_req";
    if(!currEvent) return;
    currEvent.forEach(evtObject => {
      this.setNewHasFlag(evtObject, evtObject[currReq]);
    });
  }
  setNewHasFlag(talk=null, flagReq=null) {
    const fieldKey = "fk" + this.flagNumber + "_" + Date.now().toString(36);
    if(!this.flagEvents[fieldKey]) this.flagEvents[fieldKey] = {};
    this.flagNumber++;
    const field = document.createElement("div");
    field.id = fieldKey;
    field.classList.add("field", "onObject", "onSpace");
    field.innerHTML = `
    <div class="txts"><span>Has Flag Events</span><div class="btn btn-rem-field rem-${fieldKey}"><i class="fa-solid fa-circle-x"></i></div></div>
    <input class="evt-inp" type="text" name="talk-${fieldKey}" id="talk-${fieldKey}" autocomplete="off" placeholder="Flags Required | ex: KEY_LOST,NO_FUEL" required />
    <div class="evt evt-flag" k-flagkey="${fieldKey}">
    </div>
    <div class="btn btn-evt add-flag-evt"><i class="fa-solid fa-plus"></i> Add Event</div>`;
    const btnAddEvt = field.querySelector(".add-flag-evt");
    btnAddEvt.onclick = () => this.editEvt(fieldKey);
    const btnRemField = field.querySelector(".btn-rem-field");
    btnRemField.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const confRem = await modal.confirm("Delete This Has Flag Events?");
      if(!confRem) {
        this.isLocked = false;
        return;
      }
      delete this.flagEvents[fieldKey];
      field.remove();
      this.isLocked = false;
    }
    const ehasFlags = this.el.querySelector(".hasFlag");
    ehasFlags.append(field);
    if(talk) {
      const inp = field.querySelector(".evt-inp");
      inp.value = flagReq.join(", ");
      talk.events.forEach(evt => {
        this.addEvent(evt.type, evt, fieldKey);
      });
    }
  }
  writeDefaultEvents(s) {
    const currEvent = s.find(fl => !fl.required && !fl.local_req) || null;
    if(!currEvent) return;
    currEvent.events.forEach(evt => {
      this.addEvent(evt.type, evt);
    });
  }
  writeObjSrcDatalist() {
    Object.keys(asset).filter(k => asset[k].src.includes("props")).forEach(k => {
      const opt = document.createElement("option");
      opt.value = k;
      this.objsrcdatalist.append(opt);
    });
  }
  renderData() {
    this.objid = this.el.querySelector("#obj-id");
    this.objtype = this.el.querySelector("#obj-type");
    this.objsrc = this.el.querySelector("#obj-src");
    this.objsrcdatalist = this.el.querySelector("#objs-src");
    this.objnoshadow = this.el.querySelectorAll(`[name="obj-noshadow"]`);
    this.objoffsetx = this.el.querySelector("#obj-offset-x");
    this.objoffsety = this.el.querySelectorAll(`[name="obj-offset-y"]`);
    this.objfltype = this.el.querySelectorAll(`[name="obj-flag-type"]`);
    this.evtdefault = this.el.querySelector(".evt-default");
    this.evtflag = this.el.querySelector(".evt-flag");
    this.objflag = this.el.querySelector("#obj-flag");

    if(this.passed) {
      if(!this.isSpace) {
        this.writeID(this.passed.id);
        this.writeType(this.passed.type);
        this.writeSrc(this.passed.src || null);
        this.writeNoShadow(this.passed.noShadow || false);
        this.writeOffsetX(this.passed.offset?.[0] || 1);
        this.writeOffsetY(this.passed.offset?.[1] || 0);
        this.writeFlag(this.passed.localFlags || this.passed.storyFlags || null);
      }
      this.writeFlType(this.isSpace ? (this.passed[this.passed.id] || []) : (this.passed.talking || []));
      this.writeDefaultEvents(this.isSpace ? (this.passed[this.passed.id] || []) : (this.passed.talking || []));
      this.writeFlagEvents(this.isSpace ? (this.passed[this.passed.id] || []) : (this.passed.talking || []));
    }
    if(!this.isSpace) this.writeObjSrcDatalist();
  }
  btnListener() {
    const btnCancel = this.el.querySelector(".btn-cancel");
    btnCancel.onclick = () => this.destroy();

    const btnAddHasFlag = this.el.querySelector(".btn-add-hasflag");
    btnAddHasFlag.onclick = () => this.setNewHasFlag();

    const btnRemove = this.el.querySelector(".btn-remove");
    btnRemove.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const confDel = await modal.confirm(`Delete this ${this.isSpace ? "space" : "object"}?`);
      if(!confDel) {
        this.isLocked = false;
        return;
      }
      await this.destroy();
      if(this.isSpace) {
        this.editor.removeSpace(this.passed.id);
      } else {
        this.editor.removeObject(this.passed);
      }
    }

    const actbtns = this.el.querySelector(".action-buttons");

    if(this.finishEvent || !this.passed) {
      btnRemove.remove();
      actbtns.classList.remove("triple");
    }

    const editDefaultEvt = this.el.querySelector(".add-default-evt");
    editDefaultEvt.onclick = () => this.editEvt();

    if(this.finishEvent) {
      const fields = this.el.querySelectorAll(".field");
      fields.forEach(field => {
        if(!field.classList.contains("onFinish")) field.remove();
      });
    } else if(this.isSpace) {
      const fields = this.el.querySelectorAll(".field");
      fields.forEach(field => {
        if(!field.classList.contains("onSpace")) field.remove();
      });
    } else {
      const fields = this.el.querySelectorAll(".field");
      fields.forEach(field => {
        if(!field.classList.contains("onObject")) field.remove();
      });
    }

    this.form = this.el.querySelector("#object-form");
    this.form.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      this.isLocked = true;
      const data = {};
      const formData = new FormData(this.form);
      formData.forEach((val, key) => {
        data[key.replace("obj-", "")] = val;
      });

      if(Object.keys(this.flagEvents).length >= 1) {
        if(data["flag-type"] !== "local" && data["flag-type"] !== "story") {
          await modal.alert("Flag Type must be set to \"Local\" or \"Story\"");
          this.isLocked = false;
          return;
        }
      }
      this.sendToEditor(data);
    }
  }
  async editEvt(mode=null) {
    if(this.isLocked) return;
    this.isLocked = true;
    const typelist = [
      {id: "textMessage", label: "Text Message"},
      {id: "teleport", label: "Teleport"},
      {id: "choices", label: "Choices"},
      {id: "changeMap", label: "Change Map", actived: true},
      {id: "minigame", label: "Minigame"},
      {id: "missionBoard", label: "Mission Board"},
      {id: "addStoryFlag", label: "Add Story Flag"},
      {id: "removeStoryFlag", label: "Remove Story Flag"},
      {id: "additem", label: "Add Item"},
      {id: "addLocalFlag", label: "Add Local Flag"},
      {id: "removeLocalFlag", label: "Remove Local Flag"},
      {id: "MissionCompleted", label: "Mission Complete"},
    ];
    const setType = await modal.select({
      msg: "Select Event Type",
      ic: "person-walking",
      opt: {
        name: "event-type",
        items: typelist
      }
    });
    if(!setType) {
      this.isLocked = false;
      return;
    }
    const newEvent = new NewEvent({ type: setType, mode, objectEditor: this });
    newEvent.run();
  }
  addEvent(event_type, s, flagKey=null, existkey=null) {
    const eventID = existkey || "evt" + this.evtNumber + "_" + Date.now().toString(36);
    if(!existkey) this.evtNumber++;
    const card = existkey ? this.el.querySelector(`[k-evtid="${eventID}"]`) : document.createElement("div");
    card.classList.add("card");
    card.setAttribute("k-evtid", eventID);
    card.innerHTML = `
    <div class="card-desc">${event_type}</div>
    <div class="btn card-act" title="Delete Event"><i class="fa-solid fa-trash-can"></i></div>`;
    if(flagKey) {
      if(!this.flagEvents[flagKey]) this.flagEvents[flagKey] = {};
      if(!this.flagEvents[flagKey].events) this.flagEvents[flagKey].events = {};
      this.flagEvents[flagKey].events[eventID] = s;
      const fgEvtList = this.el.querySelector(`[k-flagkey="${flagKey}"]`);
      if(!existkey) fgEvtList.append(card);
    } else {
      this.defaultEvents[eventID] = s;
      if(!existkey) this.evtdefault.append(card);
    }
    const btnEdit = card.querySelector(".card-desc");
    btnEdit.onclick = () => {
      if(this.isLocked) return;
      this.isLocked = true;
      const newEvent = new NewEvent({
        type: event_type, mode:flagKey,
        objectEditor: this, passed: {...s, _n: eventID}
      });
      newEvent.run();
    }
    const btnDelete = card.querySelector(".card-act");
    btnDelete.onclick = () => {
      if(flagKey) {
        delete this.flagEvents[flagKey].events[eventID];
      } else {
        delete this.defaultEvents[eventID];
      }
      card.remove();
    }
  }
  createEvent(event_type, s, flagKey, existkey=null) {
    this.unlock();
    if(["addStoryFlag","addLocalFlag","removeLocalFlag","removeStoryFlag"].includes(event_type)) {
      s.flag = s.flag.replace(/\s/g, "");
      s.flag = s.flag.split(",");
    } else if(event_type === "choices") {
      const currOpt = {};
      Object.keys(s).forEach(k => {
        if(k.includes("opt-")) {
          const currIdx = k.replace("opt-", "");
          if(!currOpt[currIdx]) currOpt[currIdx] = {};
          currOpt[currIdx].text = {};
          const sprTxt = s[k].split("\\");
          currOpt[currIdx].text.id = sprTxt[0].trim();
          currOpt[currIdx].text.en = (sprTxt[1] || sprTxt[0]).trim();
          delete s[`opt-${currIdx}`];
          if(s[`next-${currIdx}`]) {
            delete s[`next-${currIdx}`];
          } else {
            currOpt[currIdx].cancel = true;
          }
        }
      });
      s.options = Object.values(currOpt);
    }
    if(s.text) {
      const sprTxt = s.text.split("\\");
      s.text = {};
      s.text.id = sprTxt[0].trim();
      s.text.en = (sprTxt[1] || sprTxt[0]).trim();
    }
    if(s.map) s.map = "kulon" + s.map;
    this.addEvent(event_type, s, flagKey, existkey);
  }
  sendToEditor(s) {
    if(this.finishEvent) {
      this.sendByFinish();
    } else if(this.isSpace) {
      this.sendBySpace(s);
    } else {
      this.sendByObject(s);
    }
  }
  async sendBySpace(s) {
    const data = {};
    const defEvt = this.defaultEvents;
    if(Object.keys(defEvt).length < 1) {
      await modal.alert("Please add at least 1 default event to submit");
      this.isLocked = false;
      return;
    }
    const flgEvt = this.flagEvents;
    const coors = `${this.x},${this.y}`;
    if(Object.keys(defEvt).length >= 1 || Object.keys(flgEvt).length >= 1) {
      data[coors] = [];
      if(Object.keys(flgEvt).length >= 1) {
        Object.keys(flgEvt).forEach(flagKey => {
          const recog = s["flag-type"] === "local" ? "local_req" : "required";
          const ereqs = this.el.querySelector(`#talk-${flagKey}`);
          data[coors].push({
            [recog]: ereqs.value.replace(/\s/g, "").split(","),
            events: Object.values(flgEvt[flagKey].events || {})
          });
        });
      }
      data[coors].push({events: Object.values(defEvt)})
    }
    if(!data[coors] || data[coors].length < 1) {
      await modal.alert("Please add at least 1 event to submit");
      this.isLocked = false;
      return;
    }
    await this.destroy();
    this.isLocked = false;
    if(data[coors]) {
      this.editor.editSpace(coors, data);
    }
  }
  async sendByObject(s) {
    const data = {};
    data.type = s.type;
    data.x = this.x;
    data.y = this.y;
    data.src = s.src;
    data.noShadow = s.noShadow === "true" ? true : false;
    if(s["offset-x"]) {
      data.offset = [];
      data.offset.push(Number(s["offset-x"]));
      data.offset.push(s["offset-y"] === "1" ? 1 : 0);
    }
    if(s.flag.length >= 1) {
      data[`${s["flag-type"]}Flags`] = s.flag;
    }
    const defEvt = this.defaultEvents;
    const flgEvt = this.flagEvents;
    if(Object.keys(defEvt).length >= 1 || Object.keys(flgEvt).length >= 1) {
      data.talking = [];
      if(Object.keys(flgEvt).length >= 1) {
        Object.keys(flgEvt).forEach(flagKey => {
          const recog = s["flag-type"] === "local" ? "local_req" : "required";
          const ereqs = this.el.querySelector(`#talk-${flagKey}`);
          data.talking.push({
            [recog]: ereqs.value.replace(/\s/g, "").split(","),
            events: Object.values(flgEvt[flagKey].events || {})
          });
        });
      }
      data.talking.push({events: Object.values(defEvt)});
    }
    await this.destroy();
    this.isLocked = false;
    this.editor.editObject(s.id, data, (this.passed?.id || null));
  }
  async sendByFinish() {
    const defEvt = this.defaultEvents;
    await this.destroy();
    this.isLocked = false;
    this.editor.editFinish(Object.values(defEvt));
  }
  unlock() {
    this.isLocked = false;
  }
  async destroy(next) {
    this.el.classList.add("out");
    await modal.waittime();
    this.el.remove();
    if(next) return next.run();
    this.editor.unlock();
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.btnListener();
    this.renderData();
  }
}