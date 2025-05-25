import { klang, lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import notip from "../helper/notip.js";
import xhr from "../helper/xhr.js";
import utils from "../main/utils.js";
import cloud from "../manager/cloud.js";
import db from "../manager/db.js";
import ItemData from "../manager/itemData.js";
import Kaudio from "../manager/Kaudio.js";
import kchat from "../manager/KChat.js";
import LoadAssets from "../manager/LoadAssets.js";
import mapList from "../manager/mapList.js";
import playerState from "../manager/PlayerState.js";
import SetNextMap from "../manager/SetNextMaps.js";
import Prepare from "./Prepare.js";

function playerCard(s) {
  const card = document.createElement("div");
  card.classList.add("card", "usr");
  card.setAttribute((s.fl ? "x-fl" : "x-pl"), s.id);
  card.innerHTML = `<span>${s.username}</span>`;
  if(s.fl) {
    const eket = document.createElement("div");
    eket.classList.add("st", "o");
    card.append(eket);
  } else {
    if(s.host) {
      const eket = document.createElement("div");
      eket.classList.add("st");
      eket.innerHTML = "HOST";
      card.append(eket);
    } else if(db.job.host === db.char.id) {
      const eket = document.createElement("i");
      eket.classList.add("fa-duotone", "fa-circle-xmark");
      card.append(eket);
    }
  }
  return card;
}

let next_inv = 0;

export default class MatchMaking {
  constructor({onComplete, map, job, mission}) {
    this.id = "matchmaking";
    this.onComplete = onComplete;
    this.map = map;
    this.job = job;
    this.mission = mission;
    this.friendlist = [];
    this.playerlist = [];
    this.invited = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Matchmaking");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="nav-title text">${this.mission.name}</div>
        <div class="nav-desc text">${this.mission.desc[klang.currLang]}</div>
      </div>
      <div class="con">

        <div class="board">
          <div class="board-title">${lang.MM_INVITE_TYPE}</div>
          <div class="board-content">
            <div class="card lr btn-inv-type">${lang.MM_INV_1_TITLE}</div>
            <div class="card textbox txt-inv-type">${lang.MM_INV_1_DESC}</div>
          </div>
        </div>
        <div class="board">
          <div class="board-title">${lang.MM_TEAMUP}: ${this.mission.min}P - ${this.mission.max}P</div>
          <div class="board-content player-list">
          </div>
        </div>
        <div class="board">
          <div class="board-title">${lang.MM_ACT_INV}</div>
          <div class="board-content friend-list">
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="btn btn-cancel">${lang.EXIT}</div>
        <div class="btn btn-start disabled">${db.job.host === db.char.id ? lang.TS_START : lang.MM_WAITING}</div>
      </div>
    </div>`;
    this.efl = this.el.querySelector(".friend-list");
    this.epl = this.el.querySelector(".player-list");
    this.btnInvType = this.el.querySelector(".btn-inv-type");
    this.txtInvType = this.el.querySelector(".txt-inv-type");
    this.btnStart = this.el.querySelector(".btn-start");
  }
  updateJobData(s) {
  }
  btnListener() {
    if(kchat.formOpened) kchat.hide();
    const btnCancel = this.el.querySelector(".btn-cancel");
    btnCancel.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_exit");
      this.isLocked = true;
      const isHost = db.job.host === db.char.id;
      const cancelConfirm = await modal.confirm({
        msg: lang[isHost ? "MM_NOTIP_DISBAND" : "MM_NOTIP_EXIT"],
        okx: lang[isHost ? "MM_DISBAND" : "EXIT"]
      });
      if(!cancelConfirm) {
        this.isLocked = false;
        return;
      }
      db.job = {};
      this.isLocked = false;
      cloud.asend("exitfromjob");
      if(playerState.pmc?.id === "prepare") {
        return playerState.pmc.setLeft(db.char);
      }
      this.resumeMap();
      this.destroy();
    }
    this.btnInvType.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "phone_selected");
      if(db.job.host !== db.char.id) {
        await modal.alert(lang.MM_NOTIP_HOST_FUNC);
        return;
      }
      db.job.ivt++;
      if(db.job.ivt > 3) db.job.ivt = 1;
      const passData = {
        invite_type: db.job.ivt,
        job_id: db.job.id
      };
      cloud.asend("job_type_invite", passData);
      cloud.send({
        id: "job_type_invite",
        to: Object.values(db.job.players).filter(usr => usr.id !== db.char.id && usr.peer).map(usr => usr.peer),
        data: passData
      });
      this.updateInviteType();
    }
    this.btnStart.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      if(db.job.host !== db.char.id) return modal.alert(lang.MM_NOTIP_WAITING_HOST);
      this.isLocked = true;
      const pdb = Object.keys(db.job.players);
      if(pdb.length <= 1) {
        const confAlone = await modal.confirm(lang.MM_ALONE);
        if(!confAlone) {
          this.isLocked = false;
          return;
        }
      }
      if(pdb.length > this.mission.max || pdb.length < this.mission.min) {
        await modal.alert(lang.MM_NOTIP_WAITING_PLAYER);
        this.isLocked = false;
        return;
      }
      this.btnStart.style.width = this.btnStart.offsetWidth;
      this.btnStart.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
      const startJob = await xhr.post("/x/job/launch", {job_id: db.job.id});
      if(startJob.code === 429) {
        this.isLocked = false;
        await modal.waittime(1000);
        this.btnStart.click();
        return;
      }
      if(!startJob.ok) {
        this.btnStart.innerHTML = lang.TS_START;
        await modal.alert(startJob?.msg?.[klang.currLang] || lang.MM_JOB_INVALID);
        this.isLocked = false;
        return;
      }
      db.job = startJob.data.job;
      cloud.send({
        id: "job_start",
        to: startJob.data.peers,
        data: { job_id: db.job.id }
      });
      this.launch();
    }
  }
  resumeMap() {
    this.map.isPaused = true;
    this.map.isPaused = false;
    this.map.overworld.startGameLoop();
  }
  updateInviteType() {
    this.btnInvType.innerHTML = lang["MM_INV_" + db.job.ivt.toString() + "_TITLE"];
    this.txtInvType.innerHTML = lang["MM_INV_" + db.job.ivt.toString() + "_DESC"].replace("{TEAM_CODE}", db.job.code);
  }
  updatePlayers(id_removed = null) {
    if(id_removed) {
      kchat.add(id_removed, lang.TC_LEFT, true);
      if(this.invited.includes(id_removed)) {
        this.invited = this.invited.filter(k => k !== id_removed);
      }
      const onPlayerList = this.playerlist.includes(id_removed);
      if(onPlayerList) this.playerlist = this.playerlist.filter(k => k !== id_removed);
      const card_to_remove = this.epl.querySelector(`.card[x-pl="${id_removed}"]`);
      if(card_to_remove) card_to_remove.remove();

      if(db.job.host === id_removed) {
        const userLeft = db.job.players[id_removed];
        notip({
          a: userLeft.username,
          b: lang.JOB_DISBANDED,
          c: "4",
          ic: "person-to-door",
        });
        db.job = {};
        db.onduty = 1;
        return this.setLeft(userLeft);
      } else if(db.job?.players?.[id_removed] && !this.isLaunching) {
        delete db.job.players[id_removed];
      } else if(db.job?.players?.[id_removed]) {
        db.waiting.push({ _n: 1, id: "job_leave", user: db.job.players[id_removed] });
      }
    }
    const pr = Object.keys(db.job.players || {});
    const npr = pr.filter(k => !this.playerlist.includes(k));
    npr.forEach(k => {
      kchat.add(k, lang.TC_JOINED, true);
      this.playerlist.push(k);
      if(this.invited.includes(k)) {
        this.invited = this.invited.filter(oldk => oldk !== k);
      }
      const playerData = k === db.char.id ? {...db.char, host: db.job.host === k} : {...db.job.players[k], host: db.job.host === k};
      const card = playerCard(playerData);
      card.onclick = async() => {
        if(db.job.host !== db.char.id) return;
        if(db.job.host === playerData.id) return;
        if(this.isLocked) return;
        Kaudio.play("sfx", "phone_selected");
        this.isLocked = true;
        const kickConfirm = await modal.confirm(lang.MM_CONFIRM_KICK.replace("{user}", playerData.username));
        if(!kickConfirm) {
          this.isLocked = false;
          return;
        }
        const kickPlayer = await xhr.post("/x/job/kick", {
          user_id: playerData.id,
          job_id: db.job.id
        });
        if(!kickPlayer.ok) {
          await modal.alert(lang[kickPlayer.msg] || lang.ERROR);
          this.isLocked = false;
          return;
        }
        this.isLocked = false;
        delete db.job.players[kickPlayer.data.user.id];
        this.updatePlayers(kickPlayer.data.user.id);
        this.updateFriendStatus(kickPlayer.data.user.id, -1);
        if(kickPlayer.data.peers) {
          cloud.send({id:"job_kick",to:kickPlayer.data.peers,data:{job_id:db.job.id}});
        }
      };
      if(db.job.host === k) {
        this.epl.prepend(card);
      } else {
        this.epl.append(card);
      }
    });
    this.updateStart();
  }
  updateFriendList(id_removed = null) {
    if(id_removed) {
      const onFriendList = this.friendlist.includes(id_removed);
      if(onFriendList) this.friendlist = this.friendlist.filter(k => k !== id_removed);
      const card_to_remove = this.efl.querySelector(`.card[x-fl="${id_removed}"]`);
      if(card_to_remove) card_to_remove.remove();
    }
    const fr = Object.values(db.friends || {});
    const nfl = fr.filter(k => !this.friendlist.includes(k.id));
    nfl.forEach(usr => {
      this.friendlist.push(usr.id);
      const card = playerCard({...usr, fl: 1});
      card.onclick = async() => {
        if(this.playerlist.includes(usr.id)) return;
        if(this.invited.includes(usr.id)) return;
        Kaudio.play("sfx", "menu_select");
        if(next_inv > Date.now()) return modal.alert(lang.MM_TOO_FAST_CLICKS);
        if(this.isLocked) return;
        next_inv = Date.now() + 1000;
        this.isLocked = true;
        if(db.job.host !== db.char.id && db.job.ivt >= 3) {
          await modal.alert(lang.MM_NOTIP_HOST_INV);
          this.isLocked = false;
          return;
        }
        this.updateFriendStatus(usr.id, 4);
        const usrInv = await xhr.post("/x/job/invite", {
          job_id: db.job.id,
          id: usr.id
        });
        if(!usrInv.ok && usrInv.code === 404) {
          if(usrInv.data?.invite_type) {
            db.job.ivt = usrInv.data.invite_type;
          }
          this.updateInviteType();
          this.updateFriendStatus(usr.id, -1);
          await modal.alert(lang[usrInv.msg] || lang.ERROR);
          this.isLocked = false;
          return;
        }
        if(usrInv.ok && usrInv.data.status === 1) {
          if(!this.invited.includes(usr.id)) this.invited.push(usr.id);
          db.friends[usr.id].peer = usrInv.data.peers[0];
          cloud.send({
            id: "job_invite",
            to: usrInv.data.peers
          });
        }
        this.updateFriendStatus(usr.id, usrInv.data?.status || 0);
        this.isLocked = false;
      }
      this.efl.append(card);
      if(this.playerlist.includes(usr.id)) {
        this.updateFriendStatus(usr.id, 2);
      }
    });
    if(fr.length < 1) {
      const empBefore = this.efl.querySelector(".empty-card");
      if(!empBefore) {
        const emptyCard = document.createElement("div");
        emptyCard.classList.add("card", "empty-card", "usr");
        emptyCard.innerHTML = `<span class="ita">${lang.FR_EMPTY}</span>`;
        this.efl.append(emptyCard);
      }
    } else {
      const empBefore = this.efl.querySelector(".empty-card");
      if(empBefore) empBefore.remove();
    }
  }
  updateFriendStatus(user_id, user_status, user_peer=null) {
    const samePeerId = db.friends[user_id]?.peer === user_peer;
    if((user_peer && samePeerId) && (user_status === 5) && this.invited.includes(user_id)) return;
    if((user_peer && !samePeerId) && this.invited.includes(user_id)) {
      this.invited = this.invited.filter(inv_user_id => inv_user_id !== user_id)
    }
    const cardST = this.efl.querySelector(`.card[x-fl="${user_id}"] .st`);
    if(!cardST) return;
    cardST.classList.remove("j", "y", "o", "b", "gb");
    if(user_status === -1) {
      cardST.classList.add("o");
      cardST.innerHTML = "";
    } else if(user_status === 1) {
      cardST.classList.add("y");
      cardST.innerHTML = "INVITED";
    } else if(user_status === 2) {
      cardST.classList.add("j");
      cardST.innerHTML = "JOINED";
    } else if(user_status === 3) {
      cardST.classList.add("b");
      cardST.innerHTML = "BUSY";
    } else if(user_status === 4) {
      cardST.classList.add("y");
      cardST.innerHTML = "INVITING";
    } else if(user_status === 5) {
      cardST.classList.add("gb");
      cardST.innerHTML = "ONLINE";
    } else {
      cardST.classList.add("o");
      cardST.innerHTML = "OFFLINE";
    }
  }
  async updateStart() {
    if(this.isLocked) return;
    const pdb = Object.keys(db.job.players);
    if(pdb.length <= this.mission.max && pdb.length >= this.mission.min) {
      if(this.btnStart.classList.contains("disabled"))
        this.btnStart.classList.remove("disabled");
    } else {
      if(!this.btnStart.classList.contains("disabled"))
        this.btnStart.classList.add("disabled");
    }

    await modal.waittime(500);
    db.waiting.forEach(k => {
      if(k.id === "job_leave") {
        this.updatePlayers(k.user.id);
      } else if(k.id === "job_start") {
        const forceExits = db.waiting.map(xk => xk.id);
        if(!forceExits.includes("job_leave") && !forceExits.includes("job_kick_me")) {
          this.launch();
          db.waiting = db.waiting.filter(oldk => oldk.id !== "job_start");
        }
      } else if(k.id === "job_kick_me") {
        notip({
          a: "JOB",
          b: lang.MM_GOT_KICKED,
          c: "4",
          ic: "person-to-door",
        });
        db.waiting = db.waiting.filter(oldk => oldk.id !== "job_kick_me");
        this.resumeMap();
        this.destroy();
      }
    });
  }
  setMapData() {
    return new Promise(async resolve => {
      const nextMap = await xhr.get(`/json/maps/mp_${this.mission.map}.json`);
      this.btnStart.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> DOWNLOADING`;
      const nextAssets = await xhr.get(`/json/assets/st_${this.mission.map}.json`);
      const completeScenes = await xhr.get(`/json/scenes/cs_${this.mission.map}.json`);
      this.mission.scenes = completeScenes;
      await new LoadAssets({skins: nextAssets}).run();
      SetNextMap(nextMap, { uid: (db.job?.onduty || null), me: db.char.id });
      db.job?.onduty?.forEach((user_id, i) => {
        db.job.map[user_id] = this.mission.spawn.area;
        const isHero = user_id === db.char.id;
        const userConfig = {
          type: "Person",
          x: utils.withGrid((10000 + (i + 1 + i))),
          y: utils.withGrid(10000),
          direction: this.mission.spawn.direction,
          src: isHero ? db.char.skin : db.job.players[user_id].skin
        }
        if(isHero) userConfig.isPlayerControlled = true;
        const userInit = {
          ...userConfig,
          x: utils.withGrid(this.mission.spawn.x),
          y: utils.withGrid(this.mission.spawn.y),
          [this.mission.spawn.inc]: utils.withGrid(this.mission.spawn[this.mission.spawn.inc] + (i + 1 + i)),
        };
        Object.keys(mapList).forEach(k => {
          mapList[k].configObjects[isHero ? "hero" : `crew_${user_id}`] = (k === this.mission.spawn.area) ? userInit : userConfig;
        });
      });
      resolve();
    });
  }
  async launch() {
    this.isLaunching = true;
    this.isLocked = true;
    db.job.map = {};
    if(kchat.formOpened) kchat.hide();
    await this.setMapData();
    if(playerState.pmc?.id !== "matchmaking") return;
    const prepare = new Prepare({onComplete:this.onComplete,map:this.map,mission:this.mission});
    this.isLocked = false;
    this.destroy(prepare);
  }
  async setLeft(usr) {
    if(this.isLocked) return;
    const itemData = new ItemData({_id: "leftOnPrepare", passedData: usr, classBefore:this, onComplete:this.onComplete});
    await this.destroy(itemData);
    kchat.clear();
    kchat.add(db.char.id, lang.TC_LEFT, true);
    db.waiting = db.waiting.filter(k => k.id !== "job_leave");
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      if(next) Kaudio.play("sfx", "loadPrepare");
      if(kchat.formOpened) kchat.hide();
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      if(next) Kaudio.stop("bgm");
      this.friendlist = [];
      this.playerlist = [];
      this.invited = [];
      this.el.remove();
      this.isLocked = false;
      playerState.pmc = null;
      if(!next) {
        kchat.clear();
        kchat.add(db.char.id, lang.TC_LEFT, true);
      }
      resolve();
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.map.isPaused = true;
    this.updatePlayers();
    this.updateFriendList();
    this.updateInviteType();
    this.updateStart();
    this.btnListener();
  }
}