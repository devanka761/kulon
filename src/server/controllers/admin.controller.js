const fs = require("fs");
const db = require("../main/db");
const { validate } = require("../main/helper");
const cloud_items = require("../../../client/json/items/cloud_items.json");

module.exports = {
  getEditorMapData() {
    const data = {};
    const mdb = db.ref.m;
    Object.keys(mdb).forEach(k => {
      data[k] = {};
      data[k].id = k;
      data[k].name = mdb[k].name;
      data[k].src = mdb[k].src;
    });
    return {code:200, data};
  },
  newProject(uid, s) {
    const udb = db.ref.u[uid];
    if(!udb || !udb.a || udb.a < 7) return {code:403, msg:"Error: This \"newProject\" method can only be accessed by admins with Level 7"};
    if(!validate(["project_name"], s)) return {code:400};
    s.project_name = s.project_name.replace(/\s/g, "").toLowerCase();
    const mdb = db.ref.m;
    if(mdb[s.project_name]) return {code:400, msg: "The Project Name Has Already Been Used"};
    db.ref.m[s.project_name] = Date.now();
    fs.writeFileSync(`./client/json/maps/mp_${s.project_name}.json`, JSON.stringify({}), "utf-8");
    fs.writeFileSync(`./client/json/assets/st_${s.project_name}.json`, JSON.stringify([]), "utf-8");
    fs.writeFileSync(`./client/json/scenes/cs_${s.project_name}.json`, JSON.stringify([]), "utf-8");
    db.save("m");
    return {code:200};
  },
  loadProject(project_name) {
    const mdb = db.ref.m[project_name];
    if(!mdb) return {code:400, msg: "The Project Is Not Available or Has Been Deleted"};
    return {code:200, data:{id:project_name}};
  },
  addAsset(uid, s) {
    const udb = db.ref.u[uid];
    if(!udb || !udb.a || udb.a < 5) return {code:403, msg:"Error: This \"addAsset\" method can only be accessed by admins with Level 5"};
    if(!validate(["asset-name", "asset-folder", "asset-file", "asset-extension", "project_name"], s)) return {code:400};
    s.extension = s["asset-extension"];
    if(s.extension !== ".png" && s.extension !== ".svg") return {code:400,msg:"Asset file extension must be png or svg"}
    const mdb = db.ref.m[s.project_name];
    if(!mdb) return {code:400, msg: "The Project Is Not Available or Has Been Deleted"};
    s.name = s["asset-name"].replace(/\s/g, "");
    s.folder = s["asset-folder"].replace(/\s/g, "").toLowerCase();

    const dataurl = decodeURIComponent(s["asset-file"]);
    const buffer = Buffer.from(dataurl.split(',')[1], 'base64');
    if(buffer.length > (5 * 1000 * 1000)) {
      return {code:413,msg:"FAILED: Request Entity Too Large"}
    }

    const folderExists = fs.existsSync(`./client/assets/maps/${s.folder}`);
    if(!folderExists) fs.mkdirSync(`./client/assets/maps/${s.folder}`);
    const fileExists = fs.existsSync(`./client/assets/maps/${s.folder}/${s.name}${s.extension}`);
    const assetPath = `./client/json/assets/st_${s.project_name}.json`;
    if(!fs.existsSync(assetPath)) return {code:404, msg:"Asset List File Does Not Exist"};
    if(!fileExists) fs.writeFileSync(`./client/assets/maps/${s.folder}/${s.name}${s.extension}`, buffer);

    const assetFile = fs.readFileSync(assetPath, "utf-8");
    const waitingFile = JSON.parse(assetFile);
    const assetsData = { id: s.name, path: `/assets/maps/${s.folder}/${s.name}${s.extension}`};
    waitingFile.push(assetsData);
    fs.writeFileSync(assetPath, JSON.stringify(waitingFile), "utf-8");
    return {code:200,data:{assets:[assetsData]}}
  },
  remAsset(uid, s) {
    const udb = db.ref.u[uid];
    if(!udb || !udb.a || udb.a < 5) return {code:403, msg:"Error: This \"removeAsset\" method can only be accessed by admins with Level 5"};
    if(!validate(["project_name", "asset-filename"], s)) return {code:400};
    s.filename = s["asset-filename"];
    const mdb = db.ref.m[s.project_name];
    if(!mdb) return {code:400, msg: "The Project Is Not Available or Has Been Deleted"};

    const assetPath = `./client/json/assets/st_${s.project_name}.json`;
    if(!fs.existsSync(assetPath)) return {code:404, msg: "The Project Is Not Available or Has Been Deleted"};

    const assetBuffer = fs.readFileSync(assetPath, "utf-8");
    const assetList = JSON.parse(assetBuffer);
    const currAsset = assetList.find(st => st.id === s.filename);
    if(!currAsset) return {code:400, msg: "Asset Does Not Exist or Has Been Deleted"};
    const currPath = `./client${currAsset.path}`;
    if(fs.existsSync(currPath)) fs.unlinkSync(currPath);
    const newAssetList = assetList.filter(st => st.id !== currAsset.id);
    fs.writeFileSync(assetPath, JSON.stringify(newAssetList), "utf-8");

    return {code:200, data:{asset:s.filename}};
  },
  saveProject(uid, s) {
    const udb = db.ref.u[uid];
    if(!udb || !udb.a || udb.a < 5) return {code:403, msg:"Error: This \"exportProject\" method can only be accessed by admins with Level 5"};
    if(!validate(["project_name", "file1", "file2"], s)) return {code:400};

    const mdb = db.ref.m[s.project_name];
    if(!mdb) return {code:400, msg: "The Project Is Not Available or Has Been Deleted"};

    const projectPath = `./client/json/maps/mp_${s.project_name}.json`;
    if(!fs.existsSync(projectPath)) return {code:400, msg: "The Project Is Not Available or Has Been Deleted"};
    const finishedPath = `./client/json/scenes/cs_${s.project_name}.json`;
    if(!fs.existsSync(finishedPath)) return {code:400, msg: "The Project Is Not Available or Has Been Deleted"};

    fs.writeFileSync(projectPath, s.file1, "utf-8");
    fs.writeFileSync(finishedPath, s.file2, "utf-8");
    return {code:200}
  },
  sendMail(uid, s) {
    const mydb = db.ref.u[uid];
    if(!mydb || !mydb.a || mydb.a < 6) return {code:403, msg:"Error: This \"sendRewardsMail\" method can only be accessed by admins with Level 6"};
    if(!validate(["userid", "title", "sub", "message"], s)) return {code:400,msg:"Invalid Body"};
    if(!s.rewards) return {code:400,msg:"Invalid Rewards Body"};
    const user_id = s.userid.trim();
    const udb = db.ref.u[user_id];
    if(!udb || !udb.f) return {code:400,msg:"USER_NOT_FOUND"};

    s.title = s.title.trim();
    s.sub = s.sub.trim();
    s.message = s.message.trim();
    const title = { id: s.title?.split("\\")?.[0] || s.title, en: s.title?.split(" ")?.[1] || s.title };
    const sub = { id: s.sub?.split("\\")?.[0] || s.sub, en: s.sub?.split(" ")?.[1] || s.sub };
    const message = { id: s.message?.split("\\")?.[0] || s.message, en: s.message?.split(" ")?.[1] || s.message };

    const hasNotValid = [];

    const rewards = Object.keys(s.rewards).filter(k => {
      const item_id = s.rewards[k]?.split(" ")?.[0] || null;
      const item_amount = Number(s.rewards[k]?.split(" ")?.[1] || 0);
      if(!item_id || !item_amount || item_amount < 1) hasNotValid.push(k);
      const item = cloud_items.find(itm => itm.id === item_id);
      if(!item) hasNotValid.push(k);
      return item;
    }).map(k => {
      const item_id = s.rewards[k].split(" ")[0];
      const item_amount = Number(s.rewards[k].split(" ")[1]);
      return {id: item_id, amount: item_amount};
    });

    if(hasNotValid.length >= 1) return {code:400, msg:"There are Invalid Items"};

    const mail_id = "m" + Date.now().toString(36);
    const user_mails = db.fileGet(udb.f, "mails") || {};
    user_mails[mail_id] = { title, sub, msg: message, rewards, ts: Date.now() };
    db.fileSet(udb.f, "mails", user_mails);

    if(!udb.zzz) db.ref.u[user_id].zzz = [];
    db.ref.u[user_id].zzz.push({
      "type": "mails",
      "id": mail_id
    });

    return {code:200, msg:"OK", data: {user: {id:user_id, username:udb.uname}}}
  },
  checkBan(uid, userid) {
    const mydb = db.ref.u[uid];
    if(!mydb || !mydb.a || mydb.a < 6) return {code:403, msg:"Error: This \"checkBan\" method can only be accessed by admins with Level 6"};
    const udb = db.ref.u[userid];
    if(!udb) return {code:404, msg:("Cannot find user with id " + userid)};
    return {code:200, data:{username:udb.uname, banned: (udb.b ? true : false)}};
  },
  banUser(uid, s) {
    const mydb = db.ref.u[uid];
    if(!mydb || !mydb.a || mydb.a < 6) return {code:403, msg:"Error: This \"setBanUnBan\" method can only be accessed by admins with Level 6"};
    if(!validate(["id"], s)) return {code:400,msg:"ID Not Found"};
    const udb = db.ref.u[s.id];
    if(!udb) return {code:404, msg:("Cannot find user with id " + s.id)};
    if(udb.b) {
      delete db.ref.u[s.id].b;
    } else {
      db.ref.u[s.id].b = true;
    }
    db.save("u");
    return {code:200}
  },
  setAdmin(uid, s) {
    const mydb = db.ref.u[uid];
    if(!mydb || !mydb.a || mydb.a < 7) return {code:403, msg:"Error: This \"setAdmin\" method can only be accessed by admins with Level 7"};
    if(!validate(["id", "level"], s)) return {code:400,msg:"ID Not Found"};
    s.level = Number(s.level);
    if(isNaN(s.level) || s.level < 0 || s.level > 7) return {code: 404, msg:"Admin Level must be between 0 - 7"};
    const udb = db.ref.u[s.id];
    if(!udb) return {code:404, msg:("Cannot find user with id " + s.id)};
    if(!udb.zzz) db.ref.u[s.id].zzz = [];
    if(s.level >= 1) {
      db.ref.u[s.id].a = s.level;
      db.ref.u[s.id].zzz.push({
        "type": "adminpromote",
        "level": s.level,
        "id": uid
      });
    } else {
      delete db.ref.u[s.id].a;
      db.ref.u[s.id].zzz.push({
        "type": "admindemote",
        "id": uid
      });
    }
    db.save("u");
    return {code:200, data:{username: udb.uname}};
  },
  peekUsers(userid) {
    userid = userid.toLowerCase();
    const udb = db.ref.u;
    if(userid === "online") {
      return {code:200, data: {
        users: Object.keys(udb).filter(k => udb[k].peer).map(k => {
          return { ...udb[k], id: k};
        })
      }}
    }
    if(userid === "allusers") {
      return {code:200, data: {
        users: Object.keys(udb).filter(k => udb[k].uname).map(k => {
          return { ...udb[k], id: k};
        })
      }}
    }
    return {code:200, data: {
      users: Object.keys(udb).filter(k => {
        return (udb[k] && udb[k].uname && (k === userid || udb[k].uname.toLowerCase().includes(userid)));
      }).slice(0, 20).map(k => {
        return { ...udb[k], id: k }
      })
    }}
  }
}