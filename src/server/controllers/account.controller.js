const db = require("../main/db");
const { validate, genHex, peerKey, isProd, trophyParse } = require("../main/helper");
const hprof = require("./profile.controller");
const hjob = require("./job.controller");
const skinlist = require("../../../public/json/skins/skin_list.json").map(sk => sk.id);
const shop_items = require("../../../public/json/items/shop_items.json");
const cloud_items = require("../../../public/json/items/cloud_items.json");
const trophy_list = require("../../../public/json/main/trophies.json");
const webhook = require("../main/webhook");
const tob = require("../main/tob");

const isUsername = /^[A-Za-z0-9_]+$/;

module.exports = {
  getSkin(uid) {
    const udb = db.ref.u[uid];
    if(!udb.skin || !udb.uname) return {code:4041, msg:"NO_SKIN"};
    if(Object.keys(udb.skin).length < 1) return {code:4041, msg:"NO_SKIN"};
    const data = this.getChar(uid);
    const peerConf = this.initPeer(uid);
    tob[uid] = {key:udb.f,data:db.fileGet(udb.f, "trophies") || {}};
    if(!tob[uid].data["playtime"]) tob[uid].data["playtime"] = {r:0,a:0};
    db.ref.u[uid].v = db.ref.v.version;
    db.ref.u[uid].ls = Date.now();
    return {code: 200, data: {...data, peer: peerConf, version: db.ref.v.version}};
  },
  getChar(uid) {
    const udb = db.ref.u[uid];
    if(udb.zzz) delete db.ref.u[uid].zzz;
    const data = {};
    data.char = {};
    data.char.id = uid;
    if(udb.a) data.char.admin = udb.a;
    data.char.skinList = udb.skin;
    const currSkin = {...udb.skin};
    if(udb.skin.Hairstyles && udb.skin.Hats) {
      currSkin.Hairstyles = "Hairstyle_01_" + udb.skin.Hairstyles.substring((udb.skin.Hairstyles.length - 2), (udb.skin.Hairstyles.length));
    }
    data.char.skin = Object.values(currSkin);
    data.char.username = udb.uname;
    data.char.joined = udb.j;
    data.char.mails = db.fileGet(udb.f, "mails") || {};
    data.char.trophies = db.fileGet(udb.f, "trophies") || {};
    data.char.mails = db.fileGet(udb.f, "mails") || {};
    data.char.backpack = db.fileGet(udb.f, "backpack") || {};

    if(udb.req && udb.req.length >= 1) {
      data.char.requests = {};
      udb.req.forEach(k => {
        data.char.requests[k] = hprof.getUser(uid, k);
      })
    }
    data.friends = this.getFriends(uid);
    hjob.exitFromJob(uid);
    return data;
  },
  getFriends(uid) {
    const friend_list = {};
    const fdb = Object.keys(db.ref.f).filter(k => db.ref.f[k].includes(uid));
    if(fdb.length >= 1) {
      fdb.forEach(k => {
        const friend_id = db.ref.f[k].find(user_id => user_id !== uid);
        friend_list[friend_id] = hprof.getUser(uid, friend_id);
      });
    }
    return friend_list;
  },
  saveChar(uid, s) {
    const udb = db.ref.u;
    if(udb[uid].skin || udb[uid].uname) return {code:400,msg:"ACC_USER_ALREADY_EXIST"};
    if(!validate(["username"], s)) return {code:400,msg:"ACC_NO_USERNAME"};
    s.username = s.username.trim();
    if(!s.username.match(isUsername)) return {code:400,msg:"ACC_USERNAME_NOT_VALID"};
    if(s.username.length < 5 || s.username.length > 20) return {code:400,msg:"ACC_USERNAME_LIMIT"};
    if(s.username.replace(/\_/g, "").length < 3) return {code:400, msg:"ACC_USERNAME_CANNOT_BE_USED"};

    const unameExists = Object.values(udb).find(usr => usr.uname?.toLowerCase() === s.username.toLowerCase());
    const usrDeny = /^user/;
    const usrExist = ["dvnkz", "dvnkz_", "devanka"];
    if(unameExists || s.username.toLowerCase().match(usrDeny) || usrExist.includes(s.username.toLowerCase())) return {code:400,msg:"ACC_USERNAME_NOT_AVAILABLE", data: { username:s.username }};

    const skinKeyValid = ["Backpacks", "Beards", "Bodies", "Eyes", "Glasses", "Hairstyles", "Hats", "Outfits"];
    if(Object.keys(s.skin).filter(sk => !skinKeyValid.includes(sk)).length >= 1) return {code:400,msg:"ACC_SKIN_NOT_VALID"};;

    const skinNotValid = Object.values(s.skin).filter(sk => !skinlist.includes(sk));
    if(skinNotValid.length >= 1) return {code:400,msg:"ACC_SKIN_NOT_VALID"};

    const hasDvnkzSkin = Object.values(s.skin).find(skid => skid.includes("Dvnkz"));
    if(hasDvnkzSkin && (!udb[uid].a || udb[uid].a < 7)) return {code:400,msg:"ACC_SKIN_NOT_VALID"};

    const data = {};
    data.username = s.username;
    data.skin = {};
    if(hasDvnkzSkin) {
      data.skin.Outfit = hasDvnkzSkin;
    } else {
      Object.keys(s.skin).filter(sk => s.skin[sk] !== "null").forEach(sk => data.skin[sk] = s.skin[sk]);
    }
    data.joined = Date.now();
    data.file = "x" + Date.now().toString(36);
    data.t = [];

    db.ref.u[uid].uname = data.username;
    db.ref.u[uid].skin = data.skin;
    db.ref.u[uid].j = data.joined;
    db.ref.u[uid].f = data.file;
    db.ref.u[uid].t = data.t;

    const user_mails = db.fileGet(data.file, "mails") || {};
    user_mails["mail_initial"] = {
      "title": { "en": "Welcome!", "id": "Selamat Datang!" },
      "sub": { "en": "System", "id": "Sistem" },
      "msg": {
        "en": "Hello, there! Here we are on journey of the Kulon. Please take these welcome gifts for joining us.\nHAVE FUN!!",
        "id": "Halo! Selamat datang di perjalanan para Kulon. Semoga betah dengan petualangan sederhana ini. Terimalah sedikit hadiah berikut sebagai bentuk kebahagiaan atas tergabungnya anggota Kulon yang baru.\nENJOY!!"
      },
      "rewards": [
        { "id": "69", "amount": 160 },
        { "id": "420", "amount": 200 },
        { "id": "CL00001", "amount": 1, "expiry": (1000 * 60 * 60 * 24 * 7)},
        { "id": "CL00003", "amount": 1, "expiry": (1000 * 60 * 60 * 24 * 3)}
      ],
      "ts": Date.now()
    }
    db.fileSet(data.file, "mails", user_mails);

    db.save("u");
    return this.getSkin(uid);
  },
  reconnect(uid) {
    const udb = db.ref.u[uid];
    if(udb.b) return {code:403423};
    return this.getSkin(uid);
  },
  initPeer(uid) {
    const peerid = genHex();
    db.ref.u[uid].peer = peerid;

    const peerConf = {
      host: isProd ? process.env.TURN_APP_HOST : "localhost",
      key: peerKey,
      path: "cloud",
    }
    if(!isProd) peerConf.port = Number(process.env.TURN_APP_PORT);
    if(isProd) peerConf.config = {
      "iceServers": [
        { urls: `stun:${process.env.TURN_SERVER_HOST}:${process.env.TURN_SERVER_PORT}` },
        {
          urls: `turn:${process.env.TURN_SERVER_HOST}:${process.env.TURN_SERVER_PORT}`,
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_PASSWORD
        }
      ]
    };
    webhook.userLog({userid:uid, status: 1});
    return {peerKey, peerid, peerConf};
  },
  trophiesPeek(uid) {
    Object.keys(tob[uid].data).forEach(k => {
      const item = trophy_list[k];
      tob[uid].data[k].a = Math.floor((tob[uid].data[k].r / item.r) * item.a);
    });
    return {code:200, data: tob[uid].data};
  },
  trophyClaim(uid, s) {
    if(!validate(["trophy_id"], s)) return {code:400,msg:"ACH_NO_ID"};
    if(!trophy_list[s.trophy_id]) return {code:404,msg:"ACH_NO_ID"};
    const udb = db.ref.u[uid];
    if(!udb.f) return {code:404,msg:"ACH_NO_ID"};

    const tdb = tob[uid].data[s.trophy_id];
    if(!tdb || tdb.claimed || !tdb.done) return {code:400, msg:"ACH_NO_ID"};

    tob[uid].data[s.trophy_id].claimed = true;
    const rewardAmount = trophy_list[s.trophy_id].rw;

    const curbackpack = db.fileGet(udb.f, "backpack") || {};
    const itm_key = Object.keys(curbackpack).find(k => curbackpack[k].id === "69" && !curbackpack[k].expiry) || Date.now().toString(36) + `_69`;
    if(!curbackpack[itm_key]) curbackpack[itm_key] = {};
    curbackpack[itm_key].id = "69";
    curbackpack[itm_key].amount = (curbackpack[itm_key].amount || 0) + rewardAmount;
    db.fileSet(udb.f, "backpack", curbackpack);
    db.fileSet(udb.f, "trophies", tob[uid].data);

    const data = {};
    data.rewards = [{id:"69",amount:rewardAmount}];
    data.new_amount = {};
    data.new_amount[itm_key] = {};
    data.new_amount[itm_key].id = curbackpack[itm_key].id;
    data.new_amount[itm_key].amount = curbackpack[itm_key].amount;

    return {ok:1, code:200, data};
  },
  mailClaim(uid, s) {
    if(!validate(["mail_id"], s)) return {code:400,msg:"MAIL_NO_ID"};

    const udb = db.ref.u[uid];
    if(!udb.f) return {code:404,msg:"MAIL_NO_ID"};

    const curmail = db.fileGet(udb.f, "mails") || {};
    if(!curmail[s.mail_id]) return {code:404,msg:"MAIL_NO_ID"};
    if(curmail[s.mail_id].claimed) return {code:404,msg:"MAIL_NO_ID"};
    const curbackpack = db.fileGet(udb.f, "backpack") || {};
    const newRewards = [];
    let forMsg = "";
    curmail[s.mail_id].rewards.forEach(rw => {
      const item = cloud_items.find(itm => itm.id === rw.id);
      if(rw.expiry) {
        const newItmID = Date.now().toString(36) + `_${rw.id}`;
        curbackpack[newItmID] = {...rw, expiry: rw.expiry + Date.now()};
        newRewards.push(newItmID);
        forMsg += `${item.name.en} x${rw.amount} 🕘\n`;
      } else {
        const hasSame = Object.keys(curbackpack).find(k => curbackpack[k].id === rw.id && !curbackpack[k].expiry) || Date.now().toString(36) + `_${rw.id}`;
        if(!curbackpack[hasSame]) curbackpack[hasSame] = {};
        curbackpack[hasSame].id = rw.id;
        curbackpack[hasSame].amount = (curbackpack[hasSame].amount || 0) + rw.amount;
        newRewards.push(hasSame);
        forMsg += `${item.name.en} x${rw.amount}\n`;
      }
    });
    db.fileSet(udb.f, "backpack", curbackpack);
    curmail[s.mail_id].claimed = true;
    db.fileSet(udb.f, "mails", curmail);

    const data = {...curmail[s.mail_id], id:s.mail_id};
    data.new_amount = {};
    newRewards.forEach(k => {
      data.new_amount[k] = {};
      data.new_amount[k].id = curbackpack[k].id;
      data.new_amount[k].amount = curbackpack[k].amount;
      if(curbackpack[k].expiry) data.new_amount[k].expiry = curbackpack[k].expiry;
    });

    webhook.mail({userid:uid, mail_id:s.mail_id, rewards: forMsg.trim()});
    return {ok:1, code:200, data};
  },
  mailDelete(uid, s) {
    if(!validate(["mail_id"], s)) return {code:400,msg:"MAIL_NO_ID"};

    const udb = db.ref.u[uid];
    if(!udb.f) return {code:404,msg:"MAIL_NO_ID"};

    const curmail = db.fileGet(udb.f, "mails") || {};
    if(!curmail[s.mail_id]) return {code:404,msg:"MAIL_NO_ID"};
    if(!curmail[s.mail_id].claimed) return {code:404,msg:"MAIL_NO_ID"};
    delete curmail[s.mail_id];
    db.fileSet(udb.f, "mails", curmail);

    return {ok:1, code:200, data: {...curmail[s.mail_id], id:s.mail_id}};
  },
  changeUsername(uid, s) {
    const udb = db.ref.u[uid];
    if(!validate(["username", "item_id"], s)) return {code:400,msg:"ACC_NO_USERNAME"};

    if(!udb.f) return {code:400, msg:"ACC_NO_NAME_CARD_TICKET"};
    const backpack = db.fileGet(udb.f, "backpack");
    const itemID = backpack[s.item_id];
    if((itemID?.amount || 0) < 1 || !itemID) return {code:400, msg:"ACC_NO_NAME_CARD_TICKET"};
    if(itemID.id !== "CL00001") return {code:400, msg:"ACC_NO_NAME_CARD_TICKET"};
    if(itemID.expiry && itemID.expiry <= Date.now()) return {code:400, msg:"ACC_NAME_CARD_EXPIRED"};

    s.username = s.username.trim();
    if(!s.username.match(isUsername)) return {code:400,msg:"ACC_USERNAME_NOT_VALID"};
    if(s.username.length < 5 || s.username.length > 20) return {code:400,msg:"ACC_USERNAME_LIMIT"};
    if(s.username.replace(/\_/g, "").length < 3) return {code:400, msg:"ACC_USERNAME_CANNOT_BE_USED"};

    if(udb.uname === s.username) return {ok: 1, code: 200, data: { username: udb.uname }};

    const unameExists = Object.values(db.ref.u).find(usr => usr.uname.toLowerCase() === s.username.toLowerCase());
    const usrDeny = /^user/;
    const usrExist = ["dvnkz", "dvnkz_", "devanka"];
    if(unameExists || s.username.toLowerCase().match(usrDeny) || usrExist.includes(s.username.toLowerCase())) return {code:400,msg:"ACC_USERNAME_NOT_AVAILABLE", data: { username:s.username }};

    backpack[s.item_id].amount = backpack[s.item_id].amount - 1;
    db.fileSet(udb.f, "backpack", backpack);
    webhook.changeName({newusername: s.username, oldusername: udb.uname, userid:uid});

    db.ref.u[uid].uname = s.username;
    db.save("u");

    const data = {};
    data.username = s.username;
    data.new_amount = {};
    data.new_amount[s.item_id] = {};
    data.new_amount[s.item_id].id = backpack[s.item_id].id;
    data.new_amount[s.item_id].amount = backpack[s.item_id].amount;

    return {ok: 1, code: 200, msg: "ok", data};
  },
  updateSkin(uid, s) {
    if(!validate(["item_id"], s)) return {code:400,msg:"ACC_SKIN_NOT_VALID"};

    const udb = db.ref.u[uid];
    if(!udb.uname) return {code:400, msg:"USER_NOT_FOUND"};

    const backpack = db.fileGet(udb.f, "backpack");
    const itemID = backpack[s.item_id];
    if((itemID?.amount || 0) < 1 || !itemID) return {code:400, msg:"CHAR_NO_APPR_CARD_TICKET"};
    if(itemID.id !== "CL00002") return {code:400, msg:"CHAR_NO_APPR_CARD_TICKET"};
    if(itemID.expiry && itemID.expiry <= Date.now()) return {code:400, msg:"CHAR_APPR_CARD_EXPIRED"};

    if(!s.skin) return {code:400,msg:"ACC_SKIN_NOT_VALID"};
    const skinKeyValid = ["Backpacks", "Beards", "Bodies", "Eyes", "Glasses", "Hairstyles", "Hats", "Outfits"];
    if(Object.keys(s.skin).filter(sk => !skinKeyValid.includes(sk)).length >= 1) return {code:400,msg:"ACC_SKIN_NOT_VALID"};

    const skinNotValid = Object.values(s.skin).filter(sk => !skinlist.includes(sk));
    if(skinNotValid.length >= 1) return {code:400,msg:"ACC_SKIN_NOT_VALID"};
    const hasDvnkzSkin = Object.values(s.skin).find(skid => skid.includes("Dvnkz"));
    if(hasDvnkzSkin && (!udb.a || udb.a < 7)) return {code:400,msg:"ACC_SKIN_NOT_VALID"};

    backpack[s.item_id].amount = backpack[s.item_id].amount - 1;
    db.fileSet(udb.f, "backpack", backpack);

    const data = {};
    data.skinList = {};
    if(hasDvnkzSkin) {
      data.skinList.Outfit = hasDvnkzSkin;
    } else {
      Object.keys(s.skin).filter(sk => s.skin[sk] !== "null").forEach(sk => data.skinList[sk] = s.skin[sk]);
    }
    data.skin = {...data.skinList};
    if(data.skin.Hairstyles && data.skin.Hats) {
      data.skin.Hairstyles = "Hairstyle_01_" + data.skin.Hairstyles.substring((data.skin.Hairstyles.length - 2), (data.skin.Hairstyles.length));
    }
    data.skin = Object.values(data.skin);
    data.new_amount = {};
    data.new_amount[s.item_id] = {};
    data.new_amount[s.item_id].id = backpack[s.item_id].id;
    data.new_amount[s.item_id].amount = backpack[s.item_id].amount;

    db.ref.u[uid].skin = data.skinList;
    db.save("u");

    return {code:200, data};
  },
  exchange(uid, s) {
    if(!validate({
      item_id: "string",
      req_id: "string",
      price_amount: "number"
    }, s)) return {code:400, msg:"REQ_NOT_VALID"};
    const udb = db.ref.u[uid];
    if(!udb.f) return {code:400, msg:"REQ_NOT_VALID"};

    const item_selling = shop_items.find(itm => itm.id === s.item_id);
    if(!item_selling || item_selling.group !== "0") return {code:400, msg:"REQ_NOT_VALID"};

    const curbackpack = db.fileGet(udb.f, "backpack") || {};
    const req_key = Object.keys(curbackpack).find(k => curbackpack[k].id === s.req_id && !curbackpack[k].expiry);
    if(!req_key || curbackpack[req_key].amount < s.price_amount) return {code:404, msg: "EXC_NOT_ENOUGH"};

    const onPrice = item_selling.price > item_selling.amount;
    const addedAmount = (
      onPrice ? Math.floor(s.price_amount / (item_selling.price / item_selling.amount)) : s.price_amount * item_selling.amount
    );

    const itm_key = Object.keys(curbackpack).find(k => curbackpack[k].id === s.item_id && !curbackpack[k].expiry) || Date.now().toString(36) + `_${s.item_id}`;
    if(!curbackpack[itm_key]) curbackpack[itm_key] = {};
    curbackpack[itm_key].id = s.item_id;
    curbackpack[itm_key].amount = (curbackpack[itm_key].amount || 0) + addedAmount;
    curbackpack[req_key].amount = curbackpack[req_key].amount - s.price_amount;
    db.fileSet(udb.f, "backpack", curbackpack);

    const data = {};
    data.rewards = [{id:s.item_id,amount:addedAmount}];
    data.new_amount = {};
    data.new_amount[itm_key] = {};
    data.new_amount[itm_key].id = curbackpack[itm_key].id;
    data.new_amount[itm_key].amount = curbackpack[itm_key].amount;
    data.new_amount[req_key] = {};
    data.new_amount[req_key].id = curbackpack[req_key].id;
    data.new_amount[req_key].amount = curbackpack[req_key].amount;

    webhook.exchange({
      userid:uid,
      itemto: { name: cloud_items.find(itm => itm.id === curbackpack[itm_key].id).name.en, amount: addedAmount },
      itemfrom: { name: cloud_items.find(itm => itm.id === curbackpack[req_key].id).name.en, amount: s.price_amount },
    });
    return {ok:true, code:200, data};
  }
}