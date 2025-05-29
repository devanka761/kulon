const db = require("../main/db");
const { validate, trophyParse } = require("../main/helper");
const trophy_list = require("../../../public/json/main/trophies.json");
const tob = require("../main/tob");

module.exports = {
  getUser(uid, userid) {
    if(userid === uid) return null;
    const udb = db.ref.u[userid];
    if(!udb) return null;
    if(!udb.uname || !udb.skin) return;
    const data = {};
    data.id = userid;
    data.username = udb.uname;
    data.joined = udb.j;
    data.trophies = udb.t || [];
    const currSkin = {...udb.skin};
    if(udb.skin.Hairstyles && udb.skin.Hats) {
      currSkin.Hairstyles = "Hairstyle_01_" + udb.skin.Hairstyles.substring((udb.skin.Hairstyles.length - 2), (udb.skin.Hairstyles.length));
    }
    data.skin = Object.values(currSkin);
    if(udb.peer) data.peer = udb.peer;
    if(udb.req && udb.req.includes(uid)) data.myReq = true;
    const mdb = db.ref.u[uid];
    if(mdb.req && mdb.req.includes(userid)) data.theirReq = true;
    const isFriend = Object.keys(db.ref.f).find(k => {
      return db.ref.f[k].includes(uid) && db.ref.f[k].includes(userid);
    });
    if(isFriend) data.isFriend = true;

    return data;
  },
  find(uid, userid, isMany) {
    if(userid.length < 4) return {code:400,msg:"FR_MIN"};
    if(userid.length > 40) return {code:400,msg:"FR_MAX"};
    if(uid === userid) return {code:404,msg:"USER_NOT_FOUND"};

    if(isNaN(Number(isMany)) || Number(isMany) < 1) {
      const user = this.getUser(uid, userid);
      if(!user) return {code:404,msg:"USER_NOT_FOUND"};
      return {code:200, data:{users:[user]}};
    }

    const udbs = db.ref.u;
    const users = Object.keys(udbs).filter(k => {
      return ((k !== uid) && udbs[k].uname && (k === userid || udbs[k].uname.toLowerCase().includes(userid.toLowerCase())));
    }).slice(0, 20).map(k => {
      return this.getUser(uid, k);
    });
    if(users.length < 1) return {code:404,msg:"USER_NOT_FOUND"};
    return {code:200, data: { users }};
  },
  addfriend(uid, s) {
    if(!validate(['id'], s)) return {code:400};
    if(s.id === uid) return {code:400};
    const udb = db.ref.u[s.id];
    if(!udb) return {code:400};
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};

    const isFriend = Object.keys(db.ref.f).find(k => {
      return db.ref.f[k].includes(uid) && db.ref.f[k].includes(s.id);
    });
    if(isFriend) return {code:200, data:{user:this.getUser(uid,s.id)}};

    if(mdb.req?.includes(s.id)) return this.acceptfriend(uid, s);
    if(udb?.req?.includes(uid)) return {code:200, data: {user:this.getUser(uid,s.id)}};

    if(!udb.req) db.ref.u[s.id].req = [];
    db.ref.u[s.id].req.push(uid);
    if(!udb.zzz) db.ref.u[s.id].zzz = [];
    db.ref.u[s.id].zzz.push({
      "type": "addfriend",
      "id": uid
    });
    db.save('u');
    const dataToSend = {code:200, data:{user:this.getUser(uid,s.id)}};
    if(!tob[uid].data["friendreqs"]) tob[uid].data["friendreqs"] = {};
    if(tob[uid].data["friendreqs"].done) return dataToSend;
    if(!mdb.t) db.ref.u[uid].t = [];
    if(mdb.t.includes("friendreqs")) return dataToSend;
    if(!tob[uid].data["friendreqs"].tmp) tob[uid].data["friendreqs"].tmp = [];
    if(!tob[uid].data["friendreqs"].tmp.includes(s.id)) tob[uid].data["friendreqs"].tmp.push(s.id);
    tob[uid].data["friendreqs"].r = tob[uid].data["friendreqs"].tmp.length;
    const item = trophy_list["friendreqs"];
    if(tob[uid].data["friendreqs"].r >= item.r) {
      tob[uid].data["friendreqs"].r = item.r;
      trophyParse(uid, "friendreqs", mdb.f, item.r);
    }
    return dataToSend;
  },
  unfriend(uid, s) {
    if(!validate(['id'], s)) return {code:400};
    if(s.id === uid) return {code:400};
    const udb = db.ref.u[s.id];
    if(!udb) return {code:400};
    if(udb.req?.includes(uid)) db.ref.u[s.id].req = udb.req.filter(key => key !== uid);
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};
    if(mdb.req?.includes(s.id)) db.ref.u[uid].req = mdb.req.filter(key => key !== s.id);

    const friendkey = Object.keys(db.ref.f).find(k => {
      return db.ref.f[k].includes(uid) && db.ref.f[k].includes(s.id);
    });
    if(friendkey) delete db.ref.f[friendkey];

    if(!udb.zzz) db.ref.u[s.id].zzz = [];
    db.ref.u[s.id].zzz.push({
      "type": "unfriend",
      "id": uid
    });

    db.save('u', 'f');
    return {code:200, data:{user:this.getUser(uid,s.id)}};
  },
  acceptfriend(uid, s) {
    if(!validate(['id'], s)) return {code:400};
    if(s.id === uid) return {code:400};

    const udb = db.ref.u[s.id];
    if(!udb) return {code:400};

    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};

    const friendkey = Object.keys(db.ref.f).find(k => {
      return db.ref.f[k].includes(uid) && db.ref.f[k].includes(s.id);
    });
    if(friendkey) return {code:200, data:{user:this.getUser(uid,s.id)}};

    if(udb.req?.includes(uid)) db.ref.u[s.id].req = udb.req.filter(key => key !== uid);

    if(!mdb.req || !mdb.req.includes(s.id)) return {code:400, data:{user:this.getUser(uid,s.id)}};

    const new_friendkey = 'm' + Date.now().toString(36);
    db.ref.f[new_friendkey] = [s.id, uid];

    if(!udb.zzz) db.ref.u[s.id].zzz = [];
    db.ref.u[s.id].zzz.push({
      "type": "acceptfriend",
      "id": uid,
      "friend_id": new_friendkey
    });
    db.ref.u[uid].req = mdb.req.filter(key => key !== s.id);
    db.save('u', 'f');

    const dataToSend = {code:200, data:{user:this.getUser(uid,s.id), pass: "acceptfriend"}};
    if(!tob[uid].data["friendaccs"]) tob[uid].data["friendaccs"] = {};
    if(tob[uid].data["friendaccs"]?.done) return dataToSend;
    if(!mdb.t) db.ref.u[uid].t = [];
    if(mdb.t.includes("friendaccs")) return dataToSend;
    if(!tob[uid].data["friendaccs"].tmp) tob[uid].data["friendaccs"].tmp = [];
    if(!tob[uid].data["friendaccs"].tmp.includes(s.id)) tob[uid].data["friendaccs"].tmp.push(s.id);
    tob[uid].data["friendaccs"].r = tob[uid].data["friendaccs"].tmp.length;
    const item = trophy_list["friendaccs"];
    if(tob[uid].data["friendaccs"].r >= item.r) {
      tob[uid].data["friendaccs"].r = item.r;
      trophyParse(uid, "friendaccs", mdb.f, item.r);
    }
    return dataToSend;
  },
  ignorefriend(uid, s) {
    if(!validate(['id'], s)) return {code:400};
    if(s.id === uid) return {code:400};
    const udb = db.ref.u[s.id];
    if(!udb) return {code:400};
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};
    if(udb.req?.includes(uid)) db.ref.u[s.id].req = udb.req.filter(key => key !== uid);
    if(mdb.req?.includes(s.id)) db.ref.u[uid].req = mdb.req.filter(key => key !== s.id);

    db.save('u');
    return {code:200, data:{user:this.getUser(uid,s.id)}};
  },
  cancelfriend(uid, s) {
    if(!validate(['id'], s)) return {code:400};
    if(s.id === uid) return {code:400};
    const udb = db.ref.u[s.id];
    if(!udb) return {code:400};
    if(!udb.req || !udb.req.includes(uid)) return {code:200, data:{user:this.getUser(uid,s.id)}};
    const mdb = db.ref.u[uid];
    if(!mdb.uname) return {code:400, msg:USER_NOT_FOUND};
    if(!mdb.peer) return {code:400, msg:USER_NOT_FOUND};
    db.ref.u[s.id].req = udb.req.filter(key => key !== uid);

    if(!udb.zzz) db.ref.u[s.id].zzz = [];
    db.ref.u[s.id].zzz.push({
      "type": "cancelrequest",
      "id": uid
    });

    db.save('u');
    const dataToSend = {code:200, data:{user:this.getUser(uid,s.id)}};
    if(!tob[uid].data["friendreqs"]) tob[uid].data["friendreqs"] = {};
    if(tob[uid].data["friendreqs"]?.done) return dataToSend;
    if(!mdb.t) db.ref.u[uid].t = [];
    if(mdb.t.includes("friendreqs")) return dataToSend;
    if(!tob[uid].data["friendreqs"].tmp) tob[uid].data["friendreqs"].tmp = [];
    if(tob[uid].data["friendreqs"].tmp.includes(s.id)) {
      tob[uid].data["friendreqs"].tmp = tob[uid].data["friendreqs"].tmp.filter(usrkey => usrkey !== s.id);
    }
    tob[uid].data["friendreqs"].r = tob[uid].data["friendreqs"].tmp.length;
    return dataToSend;
  }
}