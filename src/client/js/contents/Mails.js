import cloud_items from "../../../../client/json/items/cloud_items.json";
import modal from "../helper/modal.js";
import sdate from "../helper/sdate.js";
import asset from "../manager/asset.js";
import playerState from "../manager/PlayerState.js";
import db from "../manager/db.js";
import xhr from "../helper/xhr.js";
import Splash from "../helper/Splash.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

function cardOnList(s) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("x-mail", s.id);
  if(s.claimed) card.classList.add("claimed");
  card.innerHTML = `<div class="card-title">${s.title[klang.currLang]}</div><div class="card-esc"><i class="fa-solid fa-pen-nib"></i> ${s.sub[klang.currLang]}</div>`;
  return card;
}

function fieldOnBoard(s) {
  const field = document.createElement("div");
  field.classList.add("field");
  field.innerHTML = `
  <div class="snippet">
    <div class="short">
      <p class="short-title"></p>
      <p class="short-note"><i class="fa-solid fa-pen-nib"></i> </p>
    </div>
  </div>
  <div class="summary">
    <p class="summary-desc"></p>
  </div>
  <div class="rewards ${s.claimed ? 'claimed' : ''}">
    <div class="reward-title">${s.claimed ? lang.MAIL_CLAIMED_TEXT : lang.MAIL_ATTACHMENTS}</div>
    <div class="reward-list"></div>
  </div>
  <div class="actions">
  </div>`;
  const short_title = field.querySelector(".snippet .short-title");
  const short_note = field.querySelector(".snippet .short-note");
  const summary = field.querySelector(".summary .summary-desc");
  const reward_list = field.querySelector(".reward-list");

  short_title.innerText = s.title[klang.currLang];
  short_note.append(`${s.sub[klang.currLang]} - ${sdate.datetime(s.ts)}`);
  summary.innerText = s.msg[klang.currLang];

  s.rewards.forEach(r => {
    const item = cloud_items.find(itm => itm.id === r.id);
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
    ${r.expiry ? '<div class="expire"></div>' : ''}
    <div class="icon">
      <img src="${asset[item.src].src}" alt="${item.name[klang.currLang]}"/>
    </div>
    <div class="amount">${r.amount}</div>`;
    reward_list.append(card);
  });

  return field;
}

function emptyOnBoard() {
  const card = document.createElement("div");
  card.classList.add("empty-board");
  card.innerHTML = `<div class="board-icon"><i class="fa-regular fa-envelope"></i></div><p>${lang.MAIL_HOW_TO}</p>`;
  return card;
}

export default class Mails {
  constructor({ onComplete, classBefore=null } = { onComplete }) {
    this.id = "mails";
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
    this.boxMail = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-jobs");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-envelope"></i> ${lang.PHONE_MAIL}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="con-list">
        </div>
        <div class="board">
        </div>
      </div>
    </div>`;
    this.cardlist = this.el.querySelector(".con-list");
    this.eboard = this.el.querySelector(".board");
  }
  async btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }
  }
  checkEmptyList() {
    const mail_list = Object.keys(db.char.mails);
    if(mail_list.length < 1) {
      this.cardlist.innerHTML = `<div class=\"center\"><p>~ ${lang.EMPTY} ~</p></div>`;
    }
  }
  updateList(id_removed=null) {
    if(id_removed) {
      if(this.boxMail.includes(id_removed)) {
        this.boxMail = this.boxMail.filter(k => k !== id_removed);
      }
      const card_to_remove = this.cardlist.querySelector(`.card[x-mail="${id_removed}"]`);
      if(card_to_remove) card_to_remove.remove();
    }
    const mail_list = Object.keys(db.char.mails || {}).map(k => {
      return {...db.char.mails[k], id:k};
    });
    const new_ml = mail_list.filter(k => !this.boxMail.includes(k.id));
    new_ml.forEach(k => {
      this.boxMail.push(k.id);
      const card = cardOnList(k);
      card.onclick = () => {
        Kaudio.play("sfx", "phone_selected");
        this.writeMail(k, card);
        const hasActive = this.cardlist.querySelectorAll(".ck");
        hasActive.forEach(ck => {if(ck.classList.contains("ck")) ck.classList.remove("ck")});
        card.classList.add("ck");
      }
      this.cardlist.prepend(card);
    });
    this.checkEmptyList();
  }
  writeMail(s, ec) {
    const curr_id = s.id;
    s = db.char.mails[curr_id];
    s.id = curr_id;
    if(this.eboard.classList.contains("empty")) {
      this.eboard.classList.remove("empty");
    }
    const fieldBefore = this.eboard.querySelector(".field");
    if(fieldBefore) fieldBefore.remove();
    const emptyBefore = this.eboard.querySelector(".empty-board");
    if(emptyBefore) emptyBefore.remove();
    const field = fieldOnBoard(s);
    this.setClaimable(field, s, ec);
    this.eboard.append(field);
  }
  setClaimable(field, s, ec) {
    const eactions = field.querySelector(".actions");
    const btnBefore = eactions.querySelector(".btn");
    if(btnBefore) btnBefore.remove();

    const btn = document.createElement("div");
    btn.classList.add("btn", s.claimed ? "btn-delete" : "btn-claim");
    btn.innerHTML = s.claimed ? `<i class="fa-solid fa-trash-can"></i> ${lang.MAIL_ACT_DELETE}` : `<i class="fa-solid fa-circle-down"></i> ${lang.MAIL_ACT_CLAIM}`;

    btn.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;

      if(s.claimed) {
        const delConfirm = await modal.confirm({
          msg: lang.MAIL_DEL_CONFIRM,
          okx: lang.DELETE,
          ic: "trash-can"
        });
        if(!delConfirm) {
          this.isLocked = false;
          return;
        }
      }

      const mailset = s.claimed ? "delete" : "claim";
      const updateMail = await modal.loading(xhr.post("/x/account/mail-" + mailset, {mail_id: s.id}));
      if(!updateMail.ok) {
        await modal.alert(lang[updateMail.msg] || lang.ERROR);
        this.isLocked = false;
        return;
      }
      if(s.claimed) {
        delete db.char.mails[updateMail.data.id];
        this.updateList(updateMail.data.id);
        this.writeEmpty();
        this.checkEmptyList();
      } else {
        db.char.mails[updateMail.data.id].claimed = true;
        delete db.unread.mails[updateMail.data.id];
        ec.classList.add("claimed");
        this.writeMail(updateMail.data, ec);
        Object.keys(updateMail.data.new_amount).forEach(k => {
          // if(!db.char.backpack[k]) db.char.backpack[k] = {};
          // db.char.backpack[k].id = updateMail.data.new_amount[k].id;
          // db.char.backpack[k].amount = updateMail.data.new_amount[k].amount;
          db.char.backpack[k] = updateMail.data.new_amount[k];
        });
        await Splash(updateMail.data.rewards);
      }
      this.isLocked = false;
    }
    eactions.append(btn);
  }
  writeEmpty() {
    if(!this.eboard.classList.contains("empty")) {
      this.eboard.classList.add("empty");
    }
    const fieldBefore = this.eboard.querySelector(".field");
    if(fieldBefore) fieldBefore.remove();
    const emptyBefore = this.eboard.querySelector(".empty-board");
    if(emptyBefore) return;
    const emptyField = emptyOnBoard();
    this.eboard.append(emptyField);
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.boxMail = [];
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
    this.btnListener();
    this.updateList();
    this.writeEmpty();
  }
}