import modal from "../helper/modal.js";
import playerState from "../manager/PlayerState.js";

export default class ForceClose {
  constructor({msg_1, msg_2, action_text=null, action_url=null} = {}) {
    this.msg_1 = msg_1;
    this.msg_2 = msg_2;
    this.action_text = action_text;
    this.action_url = action_url;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("forceClose");
    this.el.innerHTML = `
    <div class="box">
      <div class="msg msg-1">${this.msg_1}</div>
      <div class="msg msg-2">${this.msg_2}</div>
    </div>`;
    if(this.action_text && this.action_url) {
      const msg_3 = document.createElement("div");
      msg_3.classList.add("msg", "msg-3");
      msg_3.innerHTML = `<p><a href="${this.action_url}">${this.action_text}</a></p>`;
      this.el.querySelector(".box").append(msg_3);
    }
  }
  async destroyAll() {
    const hasModal = document.querySelector(".modal");
    if(hasModal) {
      const btnCancel = hasModal.querySelector(".btn-cancel");
      const btnOk = hasModal.querySelector(".btn-ok");
      if(btnCancel) {
        btnCancel.click();
        await modal.waittime();
      } else if(btnOk) {
        btnOk.click();
        await modal.waittime();
      }
    }
    if(playerState.pmc && playerState.pmc.destroy) await playerState.pmc.destroy(); 
    const canvas = document.querySelector(".canvas");
    if(canvas) canvas.remove();
    document.querySelector(".app").innerHTML = "";
    document.querySelector(".app").remove();
  }
  async init() {
    this.createElement();
    await this.destroyAll();
    document.querySelector("body").append(this.el);
  }
}