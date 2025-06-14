import modal from "../helper/modal.js";
import cloud from "../manager/cloud.js";
import db from "../manager/db.js";
import playerState from "../manager/PlayerState.js";
import sdate from "../helper/sdate.js";
import utils from "../main/utils.js";
import mapList from "../manager/mapList.js";
import xhr from "../helper/xhr.js";
import kchat from "../manager/KChat.js";
import LoadAssets from "../manager/LoadAssets.js";
import SetNextMap from "../manager/SetNextMaps.js";
import ForceClose from "./ForceClose.js";
import { lang } from "../helper/lang.js";
import kulonpad from "../mobile/KulonPad.js";

let voteInterval = null;

function playerCard(s, i) {
  const card = document.createElement("tr");
  card.innerHTML = `
  <td class="position">
    <div class="l">
      <i>${i + 1}</i><i>${s.user.username}</i>
    </div>
    <div class="r">
    </div>
  </td>
  <td class="perisma">${s.payout[0].amount}</td>
  <td class="token">${s.payout[1].amount}</td>
  <td class="vote"></td>`;
  return card;
}

export default class Result {
  constructor({onComplete, map, modal_text, far}) {
    this.id = "result";
    this.onComplete = onComplete;
    this.map = map;
    this.mission = playerState.journey.mission;
    this.modal_text = modal_text;
    this.far = far;
    this.votes = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Result");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="nav-title">${this.mission.name}</div>
        <div class="nav-ts">Job</div>
      </div>
      <div class="con">
        <div class="board">
          <table>
            <thead class="thead">
              <tr>
                <th>position</th>
                <th>perisma</th>
                <th>token</th>
                <th>vote</th>
              </tr>
            </thead>
            <tbody class="tbody">
            </tbody>
          </table>
        </div>
      </div>
      <div class="actions">
        <div class="btn txt">Diputuskan dalam 1m 3d</div>
      </div>
    </div>`;
    this.btnQuit = this.el.querySelector(".actions .btn-quit");
    this.elist = this.el.querySelector(".tbody");
    this.eactions = this.el.querySelector(".actions");
    this.ecountdown = this.el.querySelector(".actions .txt");
  }
  writePlayers() {
    const players = db.job.players;
    db.job.onduty.sort((a, b) => {
      if(players[a].ts > players[b].ts) return 1;
      if(players[a].ts < players[b].ts) return -1;
      return 0;
    }).forEach((user_id, i) => {
      const user = user_id === db.char.id ? db.char : players[user_id];
      const payout = this.mission.payout[this.far < 2 ? "fail" : "success"];
      const card = playerCard({user, payout, far:this.far}, i);
      this.elist.append(card);
    });

    const countDown = Date.now() + (this.far === 1 ? (1000 * 31) : (1000 * 11));
    const countText = lang["RE_WAITING_" + (this.far === 1 ? "VOTE" : "QUIT")];
    this.ecountdown.innerHTML = `${countText} ${sdate.remain(countDown)}`;

    voteInterval = setInterval(() => {
      if(!sdate.remain(countDown)) {
        clearInterval(voteInterval);
        voteInterval = null;
        return this.getForContinue();
      }
      this.ecountdown.innerHTML = `${countText} ${sdate.remain(countDown)}`;
    }, 250);
  }
  checkRestart() {
    if(kchat.formOpened) kchat.hide();
    if(this.far === 1) {
      for(let i=1;i<=2;i++) {
        const btnVote = document.createElement("div");
        btnVote.classList.add("btn", "btn-vote", `btn-${ i === 1 ? 'restart' : 'quit' }`);
        btnVote.innerHTML = lang["RE_" + (i === 1 ? "RESTART" : "QUIT")];
        btnVote.onclick = () => {
          const isVoted = this.votes.find(k => k.id === usr.id);
          if(isVoted) return;
          this.setVote(db.char.id, i);
          this.doneVoting();
        }
        this.eactions.append(btnVote);
      }
    }
  }
  setVote(user_id, voteType) {
    const isVoted = this.votes.find(k => k.id === user_id);
    if(!isVoted) this.votes.push({ id: user_id, type: voteType });
    this.votedCheck();
  }
  votedCheck() {
    const notVoteRemains = db.job.onduty.filter(k => !this.votes.find(vt => vt.id === k));
    if(notVoteRemains.length < 1) {
      this.getForContinue();
    }
  }
  async getForContinue() {
    if(kchat.formOpened) kchat.hide();
    const upVote = this.votes.filter(k => k.type === 1);
    const downVote = this.votes.filter(k => k.type === 2);

    if(this.votes.length < 1 || upVote < downVote) {
      db.job = {};
      db.onduty = 1;
      cloud.send({id:"left_team_chat", to: db.crew});
      db.crew = [];
      db.waiting = [];
      db.lastmove = {};
      await this.setMapData("ehek");
      this.leaveMap();
      await this.destroy();
      if(playerState.journey) playerState.journey.end();

      this.map.isCutscenePlaying = true;
      kulonpad.disable();
      await this.map.startCutscene([
        { type: "changeMap",  map: "kulonSafeHouse", x: utils.withGrid(3), y: utils.withGrid(4), direction: "down" }
      ]);
      kulonpad.enable();
      kchat.clear();
      kchat.add(db.char.id, lang.TC_LEFT, true);
    } else {
      await this.setMapData(this.mission.map);
      this.restartMap();
      await this.destroy();
      const usrIdx = db.job.onduty.findIndex(usr_id => usr_id === db.char.id);
      this.map.isCutscenePlaying = true;
      kulonpad.disable();
      await this.map.startCutscene([
        {
          type: "changeMap",  map: this.mission.spawn.area,
          x: utils.withGrid(this.mission.spawn.x),
          y: utils.withGrid(this.mission.spawn.y),
          [this.mission.spawn.inc]: utils.withGrid(this.mission.spawn[this.mission.spawn.inc] + (usrIdx + 2)),
         }
      ]);
      kulonpad.enable();
    }
  }
  doneVoting() {
    const btnVotes = this.eactions.querySelectorAll(".btn-vote");
    btnVotes.forEach(btn => btn.remove());
  }
  leaveMap() {
    const userConfig = {
      type: "Person",
      x: utils.withGrid(3),
      y: utils.withGrid(4),
      src: db.char.skin,
      isPlayerControlled: true,
      direction: "down"
    }
    Object.keys(mapList).forEach(k => {
      mapList[k].configObjects["hero"] = userConfig;
    });
  }
  restartMap() {
    db.job.onduty.forEach((user_id, i) => {
      const isHero = user_id === db.char.id;
      const userConfig = {
        type: "Person",
        x: utils.withGrid((-100 + (i + 2))),
        y: utils.withGrid(-100),
        src: isHero ? db.char.skin : db.job.players[user_id].skin
      }
      if(isHero) userConfig.isPlayerControlled = true;
      const userInit = {
        ...userConfig,
        x: utils.withGrid(this.mission.spawn.x),
        y: utils.withGrid(this.mission.spawn.y),
        [this.mission.spawn.inc]: utils.withGrid(this.mission.spawn[this.mission.spawn.inc] + (i + 1)),
      };
      Object.keys(mapList).forEach(k => {
        mapList[k].configObjects[isHero ? "hero" : `crew_${user_id}`] = (k === this.mission.spawn.area) ? userInit : userConfig;
      });
    });
  }
  setMapData(mapname) {
    return new Promise(async resolve => {
      this.ecountdown.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> DOWNLOADING`;
      const nextAssets = await xhr.get(`/json/assets/st_${mapname}.json`);
      if(!nextAssets) {
        resolve();
        return new ForceClose({
          msg_1: "Connection Failed", msg_2:"Koneksi Gagal",
          action_url: "/app", action_text: "RELOAD"
        }).init();
      }
      await new LoadAssets({skins: nextAssets}).run();
      const nextMap = await xhr.get(`/json/maps/mp_${mapname}.json`);
      SetNextMap(nextMap);
      return resolve();
    });
  }
  resumeMap() {
    this.map.isPaused = true;
    this.map.isPaused = false;
    this.map.overworld.startGameLoop();
  }
  destroy(next=null) {
    return new Promise(async resolve => {
      const canvas = document.querySelector(".canvas");
      canvas.classList.remove("mission-complete");
      if(voteInterval) {
        clearInterval(voteInterval);
        voteInterval = null;
      }
      if(this.isLocked) return;
      if(kchat.formOpened) kchat.hide();
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.el.remove();
      this.isLocked = false;
      playerState.pmc = null;
      this.resumeMap();
      resolve();
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  async init() {
    kulonpad.hide();
    playerState.pmc = this;
    this.map = this.map.overworld.map;
    this.map.isPaused = true;
    await modal.waittime(1000);
    kulonpad.hide();
    if(this.modal_text) {
      kulonpad.hide();
      await modal.alert(this.modal_text);
    }
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.writePlayers();
    this.checkRestart();
    kulonpad.hide();
  }
}