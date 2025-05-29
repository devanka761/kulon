const nodemailer = require("nodemailer");
const fs = require("fs");
const db = require("../main/db");
const { validate, rNumber, isProd } = require("../main/helper");

// const mailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
// const usernameregex = /^[A-Za-z0-9_]+$/;
module.exports = {
  login(s) {
    if(!validate(["email"], s)) return {code:400};
    s.email = s.email.toLowerCase();
    const mailValid = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    if(!s.email.match(mailValid)) return {code:400, msg:"EMAIL_NOT_VALID", text: "Your email address is not valid"};

    const oldEmailKey = Object.keys(db.ref.t).find(key => db.ref.t[key].email == s.email);
    const tempid = oldEmailKey ? oldEmailKey : 'u' + Date.now().toString(32);

    const gencode = rNumber(6);
    if(!db.ref.t[tempid]) db.ref.t[tempid] = {
      email: s.email,
      otp: { code: gencode, expiry: Date.now() + (1000 * 60 * 10) },
      rate: 0,
    }
    if(db.ref.t[tempid].rate >= 2) {
      setTimeout(() => {
        delete db.ref.t[tempid];
      }, 1000 * 30);
    }
    if(db.ref.t[tempid].rate >= 3 || db.ref.t[tempid].cd >= 3) return {code:429, msg: "AUTH_RATE_LIMIT"};
    db.ref.t[tempid].email = s.email;
    db.ref.t[tempid].otp = { code: gencode, expiry: Date.now() + (1000 * 60 * 10) };
    db.ref.t[tempid].rate = db.ref.t[tempid].rate + 1;

    if(isProd) {
      emailCode(s.email, gencode);
    } else {
      db.save("t");
    }
    return {code:200, msg: "OK", data: {email:s.email}};
  },
  verify(s) {
    if(!validate(["email", "code"], s)) return {code:404};
    s.email = s.email.toLowerCase();
    const mailValid = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
    if(!s.email.match(mailValid)) return {code:404, msg:"EMAIL_NOT_VALID", text: "Your email address is not valid"};
    s.code = Number(s.code);

    const tdb = db.ref.t;
    const dbkey = Object.keys(tdb).find(key => tdb[key].email == s.email);
    if(!dbkey) return {code:400, msg:"AUTH_ERR_04"};
    if(tdb[dbkey]?.cd >= 3) {
      setTimeout(() => {
        delete db.ref.t[dbkey];
      }, 1000 * 10);
    }
    if(tdb[dbkey]?.cd >= 4) return {code:429, msg:"AUTH_RATE_LIMIT"};
    db.ref.t[dbkey].cd = (db.ref.t[dbkey].cd || 0) + 1;

    if(tdb[dbkey].otp.code !== s.code) return {code:400, msg:"AUTH_ERR_04"};
    if(tdb[dbkey].otp.expiry < Date.now()) return {code:400, msg:"AUTH_ERR_05", data:{restart:1}};

    return this.processUser(s.email, dbkey);
  },
  processUser(email, dbkey) {
    const udb = db.ref.u;
    const data = { user: { data: { provider: "kulon", email } } };
    let ukey = Object.keys(udb).find(key => udb[key]?.data?.provider === "kulon" && udb[key]?.data?.email === email);
    if(!ukey) {
      ukey = '7' + rNumber(5).toString() + (Object.keys(udb).length + 1).toString();
      db.ref.u[ukey] = {};
      db.ref.u[ukey].id = ukey;
      db.ref.u[ukey].data = data.user.data;
      db.save('u');
    }
    data.user.id = ukey;
    delete db.ref.t[dbkey];
    if(db.ref.u[ukey].b) return {code:403423};
    return {code:200, data};
  },
  processThirdParty(s) {
    const udb = db.ref.u;
    const userInfo = {};
    Object.keys(s.user).forEach(k => {
      if(k === "email" || k === "id") userInfo[k] = s.user[k];
    });
    userInfo.provider = s.provider;
    const data = { user: { data: userInfo } };
    let ukey = Object.keys(udb).find(key => udb[key]?.data?.provider === s.provider && udb[key]?.data?.id === userInfo.id);
    if(!ukey) {
      ukey = '7' + rNumber(5).toString() + (Object.keys(udb).length + 1).toString();
      db.ref.u[ukey] = {};
      db.ref.u[ukey].data = data.user.data;
      db.save('u');
    }
    data.user.id = ukey;
    return {code:200, data};
  },
  isLogged(uid) {
    const user = db.ref.u[uid];
    if(!user) return { code:401, msg:"UNAUTHORIZED" };
    if(user.b) return {code:403423, msg: "account_suspended"}
    const data = {};
    data.id = uid;
    return { code:200, data };
  },
  stillUser(uid) {
    const udb = db.ref.u[uid];
    if(!udb || !udb.peer) return {code:401};
    if(udb.b) return {code:403423};
    return {code:200, data:{peer: udb.peer}};
  }
};

const emailQueue = { index: 0, done: 0 };

function emailCode(user_email, gen_code) {
  emailQueue.index++;
  sendEmailCode(emailQueue.index, user_email, gen_code);
};

function sendEmailCode(emailIndex, user_email, gen_code) {
  if(emailQueue.done + 1 !== emailIndex) {
    return setTimeout(() => sendEmailCode(emailIndex, user_email, gen_code), 200);
  }

  const transportConfig = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  }

  const transport = nodemailer.createTransport(transportConfig);

  const email_file = fs.readFileSync("./src/server/html/email_otp.txt", "utf-8").replace(/{GEN_CODE}/g, gen_code);

  transport.sendMail({
    from: `"Kulon" <${process.env.SMTP_USER}>`,
    to: user_email,
    subject: `Your login code is ${gen_code}`,
    html: email_file
  }).catch((err) => {
    console.log(err);
  }).finally(() => {
    transport.close();
    emailQueue.done++;
    if(emailQueue.done === emailQueue.index) {
      emailQueue.index = 0;
      emailQueue.done = 0;
    }
  });
}