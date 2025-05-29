const db = require("./db");
const hprof = require("../controllers/profile.controller");
const hjob = require("../controllers/job.controller");
const trophy_list = require("../../../public/json/main/trophies.json");
const missions = require("../../../public/json/main/missions.json");
const tob = require("./tob");
const helper = require("./helper");

const not_found = {key: "no_key", _id: "no_id", result: "no_result"};

const hbMethod = {
  mails(uid, s) {
    const udb = db.ref.u[uid];
    if(!udb) return not_found;
    if(!udb.f) return not_found;
    const mdb = db.fileGet(udb.f, "mails");
    if(!mdb) return not_found;
    const mail_data = mdb[s.id];
    if(!mail_data) return not_found;
    return {key: "mails", _id: s.id, result: mail_data};
  },
  acceptfriend(uid, s) {
    const fdb = db.ref.f[s.friend_id];
    if(!fdb) return not_found;
    if(!fdb.includes(uid) && !fdb.includes(s.id)) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    return {key:"acceptedfriend", _id: s.id, result: user_data};
  },
  addfriend(uid, s) {
    const udb = db.ref.u[uid];
    if(!udb.req || udb.req.length < 1) return not_found;
    const req_exists = udb.req.find(user_id => s.id === user_id);
    if(!req_exists) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    return {key: "requests", _id: s.id, result: user_data};
  },
  cancelrequest(uid, s) {
    const udb = db.ref.u[uid];
    if(udb.req && udb.req.length >= 1) return not_found;
    const req_exists = udb.req.find(user_id => s.id === user_id);
    if(req_exists) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    return {key: "cancelrequest", _id: s.id, result: user_data};
  },
  unfriend(uid, s) {
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    return {key: "unfriend", _id: s.id, result: user_data};
  },
  job_invitation(uid, s) {
    const jdb = db.ref.j;
    if(!jdb[s.job_id]) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    const data = {...jdb[s.job_id]};
    data.inviter = user_data;
    return {key:"job_invite", _id: data.id, result: data};
  },
  job_accept(uid, s) {
    const jdb = db.ref.j;
    if(!jdb[s.job_id]) return not_found;
    if(!jdb[s.job_id].players[uid]) return not_found;
    if(!jdb[s.job_id].players[s.id]) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    user_data.ts = jdb[s.job_id].players[s.id];
    if(!user_data) return not_found;
    return {key:"job_accept", _id: s.id, result: user_data};
  },
  job_leave(uid, s) {
    const jdb = db.ref.j;
    if(!jdb[s.job_id]) return not_found;
    if(!jdb[s.job_id].players[uid]) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    return {key:"job_leave", _id: s.id, result: user_data};
  },
  job_disband(uid, s) {
    const jdb = db.ref.j;
    if(!jdb[s.job_id]) return not_found;
    if(!jdb[s.job_id].players[uid]) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    return {key:"job_disband", _id: s.id, result: user_data};
  },
  job_start(uid, s) {
    const jdb = db.ref.j[s.job_id];
    if(!jdb) return not_found;
    if(!jdb.players[uid]) return not_found;
    const jobData = {...jdb};
    const jobPlayers = {};
    jobData.onduty.forEach(usr => {
      jobPlayers[usr] = usr === uid ? {} : hprof.getUser(uid, usr) || {error:1};
      jobPlayers[usr].ts = jdb.players[usr];
    });
    jobData.players = jobPlayers;
    const containsError = Object.keys(jobPlayers).find(k => jobPlayers[k].error);
    if(containsError) return not_found;
    return {key:"job_start", _id: s.id, result: jobData};
  },
  job_kick(uid, s) {
    const jdb = db.ref.j;
    if(!jdb[s.job_id]) return not_found;
    const user_data = s.user_id === uid ? {id:uid} : hprof.getUser(uid, s.user_id);
    if(!user_data) return not_found;
    return {key:"job_kick", _id: s.id, result: user_data};
  },
  prepare_ready(uid, s) {
    const jdb = db.ref.j[s.job_id];
    if(!jdb) return not_found;
    if(!jdb.players[uid]) return not_found;
    const user_data = hprof.getUser(uid, s.id);
    if(!user_data) return not_found;
    return {key:"prepare_ready", _id: s.id, result: user_data};
  },
  donate_settlement(_, s) {
    return {key: "donate_settlement", _id: s.id, result: {order_id: s.order_id}};
  },
  trophies(uid, s) {
    const tdb = tob[uid]?.data?.[s.id];
    if(!tdb) return not_found;
    return {key:"trophies", _id: s.id, result: tdb};
  },
  cloudflags(uid, s) {
    const jdb = db.ref.j[s.job_id];
    if(!jdb || !jdb.players?.[uid]) return not_found;
    return {key:"cloudflags", _id: `${s.ts}_${s.id}`, result: {flags: s.flags, from:s.id}};
  },
  delcloudflags(uid, s) {
    const jdb = db.ref.j[s.job_id];
    if(!jdb || !jdb.players?.[uid]) return not_found;
    return {key:"delcloudflags", _id: `${s.ts}_${s.id}`, result: {flags: s.flags, from:s.id}};
  },
  additem(uid, s) {
    const jdb = db.ref.j[s.job_id];
    if(!jdb || !jdb.players?.[uid]) return not_found;
    return {key:"additem", _id: `${s.ts}_${s.id}`, result: {id:s.item.id, amount:s.item.amount}};
  },
  missionComplete(uid, s) {
    const jdb = db.ref.j[s.job_id];
    if(!jdb || !jdb.players?.[uid]) return not_found;
    return {key:"missionComplete", _id: `${s.ts}_${s.id}`, result: {}};
  },
  missionRewards(_, s) {
    return {key:"missionRewards", _id: `${s.ts}_${s.id}`, result: {
      new_amount: s.new_amount, isHost: s.isHost
    }};
  },
  adminpromote(_, s) {
    return {key:"adminpromote", _id: s.id, result:{level:s.level}}
  },
  admindemote(_, s) {
    return {key:"admindemote", _id: s.id, result:{}}
  }
}

