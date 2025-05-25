import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import playerState from "../manager/PlayerState.js";
import db from "../manager/db.js";
import mapList from "../manager/mapList.js";

function createCurrent(text) {
  text = text.replace("kulon", "");
  const card = document.createElement("div");
  card.classList.add("empty");
  card.innerHTML = text ? `${text} - ${lang.CURRENT}` : (lang.EMPTY || "Empty");
  return card;
}

function createTxt(text) {
  const card = document.createElement("div");
  card.classList.add("txt");
  card.innerHTML = text;
  return card;
}
function createBtn(text) {
  text = text.replace("kulon", "");
  const card = document.createElement("div");
  card.classList.add("btn");
  card.innerHTML = text;
  return card;
}

export default class AdminTP {
  constructor({ onComplete, map, classBefore=null } = { onComplete, map }) {
    this.id = "admintp";
    this.onComplete = onComplete;
    this.map = map;
    this.classBefore = classBefore;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "a-tp");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-location-dot"></i> Teleport</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
      </div>
    </div>`;
    this.list = this.el.querySelector(".con");
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => this.destroy(this.classBefore);
  }
  writePlayers() {
    const players = {...db.job.players};
    delete players[db.char.id];
    const onMaps = Object.keys(db.job?.map || {}).filter(k => k !== db.char.id);
    onMaps.forEach(k => {
      const card = createBtn(players[k].username);
      card.onclick = () => {
        const crew = mapList[db.job.map[k]]?.configObjects?.[`crew_${k}`];
        if(!crew || !crew.x || !crew.y) return this.destroy(this.classBefore);
        this.changeMap(db.job.map[k], crew.x, crew.y);
      }
      this.list.prepend(card);
    });
    if(onMaps.length >= 1) this.list.prepend(createTxt("TEAM"));
  }
  writeMaps() {
    this.list.append(createTxt("MAP"));
    const areas = Object.keys(mapList || {})
    areas.forEach(k => {
      const card = (k === this.map.mapId) ? createCurrent(k) : createBtn(k);
      card.onclick = () => {
        if(k === this.map.mapId) return;
        const sz = mapList[k]?.safeZone;
        if(!sz || !sz.x || !sz.y) return this.destroy(this.classBefore);
        this.changeMap(k, sz.x, sz.y);
      }
      this.list.append(card);
    });
  }
  async changeMap(mapId, x, y) {
    await this.destroy();
    this.map.startCutscene([
      { type:"changeMap", direction:"down", map:mapId, x, y }
    ]);
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
    if(this.map.overworld.map) this.map = this.map.overworld.map;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.btnListener();
    this.writePlayers();
    this.writeMaps();
  }
}