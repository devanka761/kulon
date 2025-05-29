const MidtransClient = require("midtrans-client");
const qr = require("qrcode");
const db = require("../main/db");
const { validate, rNumber } = require("../main/helper");
const shop_items = require("../../../public/json/items/shop_items.json");
const cloud_items = require("../../../public/json/items/cloud_items.json");
const webhook = require("../main/webhook");

const prodMid = (process.env.MIDTRANS_PRODUCTION).toString() === "true" ? true : false;

const core = new MidtransClient.CoreApi({
  "isProduction": prodMid,
  "serverKey": process.env[(prodMid ? "PR" : "SB") + "_MIDTRANS_SERVER_KEY"],
  "clientKey": process.env[(prodMid ? "PR" : "SB") + "_MIDTRANS_CLIENT_KEY"]
});

module.exports = {
  async create(uid, s) {
    if(!validate(["item_id"], s)) return {code:400, msg:"DN_ITM_NOT_VALID"};

    const udb = db.ref.u[uid];
    if(!udb.f) return {code:400, msg:"USER_NOT_FOUND"};

    const item = shop_items.find(itm => itm._n === s.item_id && itm.group === "9");
    if(!item) return {code:400, msg:"DN_ITM_NOT_VALID"};

    const client_item = cloud_items.find(itm => itm.id === item.id);

    const donolist = db.fileGet("dono", "order") || {};
    if(udb.d) {
      const isActive = (donolist[udb.d]?.expiry || 0) > Date.now();
      if(isActive) return {code:404, data:await this.read(uid, udb.d, donolist[udb.d])};
    }

    const order_id = "kln" + Date.now().toString(36);

    const options = {
      "payment_type": "qris",
      "transaction_details": { "order_id":order_id, "gross_amount":item.price },
      "item_details": [{ "price":item.price, "quantity":1, "name":client_item.name.id }],
      "customer_details": { "userid":uid, "username":udb.uname, "email":udb.email, },
      "custom_expiry": { "expiry_duration": 360, }
    }

    return await core.charge(options).then(async res => {
      db.ref.u[uid].d = order_id;
      db.save("u");
      donolist[order_id] = {
        id: order_id,
        user: {id:uid},
        shop: item._n,
        actions: res.actions,
        qr: res.qr_string,
        expiry: new Date(res.expiry_time).getTime(),
        update: {
          transaction_time: new Date(res.settlement_time || res.transaction_time).getTime(),
          transaction_status: res.transaction_status
        }
      };

      db.fileSet("dono", "order", donolist);

      const data = {};
      data.order_id = order_id;
      data.expiry = new Date(res.expiry_time).getTime();
      data.shop = item._n;
      data.price = item.price;
      const qrImg = await qr.toDataURL((res.qr_string || res.actions.find(k => k.name === "generate-qr-code").url), { color: { light: "#DEDEDEFF", dark: "#1B1B1BFF" }}).then(url => url).catch(() => "error");
      data.qr = qrImg;
      if(qrImg === "error") {
        data.qr = res.actions.find(k => k.name === "generate-qr-code").url;
        data.errorqrimg = 1;
      }
      webhook.donation({ order_id: order_id, price: item.price.toString(), status: "Created", userid: uid, username: udb.uname });
      return {code:200, data};
    }).catch(err => {
      console.log(err);
      return {code:500,msg:"SERVER_BUSY"};
    })
  },
  async read(uid, order_id, ddb=null) {
    const udb = db.ref.u[uid];
    if(!udb.uname) return {code:400, msg:"USER_NOT_FOUND"};
    if(!udb.d || udb.d !== order_id) return {code:400, msg: "DN_ID_NOT_VALID"};
    if(!ddb) ddb = (db.fileGet("dono", "order") || {})[order_id];
    if(!ddb) return {code:400, msg: "DN_ID_NOT_VALID"};

    const item = shop_items.find(itm => itm._n === ddb.shop);
    const data = {};
    data.order_id = ddb.id;
    data.expiry = ddb.expiry;
    data.shop = ddb.shop;
    data.price = item.price;
    const qrImg = await qr.toDataURL((ddb.qr_string || ddb.actions.find(k => k.name === "generate-qr-code").url), { color: { light: "#DEDEDEFF", dark: "#1B1B1BFF" }}).then(url => url).catch(() => "error");
    data.qr = qrImg;
    if(qrImg === "error") {
      data.qr = ddb.actions.find(k => k.name === "generate-qr-code").url;
      data.errorqrimg = 1;
    }
    return {code:200, data};
  },
  async update(order_notification) {
    core.transaction.notification(order_notification).then(async res => {
      const order_id = res.order_id;
      const ddb = db.fileGet("dono", "order") || {};
      if(!ddb[order_id]) return;
      const uid = ddb[order_id].user?.id;
      if(!uid) return;
      const udb = db.ref.u[uid];
      if(!udb) return;
      if(res.transaction_status === ddb[order_id].update.transaction_status) return;
      const item = shop_items.find(itm => itm._n === ddb[order_id].shop);
      if(!item) return;
      ddb[order_id].update.transaction_status = res.transaction_status;
      ddb[order_id].update.transaction_time = new Date(res.transaction_time).getTime();
      if(res.transaction_status === "cancel" || res.transaction_status === "expire") {
        delete ddb[order_id];
        delete db.ref.u[uid].d;
        db.save("u");
      } else if(res.transaction_status === "settlement") {
        delete db.ref.u[uid].d;
        const user_mails = db.fileGet(udb.f, "mails") || {};
        user_mails[order_id] = {
          "title": { "en": "THANKS!", "id": "MAKASIH!" },
          "sub": { "en": "Server", "id": "Server" },
          "msg": {
            "en": "Hello, there! Thank you for supporting Kulon and being part of the growth! Here are rewards as our appreciation as promised.\nENJOY!!",
            "id": "Gokil! Makasih ya udah support dan menjadi bagian dari perkembangan Kulon. Terimalah sedikit hadiah berikut sebagai bentuk apresiasi seperti yang udah dijanjikan.\nENJOY!!"
          },
          "rewards": [
            { "id": item.id, "amount": item.amount + (item.bonus || 0) }
          ],
          "ts": Date.now()
        }
        db.fileSet(udb.f, "mails", user_mails);

        if(!udb.zzz) db.ref.u[uid].zzz = [];
        db.ref.u[uid].zzz.push({ order_id, "type": "donate_settlement", "id": order_id });
        db.ref.u[uid].zzz.push({ "type": "mails", "id": order_id });
        db.save("u");
      }
      db.fileSet("dono", "order", ddb);
      webhook.donation({
        order_id, username:udb.uname, userid:uid,
        status:res.transaction_status, price: item.price.toString(),
      });
    }).catch(err => {
      console.error(err);
    })
  }
};
