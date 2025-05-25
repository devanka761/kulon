import modal from "../helper/modal.js";
import playerState from "../manager/PlayerState.js";
import Journey from "../manager/Journey.js";
import kchat from "../manager/KChat.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

export default class BannerDrop {
  constructor({onComplete, map, mission}) {
    this.id = "bannerdrop";
    this.onComplete = onComplete;
    this.map = map;
    this.mission = mission;
    this.latestRun = null;
    this.currentMemory = 1;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("BannerDrop");
  }
  async startMemory() {
    this.map.overworld.map.isCutscenePlaying = true;
    Kaudio.play("bgm", "mission_completed_bgm", true);
    if(kchat.formOpened) kchat.hide();
    await new Promise(async resolve => {
      await this.playMemory(resolve);
    });
    this.endMemory();
  }
  async playMemory(done) {
    if(this.currentMemory > this.mission.memory.length) return done();
    const card = document.createElement("div");
    card.classList.add("subtitle");
    card.innerHTML = this.mission.memory[this.currentMemory - 1].text[klang.currLang];
    this.el.append(card);
    await modal.waittime(3000 + this.mission.memory[this.currentMemory - 1].ts);
    card.classList.add("out");
    await modal.waittime(1000, 5);
    card.remove();
    this.currentMemory++;
    return this.playMemory(done);
    // if(this.currentMemory <= this.mission.memory.length) {
    //   return this.playMemory(done);
    // } else {
    //   done();
    // }
  }
  async endMemory() {
    const card = document.createElement("div");
    card.classList.add("title");
    card.innerHTML = this.mission.name;
    this.el.append(card);
    Kaudio.play("nfx2", "mission_started_bgm");
    await modal.waittime(2000);
    Kaudio.stop("bgm");
    Kaudio.play("bgm", "outside2", 1);
    this.resumeMap();
    this.map.overworld.map.isCutscenePlaying = false;
    new Journey({ map: this.map, mission: this.mission }).standBy();
    if(this.latestRun?.id === "job_leave") {
      playerState.pmc = null;
      this.onComplete();
      await modal.waittime(1000);
      this.el.classList.add("out");
      this.map.startCutscene([
        {type: "journeyResult", text: lang.PRP_ON_LEFT.replace("{user}", this.latestRun.user.username)}
      ]);
      this.latestRun = null;
      await modal.waittime(1000);
      this.el.remove();
    }
    this.destroy();
    this.el.classList.add("out");
    await modal.waittime(5000, 5);
    this.el.remove();
  }
  resumeMap() {
    this.map.isPaused = true;
    this.map.isPaused = false;
    this.map.overworld.startGameLoop();
  }
  destroy(next) {
    if(this.isLocked) return;
    this.latestRun = null;
    playerState.pmc = null;
    if(!next) return this.onComplete();
    if(typeof next !== "string") return next.init();
  }
  init() {
    playerState.pmc = this;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.startMemory();
  }
}