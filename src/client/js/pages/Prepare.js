import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import cloud from "../manager/cloud.js";
import db from "../manager/db.js";
import playerState from "../manager/PlayerState.js";
import sdate from "../helper/sdate.js";
import ItemData from "../manager/itemData.js";
import BannerDrop from "./BannerDrop.js";
import mapList from "../manager/mapList.js";
import kchat from "../manager/KChat.js";
import { lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

let launchInterval = null;

function playerCard(s) {
  const card = document.createElement("div");
  card.classList.add("player");
  card.setAttribute("x-uid", s.id);
  card.innerHTML = `
  <div class="usr">${s.username}</div>
  <div class="avatar">
    <div class="hero">
    </div>
  </div>
  <div class="status">${lang.PRP_NOT_READY}</div>`;
  const eskin = card.querySelector(".avatar .hero");
  s.skin.forEach(sk => {
    const img = new Image();
    img.src = asset[sk].src;
    img.alt = sk;
    eskin.append(img);
  });
  return card;
}

export default class Prepare {
  constructor({onComplete, map, mission}) {
    this.id = "prepare";
    this.onComplete = onComplete;
    this.mission = mission;
    this.map = map;
    this.meReady = false;
    this.readylist = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Prepare");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="nav-desc text">${lang.PRP_MISSION_TITLE}:</div>
        <div class="nav-title text"></div>
      </div>
      <div class="con">
      </div>
      <div class="actions">
        <div class="ts">
          <i></i>
        </div>
        <div class="btn btn-ready">${lang.PRP_BE_READY}</div>
      </div>
    </div>`;
    this.etitle = this.el.querySelector(".nav-title");
    this.eready = this.el.querySelector(".btn-ready");
    this.elist = this.el.querySelector(".con");
  }
  writeDetail() {
    this.etitle.innerHTML = this.mission.name;

    let isValid = sdate.remain(db.job.prepare);
    const launchNote = this.el.querySelector(".actions .ts i");
    launchNote.innerHTML = `${lang.PRP_TS_TEXT} ${isValid}`;

    launchInterval = setInterval(() => {
      if(!db.job.prepare) return;
      isValid = sdate.remain(db.job.prepare);
      launchNote.innerHTML = isValid ? `${lang.PRP_TS_TEXT} ${isValid}` : "";
      if(isValid && Number(isValid.replace(/\D/g, "")) <= 10) Kaudio.play("sfx", "dialogue_process");
      if(!isValid) {
        clearInterval(launchInterval);
        launchInterval = null;
        cloud.asend("prepare_launch", {job_id: db.job.id})
        cloud.send({id:"prepare_launch", to: db.job.onduty.filter(usrID => usrID !== db.char.id).map(usrID => db.job.players[usrID].peer)});
        return this.launch();
      }
    }, 1000);
  }
  writePlayers() {
    db.job.onduty.forEach(k => {
      const userData = k === db.char.id ? db.char : db.job.players[k];
      const card = playerCard(userData);
      this.elist.append(card);
    });
  }
  updatePlayerStatus(user_id) {
    const card = this.elist.querySelector(`.player[x-uid="${user_id}"] .status`);
    if(card) {
      card.classList.add("g");
      card.innerHTML = lang.PRP_BE_READY;
    }
    if(db.job.onduty.includes(user_id)) {
      this.readylist.push(user_id);
    }
    const notReadyRemain = db.job.onduty.filter(k => !this.readylist.includes(k));
    if(notReadyRemain.length < 1) {
      return this.launch();
    }
  }
  async setLeft(usr) {
    if(this.isLocked) return;
    const itemData = new ItemData({_id: "leftOnPrepare", passedData: usr, map:this.map, classBefore:this, onComplete:this.onComplete});
    await this.destroy(itemData);
    kchat.clear();
    kchat.add(db.char.id, lang.TC_LEFT, true);
    db.waiting = db.waiting.filter(k => k.id !== "job_leave");
  }
  resumeMap() {
    this.map.isPaused = true;
    this.map.isPaused = false;
    this.map.overworld.startGameLoop();
  }
  async btnListener() {
    if(kchat.formOpened) kchat.hide();
    this.eready.onclick = () => {
      if(this.meReady) return;
      if(this.isLocked) return;
      this.meReady = true;
      this.updatePlayerStatus(db.char.id);
      this.eready.classList.add("done");
      this.eready.innerHTML = lang.PRP_WAITING;
      cloud.asend("prepare_ready", {job_id: db.job.id});
      const usersPeers = db.job.onduty.filter(k => k !== db.char.id).map(k => db.job.players[k].peer);
      cloud.send({
        id:"prepare_ready",
        to: usersPeers,
        data: { job_id: db.job.id }
      });
    }

    await modal.waittime(500);
    db.waiting.forEach(k => {
      if(this.isLocked) return;
      if(k.id === "job_leave") {
        this.setLeft(k.user);
      } else if(k.id === "prepare_ready") {
        const forceExits = db.waiting.map(xk => xk.id);
        if(!forceExits.includes("job_leave") && !forceExits.includes("job_kick_me")) {
          this.updatePlayerStatus(k.user.id);
          db.waiting = db.waiting.filter(oldk => oldk.id !== "prepare_ready" && k.user.id !== oldk.user.id);
        }
      }
    });
  }
  async launch() {
    if(this.isLocked) return;
    Kaudio.play("sfx", "loadbanner");
    if(kchat.formOpened) kchat.hide();
    this.isLocked = true;
    if(this.map.overworld.map) this.map = this.map.overworld.map;
    Object.values(this.map.gameObjects).forEach(obj => {
      obj.isMounted = false;
    });
    this.map.overworld.startMap( mapList[this.mission.spawn.area] );
    Kaudio.stop("bgm");
    this.map.overworld.map.isCutscenePlaying = true;
    db.onduty = 2;
    db.job.status = 3;
    if(launchInterval) {
      clearInterval(launchInterval);
      launchInterval = null;
    }
    this.el.classList.add("launching");
    await modal.waittime(2000, 5);
    this.meReady = false;
    this.readylist = [];
    this.el.remove();
    this.isLocked = false;
    playerState.pmc = new BannerDrop({
      onComplete: this.onComplete, map: this.map, mission: this.mission
    });
    db.crew = db.job.onduty.filter(usrid => usrid !== db.char.id).map(usrid => db.job.players[usrid].peer);
    playerState.pmc.init();
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(kchat.formOpened) kchat.hide();
      if(launchInterval) {
        clearInterval(launchInterval);
        launchInterval = null;
      }
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.meReady = false;
      this.readylist = [];
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
    this.writePlayers();
    this.btnListener();
  }
}