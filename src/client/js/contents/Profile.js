import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import sdate from "../helper/sdate.js";
import xhr from "../helper/xhr.js";
import asset from "../manager/asset.js";
import db from "../manager/db.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";

export default class Profile {
  constructor({ user, onComplete, classBefore=null } = { user, onComplete }) {
    this.id = "player";
    this.user = user;
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-profile");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-user"></i> Player</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="profile">
          <div class="avatar">
            <div class="hero"></div>
          </div>
          <div class="user">
            <div class="uname"></div>
            <div class="userid"></div>
          </div>
        </div>
        <div class="fact">
          <div class="time-joined"></div>
          <div class="achievements-count"></div>
        </div>
        <div class="actions">
          <div class="btn btn-add">
            <i class="fa-solid fa-user-plus"></i> Tambahkan Teman
          </div>
          <div class="btn btn-accept">
            <i class="fa-solid fa-user-check"></i> Terima Permintaan
          </div>
          <div class="btn btn-deny">
            <i class="fa-solid fa-user-xmark"></i> Tolak Permintaan
          </div>
          <div class="btn btn-unfriend">
            <i class="fa-solid fa-user-minus"></i> Hapus Pertemanan
          </div>
          <span><i>Permintaan Pertemanan Terkirim</i></span>
          <div class="btn btn-cancel">
            <i class="fa-solid fa-user-xmark"></i> Batalkan
          </div>
          <div class="btn btn-location">
            <i class="fa-solid fa-location-dot"></i> Share Location
          </div>
        </div>

      </div>
    </div>`;
  }
  writeData() {
    const eimg = this.el.querySelector(".avatar .hero");
    this.user.skin.forEach(skin => {
      const img = new Image();
      img.src = asset[skin].src;
      img.alt = skin;
      eimg.append(img);
    });
    const euname = this.el.querySelector(".user .uname");
    euname.append(this.user.username);
    const euid = this.el.querySelector(".user .userid");
    euid.append(`UID: ${this.user.id}`);
    const ejoined = this.el.querySelector(".time-joined");
    ejoined.append(lang.PROF_JOINED_TIME.replace(/{DATE}/g, sdate.date(this.user.joined)));
    const eachievements = this.el.querySelector(".achievements-count");
    eachievements.append(lang.PROF_ACH_COUNT.replace(/{COUNT}/g, this.user.trophies.length || 0));

    this.renderActions();
  }
  renderActions() {
    this.eactions = document.querySelector('.actions');
    this.eactions.innerHTML = '';
    if(this.user.isFriend) return this.ActionFriend();
    if(this.user.theirReq) return this.ActionRequest();
    if(this.user.myReq) return this.ActionSent();
    return this.ActionNoFriend();
  }
  ActionNoFriend() {
    const btn = document.createElement('div');
    btn.classList.add('btn', 'btn-add');
    btn.innerHTML = `<i class="fa-solid fa-user-plus"></i> ${lang.PROF_ADD}`;
    this.eactions.append(btn);
    btn.onclick = async() => {
      Kaudio.play("sfx", "phone_selected");
      const setreq = await this.ActionXHR('addfriend');
      if(setreq.ok && setreq.data.pass && setreq.data.pass === "acceptfriend") {
        db.friends[setreq.data.user.id] = setreq.data.user;
        if(db.char.requests[setreq.data.user.id]) {
          delete db.char.requests[setreq.data.user.id];
        }
        if(db.unread?.friends[setreq.data.user.id]) {
          delete db.unread.friends[setreq.data.user.id];
        }
      }
      this.renderActions();
    }
  }
  ActionFriend() {
    const btn = document.createElement('div');
    btn.classList.add('btn', 'btn-unfriend');
    btn.innerHTML = `<i class="fa-solid fa-user-minus"></i> ${lang.PROF_UNFRIEND}`;
    this.eactions.append(btn);
    btn.onclick = async() => {
      Kaudio.play("sfx", "phone_selected");
      const setreq = await this.ActionXHR('unfriend', 'PROF_CONF_UNFRIEND');
      if(setreq.ok) {
        if(db.friends[setreq.data.user.id]) {
          delete db.friends[setreq.data.user.id];
        }
      }
      this.renderActions();
    }
  }
  ActionRequest() {
    const btn_a = document.createElement('div');
    btn_a.classList.add('btn', 'btn-accept');
    btn_a.innerHTML = `<i class="fa-solid fa-user-check"></i> ${lang.PROF_ACCEPT}`;
    const btn_b = document.createElement('div');
    btn_b.classList.add('btn', 'btn-decline');
    btn_b.innerHTML = `<i class="fa-solid fa-user-xmark"></i> ${lang.PROF_IGNORE}`;

    this.eactions.append(btn_a, btn_b);
    btn_a.onclick = async() => {
      Kaudio.play("sfx", "phone_selected");
      const setreq = await this.ActionXHR('acceptfriend');
      if(setreq.ok) {
        db.friends[setreq.data.user.id] = setreq.data.user;
        delete db.char.requests[setreq.data.user.id];
        delete db.unread.friends[setreq.data.user.id];
      }
      this.renderActions();
    }
    btn_b.onclick = async() => {
      Kaudio.play("sfx", "phone_selected");
      const setreq = await this.ActionXHR('ignorefriend', 'PROF_CONF_IGNORE');
      if(setreq.ok) {
        delete db.char.requests[setreq.data.user.id];
        delete db.unread.friends[setreq.data.user.id];
      }
      this.renderActions();
    }
  }
  ActionSent() {
    this.eactions.innerHTML = `<span><i>${lang.PROF_WAIT}</i></span>`;
    const btn = document.createElement('div');
    btn.classList.add('btn', 'btn-cancel');
    btn.innerHTML = `<i class="fa-solid fa-user-xmark"></i> ${lang.PROF_CANCEL}`;
    this.eactions.append(btn);
    btn.onclick = async() => {
      Kaudio.play("sfx", "phone_selected");
      await this.ActionXHR('cancelfriend', 'PROF_CONF_CANCEL');
      this.renderActions();
    }
  }
  async ActionXHR(ref, useconfirm = null) {
    if(this.isLocked) return;
    this.isLocked = true;

    if(useconfirm) {
      const isconfirm = await modal.confirm(lang[useconfirm].replace(/{USER}/g, this.user.username));
      if(!isconfirm) {
        this.isLocked = false;
        return {ok:false};
      }
    }

    this.eactions.innerHTML = `<div class="btn">Loading</div>`;
    const setreq = await xhr.post(`/x/profile/${ref}`, {id:this.user.id});
    if(setreq.data?.user) this.user = setreq.data.user;
    this.isLocked = false;
    return setreq;
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.el.remove();
      this.isLocked = false;
      playerState.pmc = this;
      resolve();
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.writeData();
    this.btnListener();
  }
}