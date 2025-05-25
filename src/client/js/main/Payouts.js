import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import db from "../manager/db.js";
import Kaudio from "../manager/Kaudio.js";
import kchat from "../manager/KChat.js";
import playerState from "../manager/PlayerState.js";
import Result from "../pages/Result.js";

export default class Payouts {
  constructor({onComplete, map}) {
    this.id = "payouts";
    this.onComplete = onComplete;
    this.map = map;
    this.mission = playerState.journey.mission;
    this.canvas = document.querySelector(".canvas");
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Payouts");
    this.el.innerHTML = `
    <div class="box">
      <div class="completed">${lang.PAYOUT_COMPLETED}</div>
      <div class="economies">
        <div class="eco">
          <i class="eco-desc">+${this.mission.payout.success[1].amount}</i>
          <i class="eco-title">TOKEN</i>
        </div>
        <div class="eco">
          <i class="eco-desc">+${this.mission.payout.success[0].amount}</i>
          <i class="eco-title">PERISMA</i>
        </div>
      </div>
      <div class="crews">
      </div>
    </div>
    <div class="changed"></div>`;
    this.echanged = this.el.querySelector(".changed");
    this.elecos = this.el.querySelector(".economies");
    this.ecos = this.el.querySelectorAll(".eco");
    this.currEco = this.ecos.length;
    this.elcrews = this.el.querySelector(".crews");
    this.etitle = this.el.querySelector(".completed");
    this.box = this.el.querySelector(".box");
  }
  writePlayers() {
    db.job.status = 4;
    this.map.isPaused = true;
    const playerKeys = Object.keys(db.job.players);
    const players = db.job.players;
    playerKeys.sort((a, b) => {
      if(players[a].ts > players[b].ts) return 1;
      if(players[a].ts < players[b].ts) return -1;
      return 0;
    }).forEach((k, i) => {
      const card = document.createElement("div");
      card.classList.add("crew");
      card.innerHTML = `<i>${(i + 1)}</i> ${(k === db.char.id ? db.char : players[k]).username}`;
      this.elcrews.appendChild(card);
    });
  }
  async writePayouts() {
    this.canvas.classList.add("mission-complete");
    this.crews = this.el.querySelectorAll(".crew");
    this.currCrew = this.crews.length;
    Kaudio.play("sfx", "complete_triggered");
    await modal.waittime(1000);
    Kaudio.play("bgm", "mission_completed_bgm", true);
    await new Promise(resolve => this.setTitle(resolve));
    await new Promise(resolve => this.setCrew(resolve));
    await new Promise(resolve => this.setEco(resolve));
    await modal.waittime(3000);
    this.setBoxDown();
    this.setTransition();
    await modal.waittime(1000);
    Kaudio.play("bgm", "inside_bgm", true);
    this.box.remove();
    await modal.waittime(1000);
    const resultBoard = new Result({
      onComplete: async() => {
        await modal.waittime(1000);
        this.echanged.style.opacity = "0";
        await modal.waittime(500);
        this.el.style.opacity = "0";
        await modal.waittime(1000);
        this.el.remove();
        this.onComplete();
      }, map: this.map, far: 2, modal_text: null
    });
    this.destroy(resultBoard);
  }
  async setTitle(done) {
    this.el.style.opacity = "1";
    await modal.waittime(2000);
    Kaudio.play("sfx", "crew");
    await modal.waittime(150);
    this.etitle.style.transform = "translateY(0)";
    await modal.waittime(3000);
    done();
  }
  async setCrew(done) {
    if(this.currCrew <= 0) {
      await modal.waittime(2000);
      return done();
    }
    Kaudio.play("sfx", "crew");
    await modal.waittime(100);
    const currTranslate = Math.floor(((this.currCrew - 1) / this.crews.length) * 100);
    this.elcrews.style.transform = "translateY(-" + currTranslate  + "%)";
    const currTitle = ((100 / (this.currCrew + 1)));
    this.etitle.style.transform = "translateY(calc(" + currTitle + "% - 1em))";
    await modal.waittime(800);
    this.currCrew--;
    this.setCrew(done);
  }
  async setEco(done) {
    if(this.currEco <= 0) {
      Kaudio.play("sfx", "reward");
      this.box.style.transform = "scale(1)";
      await modal.waittime(3000);
      return done();
    }
    Kaudio.play("sfx", "crew");
    this.ecos[this.currEco - 1].style.transform = "translateY(-50vh)";
    await modal.waittime(250);
    this.ecos[this.currEco - 1].style.transition = "0.1s";
    this.ecos[this.currEco - 1].style.transform = "translateY(-7em)";
    await modal.waittime(750);
    this.ecos[this.currEco - 1].style.transition = "0.5s";
    this.currEco--;
    this.setEco(done);
  }
  setTransition() {
    this.echanged.style.opacity = "1";
    setTimeout(() => {
      Kaudio.play("nfx1", "Result_SFX");
    }, 750);
  }
  setBoxDown() {
    Kaudio.play("sfx", "complete_out");
    this.box.style.transform = "translateY(100vh)";
    Kaudio.stop("bgm");
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      if(kchat.formOpened) kchat.hide();
      playerState.pmc = null;
      resolve();
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    if(this.map.overworld.map) this.map = this.map.overworld.map;
    this.map.isPaused = true;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.writePlayers();
    this.writePayouts();
  }
}