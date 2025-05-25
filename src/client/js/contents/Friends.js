import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import asset from "../manager/asset.js";
import db from "../manager/db.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";
import Find from "./Find.js";
import Profile from "./Profile.js";

function playerCard(usr) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.setAttribute("x-uid", usr.id);
  card.innerHTML = `
  <div class="avatar">
    <div class="hero"></div>
  </div>
  <div class="uname">${usr.username}</div>`;
  const eskin = card.querySelector(".hero");
  usr.skin.forEach(sk => {
    const img = new Image();
    img.src = asset[sk].src;
    img.alt = sk;
    eskin.append(img);
  });
  return card;
}

export default class Friends {
  constructor({onComplete, classBefore=null} = {onComplete}) {
    this.id = "friends";
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
    this.reqlist = [];
    this.friendlist = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-friends");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-address-book"></i> ${lang.PHONE_FRIENDS}</div>
          <div class="desc">${Object.keys(db.friends || {}).length}/50</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="search">
          <form class="inp" action="/x/profile/find" method="get" id="player-search">
            <input type="text" name="find_friend" id="find_friend" autocomplete="off" placeholder="${lang.FR_INP_PLC}" />
            <button type="submit">${lang.FR_BTN_FIND}</button>
          </form>
        </div>
        <div class="field">
          <div class="board board-friends">
            <div class="board-title">${lang.FW_FRIENDS_LIST}</div>
            <div class="board-list"></div>
          </div>
          <div class="board board-reqs">
            <div class="board-title">${lang.FW_FRIENDS_REQS}</div>
            <div class="board-list"></div>
          </div>
        </div>
      </div>
    </div>`;
    this.ereq = this.el.querySelector(".board-reqs .board-list");
    this.efriends = this.el.querySelector(".board-friends .board-list");
  }
  writeReqData(id_removed = null) {
    if(id_removed) {
      const onReqList = this.reqlist.includes(id_removed);
      if(onReqList) this.reqlist = this.reqlist.filter(k => k !== id_removed);
      const card_to_remove = this.ereq.querySelector(`.card[x-uid="${id_removed}"]`);
      if(card_to_remove) card_to_remove.remove();
    }
    const reqs = Object.values(db.char.requests || {});
    const nrl = reqs.filter(k => !this.reqlist.includes(k.id));
    nrl.forEach(usr => {
      this.reqlist.push(usr.id);
      const card = playerCard(usr);
      card.onclick = () => {
        Kaudio.play("sfx", "menu_select");
        return this.searchXHR(usr.id);
      }
      this.ereq.append(card);
    });
  }
  writeFriendData(id_removed = null) {
    if(id_removed) {
      const onFriendList = this.friendlist.includes(id_removed);
      if(onFriendList) this.friendlist = this.friendlist.filter(k => k !== id_removed);
      const card_to_remove = this.efriends.querySelector(`.card[x-uid="${id_removed}"]`);
      if(card_to_remove) card_to_remove.remove();
    }
    const fr = Object.values(db.friends || {});
    const nfl = fr.filter(k => !this.friendlist.includes(k.id));
    nfl.forEach(usr => {
      this.friendlist.push(usr.id);
      const card = playerCard(usr);
      card.onclick = () => {
        Kaudio.play("sfx", "menu_select");
        return this.searchXHR(usr.id);
      }
      this.efriends.append(card);
    });
  }
  async btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }

    const inp = this.el.querySelector("#find_friend");

    const playerSearch = this.el.querySelector("#player-search");
    playerSearch.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;
      const searchUID = inp.value.replace(/\s/g, '');
      if(searchUID.length < 1) {
        this.isLocked = false;
        return;
      }
      if(searchUID.length < 4) {
        await modal.alert(lang.FR_MIN);
        this.isLocked = false;
        return;
      }
      if(searchUID.length > 40) {
        await modal.alert(lang.FR_MAX);
        this.isLocked = false;
        return;
      }
      return this.searchXHR(searchUID, 1);
    }

    await modal.waittime(750);
    inp.readOnly = true;
    inp.focus();
    inp.readOnly = false;
  }
  async searchXHR(searchUID, isMany=0) {
    const playerResult = await modal.loading(xhr.get(`/x/profile/find/${searchUID}?multiple=${isMany}`));
    if(!playerResult.ok) {
      await modal.alert(lang[playerResult.msg] || playerResult.msg || lang.ERROR);
      this.isLocked = false;
      return;
    }
    this.isLocked = false;
    if(playerResult.data.users.length > 1) return await this.destroy(new Find({
      users: playerResult.data.users,
      onComplete: this.onComplete,
      classBefore: this
    }));
    await this.destroy(new Profile({
      user: playerResult.data.users[0],
      onComplete: this.onComplete,
      classBefore: this
    }))
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.el.remove();
      this.reqlist = [];
      this.friendlist = [];
      this.isLocked = false;
      playerState.pmc = null;
      resolve();
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.writeReqData();
    this.writeFriendData();
    this.btnListener();
  }
}