import cloud_items from "../../../../public/json/items/cloud_items.json";
import modal from "../helper/modal.js";
import Minigames from "../pages/Minigames.js";

function createForm() {
  const form = document.createElement("form");
  form.action = "/uwu/newEvent";
  form.method = "POST";
  form.classList.add("form");
  return form;
}
let numberChoice = 0;
function createChoice(plch="Ngga Setuju!\\No, I do not agree!", passedValue, checked=false) {
  numberChoice++;
  const inp_id = "o" + numberChoice + Date.now().toString(36);
  const card = document.createElement("div");
  card.classList.add("opt");
  card.innerHTML = `
  <input type="text" name="opt-${inp_id}" id="opt-${inp_id}" autocomplete="off" placeholder="ex: ${plch}" maxlength="50" ${passedValue ? "value=\"" + passedValue + "\"" : ""} />
  <div class="opt-actions">
    <div class="opt-next">
      <input type="checkbox" name="next-${inp_id}" id="next-${inp_id}" ${checked ? "checked" : ""} />
      <label for="next-${inp_id}">Fire Next Events</label>
    </div>
    ${numberChoice > 1 ? "<div class=\"btn opt-remove\" id=\"rem-" + inp_id + "\"><i class=\"fa-solid fa-trash-can\"></i></div>" : "" }
  </div>`;
  const btnRem = card.querySelector(".opt-remove");
  if(btnRem) btnRem.onclick = () => card.remove();
  return card;
}
const EventMethod = {
  textMessage(s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Text Message</div>
    </div>
    <div class="field">
      <label for="who">Who - <small><i>optional</i></small></label>
      <input type="text" name="who" id="who" autocomplete="off" placeholder="ex: Encik Slamet" maxlength="40" ${s.who ? ("value=\"" + s.who + "\"") : ""} />
    </div>
    <div class="field">
      <label for="text">Message - <small>separate languages with \\ (id\\en)</small></label>
      <textarea name="text" id="text" maxlength="200" placeholder="ex: Dapetin kuncinya terlebih dahulu\\You need to get the key first" rows="3" required>${s.text ? (s.text.id + " \\ " + s.text.en) : ""}</textarea>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`;
    return form;
  },
  teleport(s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Teleport</div>
    </div>
    <div class="field">
      <label for="who">Object ID</label>
      <input type="text" autocomplete="off" name="who" id="who" placeholder="ex: Person_A01" maxlength="40" ${s.who ? ("value=\"" + s.who + "\"") : ""} required />
    </div>
    <div class="field">
      <label for="x">Coor X</label>
      <input type="number" autocomplete="off" name="x" id="x" placeholder="ex: 9" min="-1000" max="1000" ${s.x ? ("value=\"" + s.x + "\"") : ""} required />
    </div>
    <div class="field">
      <label for="y">Coor Y</label>
      <input type="number" autocomplete="off" name="y" id="y" placeholder="ex: 12" min="-1000" max="1000" ${s.y ? ("value=\"" + s.y + "\"") : ""} required />
    </div>
    <div class="field">
      <label for="direction">Direction</label>
      <input list="directions"  name="direction" id="direction" placeholder="ex: down" ${s.direction ? ("value=\"" + s.direction + "\"") : ""} required />
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
    </div>`;
    return form;
  },
  choices(s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Choices</div>
    </div>
    <div class="field">
      <label for="who">Who - <small><i>optional</i></small></label>
      <input type="text" autocomplete="off" name="who" id="who" placeholder="ex: Encik Slamet" maxlength="40" ${s.who ? ("value=\"" + s.who + "\"") : ""} />
    </div>
    <div class="field">
      <label for="text">Message - <small>separate languages with \\ (id\\en)</small></label>
      <textarea name="text" id="text" maxlength="200" placeholder="ex: ex: Gimana? Setuju?\\Do you agree?" rows="3" required>${s.text ? (s.text.id + " \\ " + s.text.en) : ""}</textarea>
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
    </div>`;
    const optList = form.querySelector(".opts");
    if(s.options?.length >= 1) {
      s.options.forEach(opt => {
        optList.append(createChoice("Bentar.. \\ Lemme think about this..", `${opt.text.id} \\ ${opt.text.en}`, !opt.cancel))
      });
    }
    return form;
  },
  changeMap(s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Change Map</div>
    </div>
    <div class="field">
      <label for="map">Map ID</label>
      <input list="maps" name="map" id="map" placeholder="ex: SafeHouse" ${s.map ? ("value=\"" + s.map.replace("kulon", "") + "\"") : ""} required />
      <datalist id="maps" class="datalist-map">
      </datalist>
    </div>
    <div class="field">
      <label for="x">Coor X</label>
      <input type="number" name="x" id="x" autocomplete="off" placeholder="ex: 9" min="-1000" max="1000" ${s.x ? ("value=\"" + s.x + "\"") : ""} required />
    </div>
    <div class="field">
      <label for="y">Coor Y</label>
      <input type="number" name="y" id="y" autocomplete="off" placeholder="ex: 12" min="-1000" max="1000" ${s.y ? ("value=\"" + s.y + "\"") : ""} required />
    </div>
    <div class="field">
      <label for="direction">Direction</label>
      <input list="directions" name="direction" id="direction" placeholder="ex: down" ${s.direction ? ("value=\"" + s.direction + "\"") : ""} required />
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
    </div>`;
    return form;
  },
  addFlags(mode="Local", s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Add ${mode} Flags</div>
    </div>
    <div class="field">
      <label for="flag">Flags - <small><i>separate with comma</i></small></label>
      <input type="text" name="flag" id="flag" autocomplete="off" placeholder="ex: TOOK_KEY, TURNED_OFF_COMPUTER" ${s.flag ? ("value=\"" + s.flag.join(", ").trim() + "\"") : ""} required />
    </div>
    <div class="field">
      <label for="text">Chat Text - <small><i>optional</i> - <small>separate languages with \\ (id\\en)</small></small></label>
      <input type="text" name="text" id="text" autocomplete="off" placeholder="ex: mematikan komputer dan mengambil kunci \\ turned off the computer and took the key" maxlength="200" ${s.text ? ("value=\"" + s.text.id + " \\ " + s.text.en + "\"") : ""} />
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`;
    return form;
  },
  addStoryFlag(s) {
    return this.addFlags("Story", s);
  },
  addLocalFlag(s) {
    return this.addFlags("Local", s);
  },
  removeFlags(mode="Local", s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Remove ${mode} Flags</div>
    </div>
    <div class="field">
      <label for="flag">Flags - <small><i>separate with comma</i></small></label>
      <input type="text" name="flag" id="flag" autocomplete="off" placeholder="ex: TOOK_KEY, TURNED_OFF_COMPUTER" ${s.flag ? ("value=\"" + s.flag.join(", ").trim() + "\"") : ""} required />
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`;
    return form;
  },
  removeStoryFlag(s) {
    return this.removeFlags("Story", s);
  },
  removeLocalFlag(s) {
    return this.removeFlags("Local",s);
  },
  missionBoard() {
    const form = createForm();
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
    </div>`;
    return form;
  },
  minigame(s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Minigame</div>
    </div>
    <div class="field">
      <label for="id">Minigame</label>
      <input list="minigames" name="id" id="id" placeholder="ex: fingclo" ${s.id ? ("value=\"" + s.id + "\"") : ""} required />
      <datalist id="minigames">
      </datalist>
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`;
    Object.keys(Minigames).forEach(k => {
      const opt = document.createElement("option");
      opt.value = k;
      form.querySelector("#minigames").append(opt);
    });
    return form;
  },
  additem(s) {
    const form = createForm();
    form.innerHTML = `
    <div class="field">
      <div class="desc">Event</div>
      <div class="title">Add Item</div>
    </div>
    <div class="field">
      <label for="id">Item ID</label>
      <input list="items_id" name="id" id="id" placeholder="ex: J0001" ${s.id ? ("value=\"" + s.id + "\"") : ""} required />
      <datalist id="items_id">
      </datalist>
    </div>
    <div class="field">
      <label for="amount">Amount</label>
      <input type="number" min="1" max="1000" name="amount" id="amount" autocomplete="off" placeholder="ex: 12" ${s.amount ? ("value=\"" + s.amount + "\"") : ""} required />
    </div>
    <div class="field">
      <div class="action-buttons buttons">
        <div class="btn btn-cancel">CANCEL</div>
        <button class="btn btn-ok" type="submit">OK</button>
      </div>
    </div>`;
    const edatalist = form.querySelector("#items_id");
    cloud_items.filter(itm => itm.group === "0").forEach(itm => {
      const opt = document.createElement("option");
      opt.value = itm.id;
      opt.innerHTML = itm.name.en;
      edatalist.append(opt);
    })
    return form;
  },
  MissionCompleted() {
    const form = createForm();
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
    </div>`;
    return form;
  }
}

export default class NewEvent {
  constructor({ type, mode, objectEditor, passed = null } = { type, mode, objectEditor }) {
    this.objectEditor = objectEditor;
    this.type = type;
    this.mode = mode;
    this.passed = passed;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("newArea");
  }
  btnListener() {
    const btnClose = this.form.querySelector(".btn-cancel");
    btnClose.onclick = () => this.destroy();
  }
  setForm() {
    this.form = EventMethod[this.type](this.passed || {});
    this.el.append(this.form);
    if(this.type === "choices") this.choicesModifier();
    if(this.type === "changeMap") this.mapSeeks();
    this.formListener();
  }
  choicesModifier() {
    const optList = this.form.querySelector(".opts");
    if(!this.passed || this.passed?.options?.length < 1) {
      optList.append(createChoice("Oke, setuju!\\Yes, I do!", null, true));
      optList.append(createChoice());
    }
    const btnAdd = this.form.querySelector(".btn-add-opt");
    btnAdd.onclick = () => {
      const newOpt = createChoice("Bentar.. \\ Lemme think about this..");
      optList.append(newOpt);
    }
  }
  mapSeeks() {
    const emaplist = this.form.querySelector(".datalist-map");
    const mapdata = this.objectEditor.editor.mapdata;
    Object.keys(mapdata).forEach(k => {
      const card = document.createElement("option");
      card.value = k.replace("kulon", "");
      emaplist.append(card);
    });
  }
  formListener() {
    this.form.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      this.isLocked = true;
      const data = {};
      const formData = new FormData(this.form);
      formData.forEach((val, key) => {
        if(val.toString().length >= 1) data[key] = val;
      });
      data.type = this.type;
      this.isLocked = false;
      await this.destroy();
      this.objectEditor.createEvent(this.type, data, this.mode, this.passed?._n || null);
    }
  }
  async destroy(next) {
    this.el.classList.add("out");
    await modal.waittime();
    numberChoice = 0;
    this.el.remove();
    this.objectEditor.unlock();
    if(next) next.run();
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.setForm();
    this.btnListener();
  }
}