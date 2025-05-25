import cloud_items from "../../../../client/json/items/cloud_items.json";
import modal from "../helper/modal.js";
import playerState from "../manager/PlayerState.js";
import db from "../manager/db.js";
import xhr from "../helper/xhr.js";
import { klang, lang } from "../helper/lang.js";

function createOption(item_id, item_label) {
  const opt = document.createElement("option");
  opt.value = item_id;
  opt.innerHTML = item_label;
  return opt;
}
function createReward() {
  const rw_key = "r" + Date.now().toString(36);
  const field = document.createElement("div");
  field.classList.add("field", "rw-field");
  field.innerHTML = `<input list="rewards" name="reward-${rw_key}" id="reward-${rw_key}" placeholder="perisma 12" required /><div class="btn btn-rem-reward"><i class="fa-solid fa-x fa-fw"></i></div>`;
  const btnRemove = field.querySelector(".btn-rem-reward");
  btnRemove.onclick = () => field.remove();
  return field;
}

export default class AdminMailSender {
  constructor({ onComplete, classBefore=null } = { onComplete }) {
    this.id = "adminmailsender";
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "a-mail");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-envelopes-bulk"></i> ${lang.PHONE_MAIL_SENDER}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <form action="/x/admin/sendmail" method="post" class="form">
          <div class="field">
            <label for="userid">User ID</label>
            <input type="text" name="userid" id="userid" placeholder="761761" required />
          </div>
          <div class="field">
            <label for="title">Title - <small>separate language with \\ (id\\en)</small></label>
            <input type="text" name="title" id="title" placeholder="ex: Selamat \\ Congrats" required />
          </div>
          <div class="field">
            <label for="sub">Sub - <small>separate language with \\ (id\\en)</small></label>
            <input type="text" name="sub" id="sub" placeholder="ex: Sistem \\ System" required />
          </div>
          <div class="field">
            <label for="message">Message - <small>separate language with \\ (id\\en)</small></label>
            <textarea name="message" id="message" placeholder="ex: Kamu Menang \\ You Won" required ></textarea>
          </div>
          <div class="rewards-field">
            <div class="txt">Rewards - <small>ex: &lt;id&gt; &lt;amount&gt;</small></div>
            <datalist id="rewards"></datalist>
            <div class="field rw-field"><input list="rewards" name="reward-r01" id="reward-r01" placeholder="perisma 12" required /></div>
          </div>
          <div class="field">
            <div class="actions">
              <div class="btn btn-add-rw"><i class="fa-solid fa-plus fa-fw"></i> Add Reward</div>
            </div>
          </div>
          <div class="field">
            <div class="actions">
              <button class="btn btn-submit">SEND</button>
            </div>
          </div>
        </form>
      </div>
    </div>`;
    this.datalist = this.el.querySelector("#rewards");
    this.form = this.el.querySelector(".form");
  }
  writeDatalist() {
    const items = cloud_items.filter(itm => itm.group === "1");
    items.forEach(itm => {
      const option = createOption(itm.id, itm.name[klang.currLang]);
      this.datalist.append(option);
    });
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => this.destroy(this.classBefore);
    const erewards = this.el.querySelector(".rewards-field");
    const btnAddReward = this.el.querySelector(".btn-add-rw");
    btnAddReward.onclick = () => erewards.append(createReward());
  }
  formListener() {
    this.form.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      this.isLocked = true;
      const hasEmpty = [];
      const formData = new FormData(this.form);
      const data = {};
      formData.forEach((val, key) => {
        if(!val || val.length < 1) hasEmpty.push(key);
        if(key.includes("reward-")) {
          if(!data.rewards) data.rewards = {};
          data.rewards[key] = val.trim();
        } else {
          data[key] = val.trim();
        }
      });
      if(hasEmpty.length >= 1) {
        await modal.alert("Ada input yang belum diisi");
        this.isLocked = false;
        return;
      }
      const sendMail = await modal.loading(xhr.post("/x/admin/sendmail", data));
      if(!sendMail.ok) {
        await modal.alert(lang[sendMail.msg] || sendMail.msg || lang.ERROR);
        this.isLocked = false;
        return;
      }
      await modal.alert(`Berhasil mengirim surat ke ${sendMail.data.user.username}`);
      this.cleanForm();
      this.isLocked = false;
    }
  }
  cleanForm() {
    const inputs = this.form.querySelectorAll("[name][id]");
    inputs.forEach(inp => {inp.value = ""});
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.el.remove();
      this.isLocked = false;
      playerState.pmc = null;
      resolve();
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.writeDatalist();
    this.formListener();
    this.btnListener();
  }
}