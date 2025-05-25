import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import playerState from "../manager/PlayerState.js";
import db from "../manager/db.js";
import cloud from "../manager/cloud.js";
import xhr from "../helper/xhr.js";
import MatchMaking from "../pages/MatchMaking.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

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
    <div class="btn btn-accept"><i class="fa-solid fa-check"></i> ${lang.TM_BTN_JOIN}</div>
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
  short_desc.innerText = mission.name;
  summary.innerText = mission.desc[klang.currLang];

  return field;
}
function emptyOnBoard(helptext, newic) {
  const card = document.createElement("div");
  card.classList.add("empty-board");
  card.innerHTML = `<div class="board-icon"><i class="fa-regular fa-${newic}"></i></div><p>${lang[helptext] || helptext}</p>`;
  return card;
}
export default class TeamSearch {
  constructor({ onComplete, map, classBefore=null } = { onComplete }) {
    this.onComplete = onComplete;
    this.map = map;
    this.classBefore = classBefore;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-jobs");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-people-group"></i> ${lang.PHONE_TEAM}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="search">
          <form class="inp" action="/x/job/find" method="get" id="job-search">
            <input type="number" maxlength="6" min="0" max="999999" name="job_code" id="job_code" autocomplete="off" placeholder="${lang.TM_INP_TEXT}" />
            <button type="submit" class="btn-search disabled">${lang.FR_BTN_FIND}</button>
          </form>
        </div>
        <div class="board">
        </div>
      </div>
    </div>`;
    this.eboard = this.el.querySelector(".board");
    this.btnSearch = this.el.querySelector(".btn-search");
    this.inpSearch = this.el.querySelector("#job_code");
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }
  }
  async formListener() {
    await modal.waittime(750);
    this.inpSearch.readOnly = true;
    this.inpSearch.focus();
    this.inpSearch.readOnly = false;

    const searchForm = this.el.querySelector("#job-search");
    searchForm.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      if(this.inpSearch.value.length !== 6) return this.writeEmpty("TM_HOW_TO", "people-group");
      this.writeEmpty("LOADING", "circle-notch fa-spin");
      this.isLocked = true;
      this.btnSearch.classList.add("disabled");
      const formData = new FormData(searchForm);
      const data = {};
      formData.forEach((val, key) => {
        data[key] = val;
      });
      const teamCode = await xhr.get(`/x/job/find/${data.job_code}`);
      const mission_list = await xhr.get("/json/main/missions.json");
      await modal.waittime(2000, 5);
      if(!teamCode.ok) {
        this.writeEmpty("TM_NOT_FOUND", "users-slash");
        this.isLocked = false;
        this.updateBtnFind();
        return;
      }
      this.isLocked = false;
      this.updateBtnFind();
      const mission = mission_list.find(k => k.id === teamCode.data.job.mission);
      this.writeJob(teamCode.data.job, mission);
    }
    this.inpSearch.oninput = () => this.updateBtnFind();
  }
  updateBtnFind() {
    this.inpSearch.value = this.inpSearch.value.substring(0,6).replace(/\D/g, "");
    if(this.isLocked) return;
    if(this.inpSearch.value.length === 6) {
      if(this.btnSearch.classList.contains("disabled"))
        this.btnSearch.classList.remove("disabled");
    } else {
      if(!this.btnSearch.classList.contains("disabled"))
        this.btnSearch.classList.add("disabled");
    }
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
    const btnAccept = field.querySelector(".btn-accept");
    btnAccept.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;
      btnAccept.style.width = `${btnAccept.offsetWidth}px`;
      btnAccept.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
      const joinTeam = await xhr.post("/x/job/join", { job_code: s.code });
      btnAccept.style.width = `fit-content`;
      btnAccept.innerHTML = lang.TM_BTN_JOIN;
      if(joinTeam.code === 404) {
        await modal.alert(lang.TM_NOT_PUBLIC_ANYMORE);
        this.isLocked = false;
        return;
      } else if(!joinTeam.ok) {
        await modal.alert(joinTeam?.msg?.[klang.currLang] || lang.ERROR);
        this.isLocked = false;
        return;
      }
      db.job = joinTeam.data.job;
      const matchMaking = new MatchMaking({
        onComplete: this.onComplete,
        map: this.map, mission,
        job: joinTeam.data.job
      });
      cloud.send({id:"job_accept", to: joinTeam.data.peers});
      this.isLocked = false;
      await this.destroy(matchMaking);
    }
    this.eboard.append(field);
  }
  writeEmpty(helptext="TM_HOW_TO", newic="people-group") {
    if(!this.eboard.classList.contains("empty")) {
      this.eboard.classList.add("empty");
    }
    const fieldBefore = this.eboard.querySelector(".field");
    if(fieldBefore) fieldBefore.remove();
    const emptyBefore = this.eboard.querySelector(".empty-board");
    if(emptyBefore) emptyBefore.remove();;
    const emptyField = emptyOnBoard(helptext, newic);
    this.eboard.append(emptyField);
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
    this.formListener();
    this.writeEmpty();
    this.btnListener();
  }
}