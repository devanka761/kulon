import { klang, lang } from "../helper/lang.js";
import cloud_items from "../../../../client/json/items/cloud_items.json";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";
import db from "../manager/db.js";
import MatchMaking from "./MatchMaking.js";
import OverworldEvent from "../main/OverworldEvent.js";

const localeMode = {
  "0": "SOLO",
  "1": "COOP",
  "2": "VS"
}

function missionCard(s) {
  const price = cloud_items.find(citm => citm.id === s.price[0]);

  const card = document.createElement("div");
  card.classList.add("card");
  if(!s.ready) card.classList.add("dev");
  card.innerHTML = `
  <div class="card-title">${s.name}</div>
  <div class="card-req">
    <div class="req req-mode">
      <i>${s.min === s.max ? s.max + 'P' : s.min + 'P - ' + s.max + 'P'}</i>
      <i>(${localeMode[s.mode.toString()]}) ${s.ready ? '' : ' UNDER DEVELOPMENT'}</i>
    </div>
    <div class="req req-price">
      <img src="./assets/items/cloud/${price.src}.png" alt="${price.name[klang.currLang]}" />
      <i>${s.price[1].toString()}</i>
    </div>
  </div>`;
  return card;
}
function loadingCard(text) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `<div class="card-title">${text ? text : '<i class="fa-solid fa-circle-notch fa-spin"></i> LOADING'}</div>`;
  return card;
}

export default class MissionBoard {
  constructor({onComplete, map}) {
     this.onComplete = onComplete;
     this.map = map;
     this.items = null;
     this.choosen = null;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-missionboard");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-car-burst"></i> Mission Board</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="economies">
          <div class="eco eco-story">
            <img src="./assets/items/cloud/ticket_story.png" alt="story" />
            <span>8</span>
          </div>
          <div class="eco eco-minigame">
            <img src="./assets/items/cloud/ticket_minigame.png" alt="minigame" />
            <span>10</span>
          </div>
        </div>
        <div class="boards">
          <div class="board">
            <div class="board-title">STORY MODE</div>
            <div class="board-list list-story">
            </div>
          </div>
          <div class="board">
            <div class="board-title">MINI GAMES</div>
            <div class="board-list list-minigame">
            </div>
          </div>
        </div>
        <div class="actions"><div class="btn btn-start disabled">${lang.TS_START}</div></div>
      </div>
    </div>`;
    this.btnStart = this.el.querySelector(".btn-start");
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy();
    }
  }
  updateEconomies() {
    const estory = this.el.querySelector(".economies .eco-story span");
    const eminigame = this.el.querySelector(".economies .eco-minigame span");
    this.items = db.char.backpack;

    const xstory = Object.values(this.items).filter(k => k.id === "CL00003" && (!k.expiry || k.expiry > Date.now())).map(k => k.amount || 0).reduce((a,b) => a + b, 0);
    const xminigame = Object.values(this.items).filter(k => k.id === "CL00004" && (!k.expiry || k.expiry > Date.now())).map(k => k.amount || 0).reduce((a,b) => a + b, 0);

    estory.innerHTML = xstory;
    eminigame.innerHTML = xminigame;
  }
  async writeData() {
    Kaudio.play("sfx", "phone_selected");
    this.eboard1 = this.el.querySelector(".boards .board .list-story");
    this.eboard2 = this.el.querySelector(".boards .board .list-minigame");
    const card1 = loadingCard();
    const card2 = loadingCard();
    this.eboard1.append(card1);
    this.eboard2.append(card2);
    this.mission_list = await xhr.get("/json/main/missions.json");
    card1.remove();
    card2.remove();
    this.writeStory();
    this.writeMinigames();
  }
  writeStory() {
    const missions = this.mission_list.filter(k => !k.beta && k.group === 1);
    const eboard = this.el.querySelector(".boards .board .list-story");

    missions.forEach(s => {
      const card = missionCard(s);
      card.onmousedown = () => {
        if(!s.ready) return;
        Kaudio.play("sfx", "phone_selected");
        this.updateChoices(card, s);
      }
      eboard.append(card);
    });
  }
  writeMinigames() {
    const missions = this.mission_list.filter(k => k.group === 2);
    const eboard = this.el.querySelector(".boards .board .list-minigame");

    missions.forEach(s => {
      const card = missionCard(s);
      card.onmousedown = () => {
        if(!s.ready) return;
        Kaudio.play("sfx", "phone_selected");
        this.updateChoices(card, s);
      }
      eboard.append(card);
    });
  }
  updateChoices(card, s) {
    const selectedbefore = this.el.querySelectorAll(".boards .board .board-list .card.selected");
    selectedbefore.forEach(el => el.classList.remove("selected"));
    card.classList.add("selected");
    if(this.btnStart.classList.contains("disabled")) {
      this.btnStart.classList.remove("disabled");
    }
    this.choosen = s.id;
    this.btnStart.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;
      const createJob = await modal.loading(xhr.post("/x/job/create", {
        mission_id: this.choosen
      }));
      if(!createJob.ok) {
        const price = cloud_items.find(citm => citm.id === s.price[0]);
        await modal.alert((createJob.msg[klang.currLang] || lang.ERROR).replace("{PRICE_REQ}", price.name[klang.currLang]));
        this.isLocked = false;
        return;
      }
      db.job = createJob.data;
      if(!s.mode || s.mode === 0) return this.startEvents(createJob.data, s);
      else return this.startMission(createJob.data, s);
    }
  }
  async startMission(jobdata, s) {
    const matchMaking = new MatchMaking({
      onComplete: this.onComplete,
      map: this.map,
      job: jobdata,
      mission: s
    });
    this.isLocked = false;
    await this.destroy(matchMaking);
  }
  async startEvents(jobdata, s) {
    this.isLocked = false;
    await this.destroy("events");
    const events = s.events;
    for(const evt of events) {
      const eventHandler = new OverworldEvent({
        event: evt,
        map: this.map,
      });
      const result = await eventHandler.init();
      if (result === "BATAL") {
        break;
      }
    }
    db.job = {};
    this.onComplete();
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.items = null;
      this.choosen = null;
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
    this.updateEconomies();
    this.btnListener();
    this.writeData();
  }
}