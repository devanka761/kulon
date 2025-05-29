import trophy_list from "../../../../public/json/main/trophies.json";
import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import playerState from "../manager/PlayerState.js";
import db from "../manager/db.js";
import sdate from "../helper/sdate.js";
import xhr from "../helper/xhr.js";
import Splash from "../helper/Splash.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

let currentPage = "1";

function itemCard(itm_id, s) {
  const tdb = db.char.trophies?.[itm_id] || {};
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("x-trp", itm_id);
  const isDone = tdb.done;
  const isClaimed = tdb.claimed;
  if(isClaimed) {
    card.classList.add("claimed");
  } else if(isDone) {
    card.classList.add("done");
  }
  card.innerHTML = `
  <div class="detail">
    <div class="card-title">${(s.g === "3" && !isDone) ? "???" : s.t[klang.currLang]}</div>
    <div class="card-desc">${(s.g === "3" && !isDone) ? "???" : s.d[klang.currLang]}</div>
    ${tdb.ts ? "<div class=\"card-done\">" + sdate.datetime(tdb.ts) + "</div>" : ""}
  </div>
  <div class="reward">
    <div class="reqs"></div>
    <div class="item">
      <div class="item-card">
        <img src="${asset["perismato"].src}" alt="perisma"/>
        <div class="amount">${s.rw}</div>
      </div>
    </div>
  </div>`;
  const ereqs = card.querySelector(".reward .reqs");
  if(tdb.done && !tdb.claimed) {
    const btnClaim = document.createElement("div");
    btnClaim.classList.add("btn", "btn-claim");
    btnClaim.innerHTML = lang.MAIL_ACT_CLAIM;
    ereqs.append(btnClaim);
  } else {
    ereqs.innerHTML = `<span>${tdb.a || 0}/${s.a}</span>`;
  }

  return card;
}

export default class Trophies {
  constructor({ onComplete, classBefore=null } = { onComplete }) {
    this.id = "trophies";
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-trophy");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-trophy-star"></i> ${lang.PHONE_TROPHY}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="board">
        </div>
        <div class="con-list">
          <div k-type="1" class="card selected">${lang.FW_TRP_GENERAL}</div>
          <div k-type="2" class="card">${lang.FW_TRP_JOURNEY}</div>
          <div k-type="3" class="card">${lang.FW_TRP_HIDDEN}</div>
        </div>
      </div>
    </div>`;
    this.eboard = this.el.querySelector(".board");
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }

    const btnChanges = this.el.querySelectorAll(".con-list .card");
    btnChanges.forEach(btn => {
      btn.onclick = () => {
        if(btn.getAttribute("k-type") === currentPage) return;
        Kaudio.play("sfx", "menu_select");
        currentPage = btn.getAttribute("k-type");
        this.activatedBtn(btn);
        this.writeItems(btn.getAttribute("k-type"));
      }
    });
  }
  activatedBtn(btn = null) {
    const btnSelecteds = this.el.querySelectorAll(".con-list .card.selected");
    btnSelecteds.forEach(el => el.classList.remove("selected"));
    if(!btn) btn = this.el.querySelector(`.con-list .card[k-type="${currentPage}"]`);
    btn.classList.add("selected");
  }
  updateBtn() {
    const unreads = Object.keys(db.unread.trophies || {}).map(k => trophy_list[k].g);
    const btns = this.el.querySelectorAll(".con-list .card");
    btns.forEach(btn => {
      btn.classList.remove("unread");
      if(unreads.includes(btn.getAttribute("k-type"))) {
        btn.classList.add("unread");
      }
    });
  }
  writeItems(ktype=null) {
    if(!ktype) ktype = currentPage;
    const pageItems = Object.keys(trophy_list).filter(k => trophy_list[k].g === ktype);
    const elistBefore = this.el.querySelector(".item-list");
    if(elistBefore) elistBefore.remove();
    const elist = document.createElement("div");
    elist.classList.add("item-list");
    const pageList = { "1": [], "2": [], "3": [] };
    pageItems.forEach(itm => {
      const card = itemCard(itm, trophy_list[itm]);
      if(card.classList.contains("claimed")) {
        pageList[3].push(card);
      } else if(card.classList.contains("done")) {
        pageList[1].push(card);
        card.onclick = () => this.setClaim(itm, trophy_list[itm], card);
      } else {
        pageList[2].push(card);
      }
    });
    Object.keys(pageList).forEach(k => pageList[k].forEach(card => elist.append(card)));
    Object.keys(pageList).forEach(k => delete pageList[k]);
    this.eboard.append(elist);
  }
  async setClaim(itm_id, s, card) {
    if(this.isLocked) return;
    Kaudio.play("sfx", "menu_select");
    this.isLocked = true;
    const trophyClaim = await modal.loading(xhr.post("/x/account/trophy-claim", {trophy_id: itm_id}));
    if(!trophyClaim.ok) {
      await modal.alert(lang[trophyClaim.msg] || lang.ERROR);
      this.isLocked = false;
      return;
    }
    db.char.trophies[itm_id].claimed = true;
    delete db.unread["trophies"][itm_id];
    card.classList.add("claimed");
    Object.keys(trophyClaim.data.new_amount).forEach(k => {
      db.char.backpack[k] = trophyClaim.data.new_amount[k];
    });
    this.writeItems(currentPage);
    await Splash(trophyClaim.data.rewards);
    this.isLocked = false;
    return this.updateBtn();
  }
  async writeDetail() {
    const trophiesDB = await xhr.get("/x/account/my-trophies");
    if(trophiesDB.ok) db.char.trophies = trophiesDB.data;
    this.activatedBtn();
    this.updateBtn();
    this.writeItems(currentPage);
    this.btnListener();
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
    this.writeDetail();
    this.activatedBtn();
    this.updateBtn();
    this.writeItems(currentPage);
    this.btnListener();
  }
}