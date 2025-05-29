const db = require("../main/db");
const cloud_items = require("../../../public/json/items/cloud_items.json");
const mission_list = require("../../../public/json/main/missions.json");
const trophy_list = require("../../../public/json/main/trophies.json");
const hprof = require("./profile.controller");
const { validate, rNumber, trophyParse } = require("../main/helper");
const tob = require("../main/tob");

function generateJobCode(existingCode) {
  let newCode = rNumber(6);
  while (existingCode.includes(newCode)) {
      newCode = rNumber(6);
  }
  return newCode;
}

module.exports = {
  createJob(uid, s) {
    const idNotFound = {
      id: "ID Misi tidak dapat ditemukan, silakan coba lagi",
      en: "Couldnot find Mission ID, please try again",
    }
    const USER_NOT_FOUND = {
      id: "User tidak ditemukan",
      en: "User not found",
    }
    const NOT_ENOUGHT_TICKET = {
      id: "Kamu tidak memiliki \"{PRICE_REQ}\" yang cukup",
      en: "You dont have enough \"{PRICE_REQ}\""
    }
    if(!validate(["mission_id"], s)) return {code:400, msg:idNotFound};

    const udb = db.ref.u[uid];
    if(!udb.uname) return {code:400, msg: USER_NOT_FOUND};

    const mission = mission_list.find(k => k.id === s.mission_id);
    if(!mission) return {code:400, msg:idNotFound};

    this.exitFromJob(uid);

    const price = cloud_items.find(k => k.id === mission.price[0]);

    const backpack = db.fileGet(udb.f, "backpack") || {};
    const job_tickets = Object.keys(backpack).filter(k => backpack[k].id === price.id && backpack[k].amount >= mission.price[1] && (!backpack[k].expiry || Date.now() < backpack[k].expiry));
    const job_ticket = job_tickets.find(k => backpack[k].amount >= 1);
    if(!job_ticket || (backpack[job_ticket]?.amount || 0) < 1) return {code:404, msg: NOT_ENOUGHT_TICKET};

    const jobData = {
      host: uid,
      status: 1,
      mission: s.mission_id,
      ivt: 1,
      flags: {},
      bag: {},
      onduty: [],
      players: {
        [uid]: Date.now()
      }
    }
    if(mission.bag) mission.bag.forEach(itm => {jobData.bag[itm.id] = itm});
    const jdb = db.ref.j;
    const otherCodes = Object.keys(jdb).map(k => jdb[k].code);
    jobData.code = generateJobCode(otherCodes);

    const newJobID = "j" + Date.now().toString(36);
    db.ref.j[newJobID] = jobData;
    jobData.id = newJobID;
    return {code:200, data:jobData};
  },
  exitFromJob(uid) {
    const jdb = db.ref.j;

    const otherKeys = Object.keys(jdb).filter(k => jdb[k].players && jdb[k].players[uid]);
    otherKeys.forEach(k => {
      if(!jdb[k].left) db.ref.j[k].left = uid;
      const cjdb = db.ref.j[k];
      if(cjdb.status >= 4) this.jobCompleted(uid, cjdb);
      if(cjdb.status > 1 && cjdb.status < 4) this.jobFailed(uid, cjdb);
      Object.keys(cjdb.players).filter(usr => usr !== uid).forEach(usr => {
        const udb = db.ref.u[usr];
        if(!udb.zzz) db.ref.u[usr].zzz = [];
        db.ref.u[usr].zzz.push({
          "type": "job_leave",
          "id": uid,
          "job_id": k
        });
      });
      if((Object.keys(cjdb.players).length <= 1) || (cjdb.status > 1) || (cjdb.host === uid)) {
        setTimeout(() => {
          delete db.ref.j[k];
        }, 7000);
      }
      delete db.ref.j[k].players[uid];
    });
    return true;
  },
  sendInvite(uid, s) {
    if(!validate(["id", "job_id"], s)) return {code:400, msg:"USER_NOT_FOUND"};

    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:"USER_NOT_FOUND"};
    if(!mdb.peer) return {code:400, msg:"USER_OFFLINE"};

    const jdb = db.ref.j[s.job_id];
    if(!jdb) return {code:404, msg:"MM_JOB_INVALID"};

    if(jdb.host !== uid && jdb.ivt >= 3) return {code:404, msg:"MM_NOTIP_HOST_INV",data:{invite_type:3}};

    const udb = db.ref.u[s.id] || {};
    if(!udb.uname) return {code:400, msg:"USER_NOT_FOUND"};
    if(!udb.peer) return {code:400, msg:"USER_OFFLINE"};

    if(!udb.zzz) db.ref.u[s.id].zzz = [];
    db.ref.u[s.id].zzz.push({
      "type": "job_invitation",
      "id": uid,
      "job_id": s.job_id
    });

    return {code:200, data:{ status: 1, peers: [udb.peer] }};
  },
  acceptInvite(uid, s) {
    const idNotFound = {
      id: "ID Job tidak dapat ditemukan atau telah dibubarkan",
      en: "Couldnot find Job ID or has been disbanded",
    }
    const jobOnGoing = {
      id: "Job ini telah berlangsung",
      en: "This job has already been started",
    }
    const maxedPlayer = {
      id: "Tim telah melebihi batas player",
      en: "Team members are full",
    }
    const USER_NOT_FOUND = {
      id: "User not found",
      en: "User tidak ditemukan",
    }
    if(!validate(["job_id"], s)) return {code:404, msg:idNotFound};
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};

    const jdb = db.ref.j;

    if(!jdb[s.job_id]) return {code:404, msg:idNotFound};
    const mission = mission_list.find(k => k.id === jdb[s.job_id].mission);
    if(!mission) return {code:400};
    if(jdb[s.job_id].status > 1) return {code:400, msg:jobOnGoing};

    const totalPlayers = Object.keys(jdb[s.job_id].players);
    if(totalPlayers.length < 1) return {code:400, msg:idNotFound};
    if(totalPlayers.length >= mission.max) return {code:400, msg:maxedPlayer};

    db.ref.j[s.job_id].players[uid] = Date.now();

    const jobPlayers = {...jdb[s.job_id].players};
    totalPlayers.forEach(usr => {
      jobPlayers[usr] = hprof.getUser(uid, usr) || {};
      jobPlayers[usr].ts = jdb[s.job_id].players[usr];
    });
    const jobData = {...db.ref.j[s.job_id]};
    jobData.players = jobPlayers;

    totalPlayers.filter(k => k !== uid).forEach(k => {
      const udb = db.ref.u[k];
      if(!udb.zzz) db.ref.u[k].zzz = [];
      db.ref.u[k].zzz.push({
        "type": "job_accept",
        "id": uid,
        "job_id": s.job_id
      });
    });
    const peers = Object.values(jobPlayers).filter(usr => usr.id && usr.id !== uid && usr.peer).map(usr => usr.peer);

    return {code:200, data:{job:jobData, peers}}
  },
  findJobCode(uid, job_id) {
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:"USER_NOT_FOUND"};
    if(!mdb.peer) return {code:400, msg:"USER_NOT_FOUND"};

    job_id = Number(job_id);
    const jdb = db.ref.j;
    const jobkey = Object.keys(jdb).find(k => jdb[k].ivt === 1 && jdb[k].code === job_id);
    if(!jobkey) return {code:404,msg:"job_not_found"};

    const mission = mission_list.find(k => k.id === jdb[jobkey].mission);
    if(!mission) return {code:400};

    const jobData = {...jdb[jobkey]};
    if(Object.keys(jobData.players).length < 1) return {code:404,msg:"job_disbanded"};
    const user_data = hprof.getUser(uid, jobData.host);
    delete jobData.id;
    if(!user_data) return {code:404,msg:"job_host_invalid"};
    jobData.inviter = user_data;
    return {code:200, msg:"ok", data: {job:jobData}};
  },
  joinCode(uid, s) {
    const idNotFound = {
      id: "Kode Tim tidak dapat ditemukan atau telah dibubarkan",
      en: "Couldnot find Team Code or has been disbanded",
    }
    const USER_NOT_FOUND = {
      id: "User not found",
      en: "User tidak ditemukan",
    }
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};

    if(!s.job_code) return {code:400, msg:idNotFound};
    s.job_code = Number(s.job_code);

    const jdb = db.ref.j;
    const jobkey = Object.keys(jdb).find(k => jdb[k].ivt === 1 && jdb[k].code === s.job_code);
    if(!jobkey) return {code:404,msg:"TM_NOT_PUBLIC_ANYMORE"};
    return this.acceptInvite(uid, {job_id: jobkey});
  },
  playerKick(uid, s) {
    if(!validate(["user_id", "job_id"], s)) return {code:400,msg:"MM_JOB_INVALID"};

    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:"USER_NOT_FOUND"};
    if(!mdb.peer) return {code:400, msg:"USER_NOT_FOUND"};

    const jdb = db.ref.j[s.job_id];
    if(!jdb) return {code:400,msg:"MM_JOB_INVALID"};

    if(jdb.host !== uid) return {code:400,msg:"MM_KICK_NOT_HOST"};
    if(!jdb.players[s.user_id]) return {code:400,msg:"USER_NOT_FOUND"};

    if(s.user_id === uid) return {code:400,msg:"USER_NOT_FOUND"};
    const user_data = hprof.getUser(uid, s.user_id);
    if(!user_data) return {code:400,msg:"USER_NOT_FOUND"};
    const totalPlayers = Object.keys(jdb.players);
    const peers = [];
    totalPlayers.filter(k => k !== uid).forEach(k => {
      const udb = db.ref.u[k];
      if(udb.peer) peers.push(udb.peer);
      if(!udb.zzz) db.ref.u[k].zzz = [];
      db.ref.u[k].zzz.push({
        "type": "job_kick",
        "id": uid,
        "user_id": s.user_id,
        "job_id": s.job_id
      });
    });
    delete db.ref.j[s.job_id].players[s.user_id];

    return {code:200, msg:"ok",data:{user:user_data, peers}};
  },
  launchJob(uid, s) {
    const maxedPlayer = {
      id: "Tim telah melebihi batas player",
      en: "The number of team members exceeds the maximum requirement",
    }
    const minedPlayer = {
      id: "Anggota tim kurang dari jumlah minimal",
      en: "The number of team members is less than the minimum requirement",
    }
    const USER_NOT_FOUND = {
      id: "User not found",
      en: "User tidak ditemukan",
    }
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};

    if(!validate(["job_id"], s)) return {code:400};
    const jdb = db.ref.j[s.job_id];
    if(!jdb) return {code:400};
    if(jdb.host !== uid) return {code:400};
    const mission = mission_list.find(k => k.id === jdb.mission);
    if(!mission) return {code:400};
    const totalPlayers = Object.keys(jdb.players);
    if(totalPlayers.length > mission.max) return {code:400, msg:maxedPlayer};
    if(totalPlayers.length < mission.min) return {code:400, msg:minedPlayer};
    db.ref.j[s.job_id].status = 2;
    db.ref.j[s.job_id].prepare = Date.now() + (1000 * 93);
    db.ref.j[s.job_id].onduty = totalPlayers;

    const jobPlayers = {...jdb.players};
    totalPlayers.forEach(usr => {
      jobPlayers[usr] = hprof.getUser(uid, usr) || {};
      jobPlayers[usr].ts = jdb.players[usr];
    });
    const jobData = {...db.ref.j[s.job_id]};
    jobData.players = jobPlayers;

    totalPlayers.filter(k => k !== uid).forEach(k => {
      const udb = db.ref.u[k];
      if(!udb.zzz) db.ref.u[k].zzz = [];
      db.ref.u[k].zzz.push({
        "type": "job_start",
        "id": uid,
        "job_id": s.job_id
      });
    });
    const peers = Object.values(jobPlayers).filter(usr => usr.id && usr.id !== uid && usr.peer).map(usr => usr.peer);

    return {code:200, data:{job:jobData, peers}};
  },
  changeInviteType(uid, s) {
    // from xcloud
    if(!validate({job_id:"string",invite_type:"number"}, s)) return;
    const jdb = db.ref.j[s.job_id];
    if(!jdb) return;
    if(jdb.host !== uid) return;
    if(s.invite_type < 1 || s.invite_type > 3) return;
    db.ref.j[s.job_id].ivt = s.invite_type;
  },
  prepareReady(uid, s) {
    // from xcloud
    const jdb = db.ref.j[s.job_id];
    if(!jdb) return;
    if(!jdb.players[uid]) return;
    jdb.onduty.filter(usr => usr !== uid).forEach(usr => {
      const udb = db.ref.u[usr];
      if(!udb.zzz) db.ref.u[usr].zzz = [];
      db.ref.u[usr].zzz.push({
        "type": "prepare_ready",
        "id": uid,
        "job_id": s.job_id
      });
    });
  },
  prepareLaunch(uid, s) {
    // from xcloud
    const jdb = db.ref.j[s.job_id];
    if(!jdb) return false;
    if(Date.now() < jdb.prepare) return false;
    if(jdb.status < 2) return false;
    return true;
  },
  jobFailed(uid, s) {
    if(s.left !== uid) return;
    const udb = db.ref.u[uid];
    if(!tob[uid].data["onjobleft"]) tob[uid].data["onjobleft"] = {r:0,a:0};
    if(tob[uid].data["onjobleft"].done) return;
    if(!udb.t) db.ref.u[uid].t = [];
    if(udb.t.includes("onjobleft")) return;
    tob[uid].data["onjobleft"].r++;
    trophyParse(uid, "onjobleft", udb.f);
  },
  jobCompleted(uid, jdb) {
    const USER_NOT_FOUND = {
      id: "User tidak ditemukan",
      en: "User not found",
    }
    const idNotFound = {
      id: "ID Misi tidak dapat ditemukan, silakan coba lagi",
      en: "Couldnot find Mission ID, please try again",
    }
    const NOT_ENOUGHT_TICKET = {
      id: "Kamu tidak memiliki \"{PRICE_REQ}\" yang cukup",
      en: "You dont have enough \"{PRICE_REQ}\""
    }
    const udb = db.ref.u[uid];
    if(!udb.uname) return {ok:false, code:400, msg: USER_NOT_FOUND};

    const mission = mission_list.find(k => k.id === jdb.mission);
    if(!mission) return {ok: false, code:400, msg:idNotFound};

    const price = cloud_items.find(k => k.id === mission.price[0]);

    const backpack = db.fileGet(udb.f, "backpack") || {};
    const job_tickets = Object.keys(backpack).filter(k => backpack[k].id === price.id  && backpack[k].amount >= mission.price[1] && (!backpack[k].expiry || Date.now() < backpack[k].expiry));
    const job_ticket = job_tickets.find(k => backpack[k].amount >= 1);
    if(!job_ticket || (backpack[job_ticket]?.amount || 0) < 1) return {ok:false, code:404, msg: NOT_ENOUGHT_TICKET};
    backpack[job_ticket].amount = backpack[job_ticket].amount - 1;

    db.fileSet(udb.f, "backpack", backpack);
    return {ok:true, code:200, data: {new_amount: {key: job_ticket, id: backpack[job_ticket].id, amount: backpack[job_ticket].amount}}};
  },
  jobRewardOffline(uid, trophy_id) {
    const udb = db.ref.u[uid];
    if(!udb || !udb.f) return;
    const trophies = db.fileGet(udb.f, "trophies") || {};
    if(!trophies[trophy_id]) trophies[trophy_id] = {r:0,a:0};
    if(trophies[trophy_id].done) return;
    if(!udb.t) db.ref.u[uid].t = [];
    if(udb.t.includes(trophy_id)) return;
    trophies[trophy_id].r++;
    const item = trophy_list[trophy_id];
    trophies[trophy_id].a = Math.floor((trophies[trophy_id].r / item.r) * item.a);
    trophies[trophy_id].done = true;
    trophies[trophy_id].ts = Date.now();
    db.ref.u[uid].t.push(trophy_id);
    if(trophies[trophy_id].tmp) delete trophies[trophy_id].tmp;
    db.fileSet(udb.f, "trophies", trophies);
  }
}