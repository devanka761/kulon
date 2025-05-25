const crypto = require("crypto");
const trophy_list = require("../../../client/json/main/trophies.json");
const tob = require("./tob");
const db = require("./db");
module.exports = {
  isProd: process.env.APP_PRODUCTION.toString() === "true",
  peerKey: crypto.randomBytes(8).toString("hex"),
  genHex(n = 8) {
    return crypto.randomBytes(n).toString("hex");
  },
  trophyParse(uid, trophy_id, filekey) {
    const item = trophy_list[trophy_id];
    tob[uid].data[trophy_id].a = Math.floor((tob[uid].data[trophy_id].r / item.r) * item.a);
    tob[uid].data[trophy_id].done = true;
    tob[uid].data[trophy_id].ts = Date.now();
    db.ref.u[uid].t.push(trophy_id);
    if(tob[uid].data[trophy_id].tmp) delete tob[uid].data[trophy_id].tmp;
    db.fileSet(filekey, "trophies", tob[uid].data);
    if(!db.ref.u[uid].zzz) db.ref.u[uid].zzz = [];
    db.ref.u[uid].zzz.push({
      "type": "trophies",
      "id": trophy_id,
      "data" : {id:trophy_id}
    });
  },
  validate(snap, data = null) {
    if (!data) throw new Error("The validate's data want to check is null");
    if (snap instanceof Array) {
      const valids = snap.filter((s) => {
        if (typeof s !== "string") {
          throw new Error({
            message: "The required snap to check should be string",
          });
        }
        return (
          typeof s === "string" &&
          typeof data[s] === "string" &&
          data[s].length >= 1
        );
      });
      if (valids.length !== snap.length) return false;
      return true;
    } else if (typeof snap === "object") {
      const suptype = ["number", "string", "boolean"];
      const reqs = Object.keys(snap);
      const valids = reqs.filter(s => {
        if(!suptype.includes(snap[s])) {
          throw new Error({
            message: "Each required snap to check should be string/number/boolean",
          });
        }
        return typeof data[s] === snap[s];
      });
      if(valids.length !== reqs.length) return false;
      return true;
    }
    return false;
  },
  rep(s = { code: 400 }) {
    const repdata = {};
    repdata.ok = s.code === 200;
    repdata.code = s.code;

    if(s.msg) repdata.msg = s.msg;
    if(s.data && typeof s.data === "object") repdata.data = s.data;

    return repdata;
  },
  rNumber(n = 6) {
     let a = "";
     for(let i = 1; i < n; i++) { a += "0"; }
     return Math.floor(Math.random() * Number("9" + a)) + Number("1" + a);
  },
  encryptData(plaintext) {
    const chatkey = Buffer.from(process.env.CHAT_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', chatkey, iv);
    const encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    const dataResult = encrypted + cipher.final('hex');
    return `${iv.toString('hex')}:${dataResult}`;
  },
  decryptData(ciphertext) {
    const chatkey = Buffer.from(process.env.CHAT_KEY, 'hex');
    const [ivHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', chatkey, iv);
    const decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    const dataResult = decrypted + decipher.final('utf-8');
    return dataResult;
  }
};
