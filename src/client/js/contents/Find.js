import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import asset from "../manager/asset.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";
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

export default class Find {
  constructor({ users, onComplete, classBefore=null } = { users, onComplete }) {
    this.id = "find";
    this.users= users;
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-people");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-users"></i> ${lang.FR_BTN_FIND}</div>
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
        <div class="board">
          <div class="board-list">
          </div>
        </div>
      </div>
    </div>`;
    this.con = this.el.querySelector(".board-list");
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }
  }
  writeData() {
    this.users.forEach(usr => {
      const card = playerCard(usr);
      card.onclick = async() => {
        if(this.isLocked) return;
        Kaudio.play("sfx", "menu_select");
        await this.destroy(new Profile({
          user: usr,
          onComplete: this.onComplete,
          classBefore: this
        }));
      }
      this.con.append(card);
    });
  }
  formListener() {
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
      const playerResult = await modal.loading(xhr.get(`/x/profile/find/${searchUID}?multiple=1`));
      if(!playerResult.ok) {
        await modal.alert(lang[playerResult.msg] || playerResult.msg || lang.ERROR);
        this.isLocked = false;
        return;
      }
      this.isLocked = false;
      if(playerResult.data.users.length > 1) return await this.destroy(new Find({
        users: playerResult.data.users,
        onComplete: this.onComplete,
        classBefore: this.classBefore
      }));
      await this.destroy(new Profile({
        user: playerResult.data.users[0],
        onComplete: this.onComplete,
        classBefore: this
      }))
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
    this.btnListener();
    this.formListener();
    this.writeData();
  }
}