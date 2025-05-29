import bigDB from "../../../../dist/db/v.json";
import { lang } from "../helper/lang.js";
import utils from "../main/utils.js";
import ClientData from "../manager/clientData.js";
import cloud from "../manager/cloud.js";
import db from "../manager/db.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";
import Setting from "../manager/Setting.js";

export default class TitleScreen {
  constructor({map, onComplete}) {
    this.id = "titleScreen";
    this.map = map;
    this.onComplete = onComplete;
    this.disbutton = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("TitleScreen");
    this.el.innerHTML = `
    <div class="copyright">
      <p><i class="fa-sharp fa-solid fa-copyright"></i> ${new Date().getFullYear().toString()} DEVANKA761</p>
      <p>KULON V1.0.${bigDB.version}-ALPHA</p>
    </div>
    <div class="main-menu">
      <div class="game-title">
        <div class="logo">
          <img src="/images/Kulon_Hero_Normal.png" alt="dvnkz icon" width="125" />
        </div>
      </div>
      <div class="menus">
        <div class="btn btn-start">${lang.TS_START}</div>
        <div class="btn btn-setting">${lang.TS_SETTING}</div>
        <a class="btn btn-editor" href="/editor?skipSplash=1">MAP EDITOR</a>
      </div>
    </div>
    <div class="user">
      <p>${lang.TS_WELCOME},</p>
      <p data-username="titlescreen">@{username}</p>
    </div>`;
    this.canvas = document.querySelector(".canvas");
    this.canvas.classList.add("title-screen");

    this.ecopyright = this.el.querySelector(".copyright");
    this.emenu = this.el.querySelector(".main-menu");
    this.ewelcome = this.el.querySelector(".user");
    this.euser = this.el.querySelector("[data-username]");
    this.euser.innerText = db.char.username;
  }
  async clickListener() {
    await utils.wait(100);
    this.map.isPaused = true;
    const btnStart = this.el.querySelector('.btn-start');
    const btnSetting = this.el.querySelector('.btn-setting');
    btnStart.onclick = async() => {
      if(this.disbutton === true) return;
      Kaudio.play("sfx", "menu_select");
      setTimeout(() => {
        Kaudio.play("sfx", "loadbanner");
      }, 100);
      this.disbutton = true;
      this.map.isPaused = true;
      this.map.isPaused = false;
      this.map.overworld.startGameLoop();
      await this.destroy();
      Object.keys(db.char).forEach(k => {
        const clientData = new ClientData({ id: k });
        clientData.init(db.char[k]);
      });
      db.char.mapId = "kulonSafeHouse";
      const initialFriendsPeers = Object.values(db.friends || {}).filter(usr => usr.peer).map(usr => usr.peer);
      cloud.send({ id: "im_online", to: initialFriendsPeers });
    }
    btnSetting.onclick = () => {
      if(this.disbutton) return;
      Kaudio.play("sfx", "phone_selected");
      const setting = new Setting({onComplete:this.onComplete, map:this.map, classBefore:this});
      this.destroy(setting);
    }
  }
  eachDestroy() {
    return new Promise(async resolve => {
      this.emenu.classList.add('out');
      this.ecopyright.classList.add('out');
      this.ewelcome.classList.add('out');
      await utils.wait(900);
      this.emenu.remove();
      this.ecopyright.remove();
      this.ewelcome.remove();
      resolve();
    });
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(!next) {
        await this.eachDestroy();
        this.canvas.classList.add('out');
        this.el.classList.add('out');
        await utils.wait(1995);
        this.canvas.classList.remove('title-screen', 'out');
        this.el.remove();
        playerState.pmc = null;
        this.onComplete();
        this.disbutton = false;
        return resolve();
      }
      this.el.classList.add('out');
      await utils.wait(995);
      this.el.remove();
      playerState.pmc = null;
      this.disbutton = false;
      resolve();
      next.init();
    });
  }
  async init() {
    playerState.pmc = this;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.clickListener();
  }
}