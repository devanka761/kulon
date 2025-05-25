import shop_items from "../../../../client/json/items/shop_items.json";
import db from "./db.js";
import playerState from "./PlayerState.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import { Exchange } from "./Exchange.js";
import cloud from "./cloud.js";
import utils from "../main/utils.js";
import Appearance from "./Appearance.js";
import { klang, lang } from "../helper/lang.js";

export default class ItemData {
  constructor(snap) {
    this.snap = snap;
  }
  async exchange(s) {
    const exchange = new Exchange({
      classBefore:this.snap.classBefore,
      onComplete:this.snap.onComplete,
      item_id: shop_items.find(k => k.req === s.id).id
    });
    return exchange.init();
  }
  async changeName(s) {
    if(db.onduty > 1) {
      await modal.alert(lang.ITD_ONDUTY);
      return this.snap.classBefore.init();
    }
    const custlang = {
      "1": {
        id: "Masukkan username baru",
        en: "Enter new username"
      },
      "2": {
        id: "Ganti username menjadi <b>{username}</b>?",
        en: "Change username to <b>{username}</b>?"
      },
    }
    const newName = await modal.prompt({
      msg: custlang[1][klang.currLang],
      ic: "pencil",
      pholder: db.char.username,
      iregex: /[^A-Za-z0-9_]/g
    });
    const isUsername = /^[A-Za-z0-9_.-]+$/;
    if(!newName) return this.snap.classBefore.init();
    if(!newName.match(isUsername)) {
      await modal.alert(lang.ACC_USERNAME_NOT_VALID);
      return await this.changeName();
    }
    if(db.char.username === newName) return this.snap.classBefore.init();
    const nameConfirm = await modal.confirm({
      msg: custlang[2][klang.currLang].replace("{username}", newName),
      ic: "question"
    });
    if(!nameConfirm) return this.snap.classBefore.init();
    const nameChanged = await modal.loading(xhr.post("/x/account/change-username", {
      username: newName,
      item_id: s._id
    }));
    if(!nameChanged || !nameChanged.ok) {
      await modal.alert((lang[nameChanged.msg] || lang.ERROR).replace("{username}", newName));
      return this.snap.classBefore.init();
    }
    if(db.char.username === nameChanged.data.username) return this.snap.classBefore.init();

    Object.keys(nameChanged.data.new_amount).forEach(k => {
      if(!db.char.backpack[k]) db.char.backpack[k] = {};
      db.char.backpack[k].id = nameChanged.data.new_amount[k].id;
      db.char.backpack[k].amount = nameChanged.data.new_amount[k].amount;
    });

    db.char.username = nameChanged.data.username;
    await modal.alert({
      msg: lang.ACC_NAME_CARD_SUCCESS.replace("{username}", db.char.username),
      ic: "circle-check"
    });
    return this.snap.classBefore.init();
  }
  async appearance(s) {
    if(db.onduty > 1) {
      await modal.alert(lang.ITD_ONDUTY);
      return this.snap.classBefore.init();
    }
    const appearanceForm = new Appearance({onComplete:this.snap.onComplete, classBefore:this.snap.classBefore, map:this.snap.map, item_id: s._id });
    return appearanceForm.init();
  }
  async leftOnPrepare(s) {
    await modal.alert({
      msg: lang.PRP_ON_LEFT.replace("{user}", s.username),
      ic: "person-to-door"
    });
    db.job = {};
    db.onduty = 1;
    if(playerState.journey?.end) playerState.journey.end();
    this.snap.classBefore.resumeMap();
    return this.snap.onComplete();
  }
  async wantToLeaveMission() {
    const leaveConfirm = await modal.confirm(lang.MS_CONFIRM_LEAVE);
    if(!leaveConfirm) {
      return this.snap.classBefore.init();
    }
    this.snap.onComplete();
    cloud.asend("exitfromjob");
    // this.snap.map.startCutscene([
    //   {type: "journeyResult" },
    // ]);
    
    playerState.journey.showUnfinished(0, db.char);
    // playerState.journey.end();
  }
  async init() {
    if(this.snap._id === "snap" || !this[this.snap._id]) return null;
    return await this[this.snap._id](this.snap.passedData);
  }
}