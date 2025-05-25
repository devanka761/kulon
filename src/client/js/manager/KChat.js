import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import cloud from "./cloud.js";
import db from "./db.js";
import playerState from "./PlayerState.js";

const pmcWhiteList = ["prepare", "matchmaking", "result", "minigame", "payouts"];
let hideTimeout = null;

class KChat {
  constructor() {
    this.opened = false;
    this.formOpened = false;
    this.history = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("kchat", "hide");
    this.el.innerHTML = `
    <div class="box">
      <div class="content">
        <div class="list">
          <p class="empty">${lang.EMPTY}</p>
        </div>
      </div>
      <form action="/ehek" method="post" class="kchat-form hide">
        <div class="btn btn-kchat-cancel"><i class="fa-solid fa-xmark"></i></div>
        <input type="text" autocomplete="off" name="kchat-txt" id="kchat-txt" placeholder="${lang.TYPE_HERE}" maxlength="200" />
        <button class="btn btn-kchat-send"><i class="fa-solid fa-angles-right"></i></button>
      </form>
    </div>`;
    this.elist = this.el.querySelector(".list");
    this.eform = this.el.querySelector(".kchat-form");
    this.inp = this.eform.querySelector("#kchat-txt");
    this.btnCancel = this.eform.querySelector(".btn-kchat-cancel");
  }
  add(usr_id, usr_txt, isSystem=false) {
    if(this.elist.querySelector(".empty")) {
      this.elist.querySelector(".empty").remove();
    }
    if(usr_id !== db.char.id && !db.job?.players?.[usr_id]) return;
    usr_txt = usr_txt.trim();
    if(usr_txt.length < 1) return;
    if(this.el.classList.contains("hide")) {
      this.el.classList.remove("hide");
    }
    const card = document.createElement("p");
    card.classList.add("cht");
    card.innerHTML = `<i class="uname${isSystem ? ' y' : ''}"></i><i class="txt${isSystem ? ' y' : ''}"></i>`;
    const currname = (usr_id === db.char.id ? db.char : db.job.players[usr_id]).username;
    card.querySelector(".uname").innerText = currname;
    card.querySelector(".txt").innerText = usr_txt;
    const chtID = Date.now().toString(36) + Math.random().toString(36).substring(2,7);
    if(this.history.length > 30) {
      const histIdx = this.history.length - 30;
      for(let i = 0; i < histIdx ;i++) {
        this.history[i].element.remove();
      }
      this.history = this.history.slice(histIdx, this.history.length);
    }
    this.history.push({ id: chtID, element: card, text: usr_txt });
    this.elist.append(card);
    this.elist.scrollTop = this.elist.scrollHeight;
    if(!this.formOpened) {
      this.resetTimeout();
    }
  }
  clear() {
    this.history.forEach((_, i) => this.history[i].element.remove());
    this.history = [];
    const p = document.createElement("p");
    p.classList.add("empty");
    p.innerHTML = lang.EMPTY;
    this.elist.append(p);
    this.hide();
  }
  async open() {
    if(playerState.pmc && (!pmcWhiteList.includes(playerState.pmc?.id))) return;
    if(document.querySelector(".modal")) return;
    if(hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    if(this.el.classList.contains("hide")) {
      this.el.classList.remove("hide");
    }
    this.opened = true;
    if(!this.eform.classList.contains("hide")) return;
    this.formOpened = true;
    this.eform.classList.remove("hide");
    document.onkeydown = e => {
      if(e.key.toLocaleLowerCase() === "escape") {
        this.hide();
        document.onkeydown = null;
      }
    }
    document.onmousedown = e => {
      if(!this.eform.contains(e.target) && !this.elist.contains(e.target)) {
        this.hide();
        document.onclick = null;
      }
    }
    await modal.waittime(20);
    this.elist.scrollTop = this.elist.scrollHeight;
    if(!this.eform.classList.contains("hide")) {
      this.inp.focus();
    }
  }
  hide() {
    if(!this.eform.classList.contains("hide")) {
      this.eform.classList.add("hide");
    }
    this.inp.value = "";
    this.formOpened = false;
    if(this.history.length >= 1) {
      this.resetTimeout();
    } else {
      if(!this.el.classList.contains("hide")) {
        this.el.classList.add("hide");
      }
      this.opened = false;
    }
  }
  resetTimeout() {
    if(hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    hideTimeout = setTimeout(() => {
      if(!this.eform.classList.contains("hide")) {
        this.eform.classList.add("hide");
      }
      if(!this.el.classList.contains("hide")) {
        this.el.classList.add("hide");
      }
      this.formOpened = false;
      this.opened = false;
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }, 5000);
  }
  formListener() {
    this.btnCancel.onclick = () => this.hide();
    this.eform.onsubmit = e => {
      e.preventDefault();
      if(this.inp.value.replace(/\s/g, "").length < 1) return;
      const user_text = this.inp.value.trim();
      this.add(db.char.id, user_text);
      this.inp.value = "";
      this.hide();
      let otherPeers = [];
      const myJobPlayers = Object.values(db.job?.players || {}).filter(pl => pl.id && pl.id !== db.char.id).map(pl => pl.peer);
      if(db.crew.length >= 1) {
        otherPeers = db.crew;
      } else if(myJobPlayers.length >= 1) {
        otherPeers = myJobPlayers;
      }
      if(otherPeers.length < 1) return;
      cloud.send({id: "kchat", to: otherPeers, data: {msg: user_text}});
    }
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.formListener();
  }
}

const kchat = new KChat();
export default kchat;