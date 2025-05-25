import cloud_items from "../../../../client/json/items/cloud_items.json";
import trophy_list from "../../../../client/json/main/trophies.json";
import { klang, lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import notip from "../helper/notip.js";
import db from "./db.js";
import kchat from "./KChat.js";
import playerState from "./PlayerState.js";

const criticals = ["job_leave"];

export default class ClientData {
  constructor({id}) {
    this.id = id;
  }
  mails(s) {
    const oldDB = db.char.mails;
    if(!oldDB) db.char.mails = {};
    Object.keys(s).forEach(k => {
      if(!oldDB[k]) db.char.mails[k] = s[k];
    });
    s = db.char.mails;
    if(playerState.pmc?.id === "mails") {
      playerState.pmc.updateList();
    }
    const unread = Object.keys(s).filter(k => !s[k].claimed || s[k].claimed === false).map(k => {
      return {...s[k], _id:k}
    });
    if(!db.unread["mails"]) db.unread["mails"] = {};
    unread.forEach(k => db.unread["mails"][k._id] = 1);
    if(unread.length >= 1) {
      if(!playerState.setting["201"]) notip({
        a: lang.NP_MAIL_TITLE,
        b: lang.NP_MAIL_REMAINS.replace("{amount}", unread.length),
        ic: "envelope"
      });
    }
  }
  trophies(s) {
    if(!db.char.trophies) db.char.trophies = {};
    Object.keys(s).forEach(k => {
      db.char.trophies[k] = s[k];
    });
    s = db.char.trophies;
    if(!db.unread["trophies"]) db.unread["trophies"] = {};
    const unreads = Object.keys(s).filter(k => s[k].done && !s[k].claimed).sort((a, b) => {
      if(s[a].ts > s[b].ts) return 1;
      if(s[a].ts < s[b].ts) return -1;
      return 0;
    });
    unreads.map(k => {
      db.unread["trophies"][k] = 1;
      if(playerState.pmc?.id === "trophies") {
        playerState.pmc.updateBtn();
        playerState.pmc.writeItems();
      }
    });
    if(unreads.length >= 1) {
      const item = trophy_list[unreads[unreads.length - 1]];
      if(!playerState.setting["202"]) notip({
        a: item.t[klang.currLang],
        b: lang.ACH_UNLOCKED,
        ic: "trophy-star",
        c: "2"
      });
    }
  }
  requests(s) {
    const oldDB = db.char.requests;
    if(!oldDB) db.char.requests = {};
    Object.keys(s).forEach(k => {
      if(!db.char.requests[k]) db.char.requests[k] = s[k];
    });
    s = db.char.requests;
    const unread = Object.keys(s);
    if(!db.unread["friends"]) db.unread["friends"] = {};
    unread.forEach(k => db.unread["friends"][k] = 1);
    if(unread.length >= 1) {
      if(playerState.pmc && playerState.pmc.id === "friends") {
        playerState.pmc.writeReqData();
      }
      if(!playerState.setting["203"]) notip({
        a: lang.NP_REQUESTS_TITLE,
        b: lang.NP_REQUESTS_REMAINS.replace("{amount}", unread.length),
        ic: "face-sunglasses"
      });
    }
  }
  acceptedfriend(s) {
    const oldDB = db.friends;
    if(!oldDB) db.friends = {};
    Object.keys(s).forEach(k => {
      if(!db.friends[k]) db.friends[k] = s[k];
    });
    if(playerState.pmc?.id === "friends") {
      playerState.pmc.writeFriendData();
    } else if(playerState.pmc?.id === "matchmaking") {
      playerState.pmc.updateFriendList();
    }
  }
  cancelrequest(s) {
    const oldDB = db.char.requests;
    if(!oldDB) db.char.requests = {};
    if(!db.unread["friends"]) db.unread["friends"] = {};
    Object.keys(s).forEach(k => {
      if(db.char.requests[k]) {
        delete db.char.requests[k];
      }
      if(playerState.pmc && playerState.pmc.id === "friends") {
        playerState.pmc.writeReqData(s[k].id);
      }
      if(db.unread["friends"][k]) delete db.unread["friends"][k];
    });
  }
  unfriend(s) {
    const oldDB = db.friends;
    if(!oldDB) db.friends = {};
    Object.keys(s).forEach(k => {
      if(db.friends[k]) {
        delete db.friends[k];
      }
      if(playerState.pmc?.id === "friends") {
        playerState.pmc.writeFriendData(s[k].id);
      } else if(playerState.pmc?.id === "matchmaking") {
        playerState.pmc.updateFriendList(s[k].id);
      }
    });
  }
  job_invite(s) {
    const oldDB = db.inv_job;
    if(!oldDB) db.inv_job = {};
    if(!db.unread["jobs"]) db.unread["jobs"] = {};
    db.unread["jobs"].inv = true;
    Object.values(s).forEach(k => {
      const merge_id = k.id + "_" + k.inviter.id;
      const sameInviters = Object.keys(db.inv_job).filter(oldK => db.inv_job[oldK].inviter.id === k.inviter.id);
      sameInviters.forEach(oldk => {
        if(playerState.pmc?.id === "jobs") {
          playerState.pmc.updateJobList(oldk);
        }
        delete db.inv_job[k];
      });
      if(!db.inv_job[merge_id]) db.inv_job[merge_id] = {...k, key: merge_id, ts: Date.now()};
      if(playerState.pmc?.id === "jobs") {
        playerState.pmc.updateJobList();
      }
      if(!playerState.setting["204"]) notip({
        a: k.inviter.username,
        b: lang.NP_JOBINV_DESC,
        ic: "briefcase"
      });
    });
  }
  job_accept(s) {
    Object.values(s).forEach(usr => {
      db.job.players[usr.id] = usr;
      if(playerState.pmc?.id === "matchmaking") {
        playerState.pmc.updatePlayers();
        playerState.pmc.updateFriendStatus(usr.id, 2);
      }
    });
  }
  job_leave(s) {
    Object.values(s).forEach(async usr => {
      if(playerState.pmc?.id === "bannerdrop") {
        playerState.pmc.latestRun = {id: "job_leave", user: usr};
      } else if(playerState.journey && db.job.status !== 4) {
        if(playerState.pmc?.destroy) await playerState.pmc.destroy();
        playerState.journey.showUnfinished(-1, usr);
      } else if(playerState.pmc?.id === "matchmaking") {
        playerState.pmc.updateFriendStatus(usr.id, -1);
        playerState.pmc.updatePlayers(usr.id);
      } else if(playerState.pmc?.id === "prepare") {
        playerState.pmc.setLeft(usr);
      } else if(db.onduty < 2 || playerState.pmc?.id === "jobs") {
        db.waiting.push({ _n: 1, id: "job_leave", user: usr });
      } else {
        if(playerState.pmc?.destroy) playerState.pmc.destroy();
      }
    });
  }
  job_start(s) {
    db.job = Object.values(s)[0];
    if(playerState.pmc?.id === "matchmaking") {
      playerState.pmc.launch();
    } else {
      db.waiting.push({ _n: 3, id: "job_start" });
    }
  }
  job_kick(s) {
    Object.values(s).forEach(usr => {
      if(usr.id === db.char.id) {
        db.job = {};
        if(playerState.pmc?.id === "matchmaking") {
          notip({
            a: "JOB",
            b: lang.MM_GOT_KICKED,
            c: "4",
            ic: "person-to-door",
          });
          playerState.pmc.resumeMap();
          playerState.pmc.destroy();
        } else {
          db.waiting.push({ _n: 2, id: "job_kick_me" });
        }
        return;
      }
      if(db.job.players[usr.id]) delete db.job.players[usr.id];
      if(playerState.pmc?.id === "matchmaking") {
        playerState.pmc.updatePlayers(usr.id);
        playerState.pmc.updateFriendStatus(usr.id, -1);
      }
    });
  }
  prepare_ready(s) {
    Object.values(s).forEach(usr => {
      if(playerState.pmc?.id === "prepare") {
        playerState.pmc.updatePlayerStatus(usr.id);
      } else {
        db.waiting.push({ _n: 4, id: "prepare_ready", user: usr });
      }
    });
  }
  prepare_launch(s) {
    if(playerState.pmc?.id === "prepare") {
      playerState.pmc.launch();
    }
  }
  donate_settlement(s) {
    if(playerState.pmc?.id === "invoice") {
      playerState.pmc.settlement();
    }
  }
  cloudflags(s) {
    if(!db.job || (db.job.onduty?.length < 1) || db.crew.length < 1) return;
    Object.values(s).forEach(plFlags => {
      plFlags.flags.forEach(k => {
        playerState.storyFlags[k] = true;
        const flag = db.flags?.[k];
        if(flag) {
          kchat.add(plFlags.from, flag[klang.currLang], true);
        }
      });
    });
  }
  delcloudflags(s) {
    if(!db.job || (db.job.onduty?.length < 1) || db.crew.length < 1) return;
    Object.values(s).forEach(plFlags => {
      plFlags.flags.forEach(k => {
        playerState.storyFlags[k] = false;
        delete playerState.storyFlags[k];
      });
    });
  }
  additem(s) {
    if(!db.job || (db.job.onduty?.length < 1) || db.crew.length < 1) return;
    Object.values(s).forEach(data => {
      data.amount = Number(data.amount);
      if(!db.job.bag[data.id]) db.job.bag[data.id] = {id:data.id, amount:0};
      db.job.bag[data.id].amount = db.job.bag[data.id].amount + data.amount;
      const item = cloud_items.find(itm => itm.id === data.id);
      notip({
        a: `+${data.amount} item`,
        b: item.name[klang.currLang],
        ic: "circle-plus"
      });
    })
  }
  missionComplete(s) {
    if(playerState.journey && db.job.status !== 4) {
      playerState.journey.showFinished();
    }
  }
  missionRewards(s) {
    Object.values(s).forEach(data => {
      Object.keys(data?.new_amount || {}).forEach(k => {
        db.char.backpack[k] = data.new_amount[k];
      });
    });
  }
  adminpromote(s) {
    Object.values(s).forEach(k => {
      db.char.admin = k.level;
      modal.alert({msg: `You have been promoted to <b>Admin Level ${k.level}</b><br/>You have unlocked some new features on your Phone Menu`, ic: "user-secret"});
    })
  }
  admindemote() {
    delete db.char.admin;
  }
  async init(s) {
    if(criticals.includes(this.id)) {
      const hasModal = document.querySelector(".modal");
      if(hasModal) {
        const btnCancel = hasModal.querySelector(".btn-cancel");
        const btnOk = hasModal.querySelector(".btn-ok");
        if(btnCancel) {
          btnCancel.click();
          await modal.waittime(850);
        } else if(btnOk) {
          btnOk.click();
          await modal.waittime(850);
        }
      }
    }

    if(!db.unread) db.unread = {};
    if(!db.char) db.char = {};
    if(!db.friends) db.friends = {};
    if(!db.job) db.job = {};
    if(!db.inv_job) db.inv_job = {};
    if(!db.onduty) db.onduty = 1;
    if(!db.waiting) db.waiting = [];
    if(this.id === "id" || !this[this.id]) return;
    this[this.id](s);
  }
}