const ordMethod = {
  tobPayout(uid, isHost, missionId, complete_data) {
    const udb = db.ref.u[uid];
    if(!udb) return;
    const backpack = db.fileGet(udb.f, "backpack") || {};
    const newRewards = [];
    const mission = missions.find(msn => msn.id === missionId);
    if(!mission) return;
    mission.payout.success.forEach(rw => {
      const hasSame = Object.keys(backpack).find(k => backpack[k].id === rw.id) || Date.now().toString(36) + `_${rw.id}`;
      if(!backpack[hasSame]) backpack[hasSame] = {};
      backpack[hasSame].id = rw.id;
      backpack[hasSame].amount = (backpack[hasSame].amount || 0) + rw.amount;
      newRewards.push(hasSame);
    });
    db.fileSet(udb.f, "backpack", backpack);
    const new_amount = {};
    if(isHost) new_amount[complete_data.key] = {id:complete_data.id,amount:complete_data.amount};
    newRewards.forEach(k => {
      new_amount[k] = {};
      new_amount[k].id = backpack[k].id;
      new_amount[k].amount = backpack[k].amount;
      if(backpack[k].expiry) new_amount[k].expiry = backpack[k].expiry;
    });
    if(!udb.zzz) db.ref.u[uid].zzz = [];
    db.ref.u[uid].zzz.push({
      type: "missionRewards", id: uid, new_amount, isHost, ts: Date.now().toString(36)
    });
    const checkTrophy = isHost ? "firsthost" : "firstcrew";
    if(!tob[uid] || !tob[uid].data) return hjob.jobRewardOffline(uid, checkTrophy);
    if(!tob[uid].data[checkTrophy]) tob[uid].data[checkTrophy] = {r:0,a:0};
    if(tob[uid].data[checkTrophy].done) return;
    if(!udb.t) db.ref.u[uid].t = [];
    if(udb.t.includes(checkTrophy)) return;
    tob[uid].data[checkTrophy].r++;
    helper.trophyParse(uid, checkTrophy, udb.f);
  },
  tobDoneAsCrew(uid) {
    const mydb = db.ref.u[uid];
    if(!tob[uid].data["firstcrew"]) tob[uid].data["firstcrew"] = {r:0,a:0};
    if(tob[uid].data["firstcrew"].done) return;
    if(!mydb.t) db.ref.u[uid].t = [];
    if(mydb.t.includes("firstcrew")) return;
    tob[uid].data["firstcrew"].r++;
    helper.trophyParse(uid, "firstcrew", mydb.f);
  },
  tobDoneAsHost(uid) {
    const mydb = db.ref.u[uid];
    if(!tob[uid].data["firsthost"]) tob[uid].data["firsthost"] = {r:0,a:0};
    if(tob[uid].data["firsthost"].done) return;
    if(!mydb.t) db.ref.u[uid].t = [];
    if(mydb.t.includes("firsthost")) return;
    tob[uid].data["firsthost"].r++;
    helper.trophyParse(uid, "firsthost", mydb.f);
  },
  exitfromjob(uid) {
    hjob.exitFromJob(uid);
    return null;
  },
  prepare_ready(uid, s) {
    hjob.prepareReady(uid, s);
    return null;
  },
  job_type_invite(uid, s) {
    hjob.changeInviteType(uid, s);
    return null;
  },
  prepare_launch(uid, s) {
    const nextStep = hjob.prepareLaunch(uid, s);
    if(!nextStep) return null;
    return { "prepare_launch": {key: "prepare_launch", job_id: s.job_id} };
  },
  use_phone(uid, s) {
    const tdb = tob[uid].data["firstphone"];
    if(!tdb) tob[uid].data["firstphone"] = {r:0,a:0};
    if(tob[uid].data["firstphone"].done) return null;
    const udb = db.ref.u[uid];
    if(!udb.t) db.ref.u[uid].t = [];
    if(udb.t.includes("firstphone")) return null;
    tob[uid].data["firstphone"].r++;
    helper.trophyParse(uid, "firstphone", udb.f);
    return null;
  },
  walk(uid, s) {
    const tdb = tob[uid].data["steptaken1"];
    if(!tdb) tob[uid].data["steptaken1"] = {r:0,a:0,};
    if(tob[uid].data["steptaken1"].done) return null;
    const udb = db.ref.u[uid];
    if(!udb.t) db.ref.u[uid].t = [];
    if(udb.t.includes("steptaken1")) return null;
    tob[uid].data["steptaken1"].r++;
    const item = trophy_list["steptaken1"];
    if(tob[uid].data["steptaken1"].r >= item.r) helper.trophyParse(uid, "steptaken1", udb.f);
    return null;
  },
  playtime(uid) {
    const udb = db.ref.u[uid];
    if(tob[uid].data["playtime"].done) return null;
    if(!udb.t) db.ref.u[uid].t = [];
    if(udb.t.includes("playtime")) return null;
    const timeAdded = db.ref.u[uid].ls ? (Date.now() - db.ref.u[uid].ls) : 0;
    db.ref.u[uid].ls = Date.now();
    tob[uid].data["playtime"].r = tob[uid].data["playtime"].r + timeAdded;
    const item = trophy_list["playtime"];
    if(tob[uid].data["playtime"].r >= item.r) {
      tob[uid].data["playtime"].r = item.r;
      helper.trophyParse(uid, "playtime", udb.f);
    }
    return null;
  },
  item_expired(uid, s) {
    const udb = db.ref.u[uid];
    const fdb = db.fileGet(udb.f, "backpack");
    if(!fdb[s.item_n]) return;
    if(!fdb[s.item_n].expiry >= Date.now()) return;
    delete fdb[s.item_n];
    db.fileSet(udb.f, "backpack", fdb);

    if(!tob[uid].data["itemexpired"]) tob[uid].data["itemexpired"] = {r:0,a:0};
    if(tob[uid].data["itemexpired"].done) return;
    if(!udb.t) db.ref.u[uid].t = [];
    if(udb.t.includes("itemexpired")) return;
    tob[uid].data["itemexpired"].r++;
    helper.trophyParse(uid, "itemexpired", udb.f);
  },
  missionComplete(uid, s) {
    const jobKey = Object.keys(db.ref.j).filter(k => db.ref.j[k].players[uid]);
    if(!jobKey) return null;
    const jdb = db.ref.j[jobKey];
    const isCompleted = hjob.jobCompleted(jdb.host, jdb);
    if(!isCompleted || !isCompleted.ok) return null;
    const players = Object.keys(jdb.players);
    players.filter(k => k !== uid).forEach(k => {
      const udb = db.ref.u[k];
      if(udb) {
        if(!udb.zzz) db.ref.u[k].zzz = [];
        db.ref.u[k].zzz.push({
          type: "missionComplete", id: uid, job_id: jobKey, ts: Date.now().toString(36)
        });
        setTimeout(() => this.tobPayout(k, (jdb.host === k), jdb.mission, isCompleted.data.new_amount), 25000);
      }
    });
    setTimeout(() => this.tobPayout(uid, (jdb.host === uid), jdb.mission, isCompleted.data.new_amount), 25000);
    setTimeout(() => {delete db.ref.j[jobKey]}, 5000);
    return null;
  },
  mpGetFlags(uid, s) {
    if(!Array.isArray(s.flags)) return null;
    const jobKey = Object.keys(db.ref.j).filter(k => db.ref.j[k].players[uid]);
    if(!jobKey) return null;
    if(!s.flags) return null;
    s.flags.forEach(flg => {db.ref.j[jobKey].flags[flg] = true});
    const jdb = db.ref.j[jobKey];
    const players = Object.keys(jdb.players);
    players.filter(k => k !== uid).forEach(k => {
      const udb = db.ref.u[k];
      if(udb) {
        if(!udb.zzz) db.ref.u[k].zzz = [];
        db.ref.u[k].zzz.push({
          type: "cloudflags", id: uid, flags: s.flags, job_id: jobKey, ts: Date.now().toString(36)
        });
      }
    });
    return null;
  },
  mpDelFlags(uid, s) {
    if(!Array.isArray(s.flags)) return null;
    const jobKey = Object.keys(db.ref.j).filter(k => db.ref.j[k].players[uid]);
    if(!jobKey) return null;
    if(!s.flags) return null;
    s.flags.forEach(flg => {
      db.ref.j[jobKey].flags[flg] = false;
      delete db.ref.j[jobKey].flags[flg];
    });
    const jdb = db.ref.j[jobKey];
    const players = Object.keys(jdb.players);
    players.filter(k => k !== uid).forEach(k => {
      const udb = db.ref.u[k];
      if(udb) {
        if(!udb.zzz) db.ref.u[k].zzz = [];
        db.ref.u[k].zzz.push({
          type: "delcloudflags", id: uid, flags: s.flags, job_id: jobKey, ts: Date.now().toString(36)
        });
      }
    });
    return null;
  },
  additem(uid, s) {
    if(!s.id || !s.amount) return null;
    if(typeof s.amount !== "number" && typeof s.amount !== "string") return null;
    s.amount = Number(s.amount);
    const jobKey = Object.keys(db.ref.j).filter(k => db.ref.j[k].players[uid]);
    if(!jobKey) return null;
    const jdb = db.ref.j[jobKey];
    if(!jdb.bag[s.id]) db.ref.j[jobKey].bag[s.id] = {id:s.id, amount:0};
    db.ref.j[jobKey].bag[s.id].amount = db.ref.j[jobKey].bag[s.id].amount + s.amount;
    const players = Object.keys(jdb.players);
    players.filter(k => k !== uid).forEach(k => {
      const udb = db.ref.u[k];
      if(udb) {
        if(!udb.zzz) db.ref.u[k].zzz = [];
        db.ref.u[k].zzz.push({
          type: "additem", id: uid, item: {id:s.id, amount:s.amount}, job_id: jobKey, ts: Date.now().toString(36)
        });
      }
    });
    return null;
  }
}

const socketCloud = {
  heartBeat(uid) {
    const udb = db.ref.u[uid];
    ordMethod.playtime(uid);
    if(udb.b) return 403423;
    if(!udb.zzz || udb.zzz.length < 1) return null;
    const data = {};
    udb.zzz.filter(zzz => {
      return hbMethod[zzz.type];
    }).forEach(zzz => {
      const passedData = hbMethod[zzz.type](uid, zzz);
      if(!data[passedData.key]) data[passedData.key] = {};
      if(!data[passedData.key][passedData._id]) data[passedData.key][passedData._id] = {};
      data[passedData.key][passedData._id] = passedData.result;
    });
    delete db.ref.u[uid].zzz;
    return data;
  },
  run(uid, s) {
    const udb = db.ref.u[uid];
    if(!udb || !udb.f) return;
    if(!s.id) return null;
    return ordMethod[s.id](uid, s.data || null);
  }
}

module.exports = socketCloud;