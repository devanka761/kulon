import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import playerState from "../manager/PlayerState.js";

const typelist = [];

export default class AdminMod {
  constructor({ onComplete, map, classBefore=null } = { onComplete, map }) {
    this.id = "adminmon";
    this.onComplete = onComplete;
    this.map = map;
    this.classBefore = classBefore;
  }
  async writeData() {
    const userid = await modal.prompt("Target User ID");
    if(!userid) return this.destroy(this.classBefore);
    const userset = await modal.select({
      msg: `Set ${userid}`,
      ic: "question",
      opt: {
        name: "user-set",
        items: [
          { id: "setBan", label: "Ban/Unban User" },
          { id: "setAdmin", label: "Promote/Demote", actived: true }
        ]
      }
    });
    if(!userset) return this.destroy(this.classBefore);
    await this[userset](userid);
  }
  async setBan(userid) {
    const checkBan = await modal.loading(xhr.get(`/x/admin/check-ban/${userid}`), "CHECKING USER");
    if(!checkBan || !checkBan.ok) {
      await modal.alert(checkBan.msg || lang.ERROR);
      return this.destroy(this.classBefore);
    }
    const banText = checkBan.data.banned ? "UNBAN" : "BAN";
    const uname = checkBan.data.username;
    const confBan = await modal.confirm(`${banText} User ${uname}`);
    if(!confBan) return this.destroy(this.classBefore);
    const sendBan = await modal.loading(xhr.post("/x/admin/ban", {id:userid}), `${banText}NING ${uname}`);
    if(!sendBan || !sendBan.ok) {
      await modal.alert(sendBan.msg || lang.ERROR);
      return this.destroy(this.classBefore);
    }
    await modal.alert(`${uname} has been ${banText.toLowerCase()}ned`);
    return this.destroy(this.classBefore);
  }
  async setAdmin(userid) {
    const adminLevel = await modal.prompt(`Admin Level for ${userid} ( 1 - 7 )`);
    if(!adminLevel) return this.destroy(this.classBefore);
    if(isNaN(Number(adminLevel))) return await this.setAdmin(userid);
    const sendAdmin = await modal.loading(xhr.post("/x/admin/set-admin", {
      id:userid, level: adminLevel.toString()
    }), "SENDING");
    if(!sendAdmin || !sendAdmin.ok) {
      await modal.alert(sendAdmin.msg || lang.ERROR);
      return this.destroy(this.classBefore);
    }
    await modal.alert(`${sendAdmin.data.username} has been promoted to Level ${adminLevel}`);
    return this.destroy(this.classBefore);
  }
  destroy(next) {
    this.isLocked = false;
    playerState.pmc = null;
    if(!next) return this.onComplete();
    if(typeof next !== "string") return next.init();
  }
  init() {
    playerState.pmc = this;
    this.writeData();
  }
}