import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import playerState from "../manager/PlayerState.js";
import db from "../manager/db.js";
import sdate from "../helper/sdate.js";
import cloud from "../manager/cloud.js";
import xhr from "../helper/xhr.js";
import MatchMaking from "../pages/MatchMaking.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

function cardOnList(s, mission) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("x-inv", s.key);
  card.innerHTML = `<div class="card-title">${s.inviter.username}</div><div class="card-esc"><i class="fa-solid fa-car-burst"></i> ${mission.name}</div>`;
  return card;
}
function fieldOnBoard(s, mission) {
  const field = document.createElement("div");
  field.classList.add("field");
  field.innerHTML = `
  <div class="snippet">
    <div class="avatar">
      <div class="hero">
      </div>
    </div>
    <div class="short">
      <p class="short-title"></p>
      <p class="short-desc"></p>
    </div>
  </div>
  <div class="summary">
    <p class="summary-desc"></p>
  </div>
  <div class="actions">
    <div class="btn btn-accept"><i class="fa-solid fa-check"></i> ${lang.JOB_ACCEPT}</div>
    <div class="btn btn-ignore"><i class="fa-solid fa-xmark"></i> ${lang.JOB_IGNORE}</div>
  </div>`;

  const ehero = field.querySelector(".avatar .hero");
  s.inviter.skin.forEach(skin => {
    const img = new Image();
    img.src = asset[skin].src;
    img.alt = skin;
    ehero.append(img);
  });

  const short_title = field.querySelector(".snippet .short-title");
  const short_desc = field.querySelector(".snippet .short-desc");
  const summary = field.querySelector(".summary .summary-desc");

  short_title.innerText = s.inviter.username;
  short_desc.innerText = `${mission.name} - ${sdate.time(s.ts)}`;
  summary.innerText = mission.desc[klang.currLang];

  return field;
}

function emptyOnBoard() {
  const card = document.createElement("div");
  card.classList.add("empty-board");
  card.innerHTML = `<div class="board-icon"><i class="fa-regular fa-briefcase"></i></div><p>${lang.JOB_HOW_TO}</p>`;
  return card;
}

export default class Jobs {
  constructor({ onComplete, map, classBefore=null } = { onComplete, map }) {
    this.id = "jobs";
    this.onComplete = onComplete;
    this.map = map;
    this.classBefore = classBefore;
    this.isLocked = false;
    this.joblist = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-jobs");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-briefcase"></i> ${lang.FW_JOBS}</div>
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
    this.elist = this.el.querySelector(".con-list");
    this.eboard = this.el.querySelector(".board");
  }
  async btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }
  }
  async writeData() {
    this.elist.innerHTML = `<div class=\"center list-empty\"><p><i class="fa-solid fa-circle-notch fa-spin"></i> LOADING</p></div>`;
    this.writeEmpty();
    this.mission_list = await xhr.get("/json/main/missions.json");
    this.updateJobList();
  }
  checkEmptyList(text) {
    const inv_list = Object.keys(db.inv_job);
    if(inv_list.length < 1) {
      this.elist.innerHTML = `<div class=\"center list-empty\"><p>~ ${text || lang.EMPTY} ~</p></div>`;
    } else {
      if(this.elist.querySelector(".list-empty")) {
        this.elist.querySelector(".list-empty").remove();
      }
    }
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
  async updateJobList(id_removed=null) {
    if(!this.mission_list) {
      await modal.waittime(250);
      if(!document.querySelector(".f-jobs")) return;
      return this.updateJobList(id_removed);
    }
    if(id_removed) {
      if(this.joblist.includes(id_removed)) {
        this.joblist = this.joblist.filter(k => k !== id_removed);
      }
      const card_to_remove = this.elist.querySelector(`.card[x-inv="${id_removed}"]`);
      if(card_to_remove) card_to_remove.remove();
      const actionBefore = this.eboard.querySelector(".actions");
      if(actionBefore) actionBefore.innerHTML = `<i class="y">${lang.JOB_ACT_CANCELED}</i>`;
    }
    db.unread.jobs = {};
    const invs = Object.values(db.inv_job || {});
    const ninvs = invs.filter(k => !this.joblist.includes(k.id));
    ninvs.forEach(k => {
      this.joblist.push(k.id);
      const mission = this.mission_list.find(msx => msx.id === k.mission);
      const card = cardOnList(k, mission);
      card.onmousedown = () => {
        Kaudio.play("sfx", "phone_selected");
        this.writeJob(k, mission);
        const hasActive = this.elist.querySelectorAll(".ck");
        hasActive.forEach(ck => {if(ck.classList.contains("ck")) ck.classList.remove("ck")});
        card.classList.add("ck");
      }
      this.elist.prepend(card);
    });
    this.checkEmptyList();
  }
  writeJob(s, mission) {
    if(this.eboard.classList.contains("empty")) {
      this.eboard.classList.remove("empty");
    }
    const fieldBefore = this.eboard.querySelector(".field");
    if(fieldBefore) fieldBefore.remove();
    const emptyBefore = this.eboard.querySelector(".empty-board");
    if(emptyBefore) emptyBefore.remove();
    const field = fieldOnBoard(s, mission);
    const btnIgnore = field.querySelector(".btn-ignore");
    btnIgnore.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_exit");
      this.isLocked = true;
      const conmsg = {
        id: "Tolak undangan?",
        en: "Ignore this job invitation?"
      }
      const ignoreConfirm = await modal.confirm({
        msg: conmsg[klang.currLang]
      });
      if(!ignoreConfirm) {
        this.isLocked = false;
        return;
      }
      delete db.inv_job[s.key];
      if(s.inviter?.peer) {
        cloud.send({id: "job_ignore", to: [s.inviter.peer]});
        this.writeEmpty();
      }
      this.isLocked = false;
      this.updateJobList(s.key);
    }
    const btnAccept = field.querySelector(".btn-accept");
    btnAccept.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;
      btnAccept.style.width = `${btnAccept.offsetWidth}px`;
      btnAccept.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
      const joinTeam = await xhr.post("/x/job/accept", { job_id: s.id });
      btnAccept.style.width = `fit-content`;
      btnAccept.innerHTML = lang.JOB_ACCEPT;
      if(joinTeam.code === 404) {
        delete db.inv_job[s.key];
        this.isLocked = false;
        this.updateJobList(s.key);
        return;
      }
      if(!joinTeam.ok) {
        await modal.alert(joinTeam?.msg?.[klang.currLang] || lang.ERROR);
        this.isLocked = false;
        return;
      }
      db.inv_job = {};
      if(!db.job?.onduty) {
        db.job = joinTeam.data.job;
      }
      const matchMaking = new MatchMaking({
        onComplete: this.onComplete,
        map: this.map,
        job: joinTeam.data.job,
        mission: mission
      });
      cloud.send({id:"job_accept", to: joinTeam.data.peers});
      this.isLocked = false;
      await this.destroy(matchMaking);
    }
    this.eboard.append(field);
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.el.remove();
      this.joblist = [];
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
    this.writeData();
  }
}