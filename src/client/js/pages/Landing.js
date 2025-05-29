import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import Preload from "./Preload.js";
import allSkins from "../../../../public/json/skins/skin_list.json";
import allSounds from "../../../../public/json/audio/audio.json";
import ForceClose from "./ForceClose.js";
import * as klang from "../helper/lang.js";

let lang = null;
let auth_container = null;

const urlParams = new URLSearchParams(window.location.search);
const returnPage = urlParams.get("returnPage");
const pageQueries = ["skipSplash=1"];
pageQueries.push("returnPage=" + (returnPage || "app"));
const newQueries = pageQueries.join("&");

let tempPeer = null;

const langlist = [
  { id: "id", label: "Bahasa Indonesia" },
  { id: "en", label: "English" }
]

export default class Landing {
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Auth");
    this.el.innerHTML = `<div class="none"><i class="fa-solid fa-map"></i> <i class="fa-regular fa-map"></i> <i class="fa-light fa-map"></i> <i class="fa-thin fa-map"></i> <i class="fa-duotone fa-solid fa-map"></i> <i class="fa-duotone fa-regular fa-map"></i> <i class="fa-duotone fa-light fa-map"></i> <i class="fa-duotone fa-thin fa-map"></i> <i class="fa-sharp fa-solid fa-map"></i> <i class="fa-brands fa-font-awesome"></i> <i class="fa-sharp fa-regular fa-map"></i> <i class="fa-sharp fa-light fa-map"></i> <i class="fa-sharp fa-thin fa-map"></i> <i class="fa-sharp-duotone fa-solid fa-map"></i> <i class="fa-sharp-duotone fa-regular fa-map"></i> <i class="fa-sharp-duotone fa-light fa-map"></i> <i class="fa-sharp-duotone fa-thin fa-map"></i></div>`;
  }
  async checkUser(currPeer) {
    tempPeer = currPeer;
    await modal.waittime(1000);
    const isUser = await modal.loading(this.loadUser());
    if(!isUser.code) {
      await modal.alert(lang.AUTH_ERR_RTO || "Something when wrong<br/>Try again?");
      return this.checkUser(currPeer);
    }
    if(isUser.code === 403423) {
      return new ForceClose({
        msg_1: "Your account has been suspended due to policy violations",
        msg_2: "Akun kamu telah ditangguhkan karena pelanggaran kebijakan",
        action_text: "HOMEPAGE",
        action_url: "/x/auth/logout"
      }).init();
    }
    if(isUser.code !== 200) {
      this.el.querySelector(".none").remove();
      return this.writeForm();
    }
    this.el.remove();
    return new Preload({ skins: allSkins, sounds: allSounds }).init(tempPeer);
  }
  async loadUser() {
    await klang.klang.load();
    lang = klang.lang;

    const isUser = await xhr.get("/x/auth/isUser");
    return { code: isUser.code /* allSkins */ };
  }
  writeForm() {
    auth_container = this.el;
    new SignEmail().init();
  }
  init(currPeer) {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.checkUser(currPeer);
  }
}

class SignEmail {
  constructor({ email = null } = {}) {
    this.email = email;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement('div');
    this.el.classList.add('box');
    this.el.innerHTML = `
    <div class="top">
      <p>KULON</p>
    </div>
    <form action="/x/auth/sign-in" method="post" class="form" id="sign-in-form">
      <div class="field">
        <div class="btn btn-lang">
          <span>Language</span> <i class="fa-solid fa-chevron-down"></i>
        </div>
      </div>
      <div class="field">
        <div class="labels">
          <label for="email">${lang.AUTH_EMAIL}:</label>
        </div>
        <div class="inp">
          <input type="text" name="email" id="email" autocomplete="email" placeholder="example@example.com" ${this.email ? 'value="' + this.email + '"' : ''} required/>
        </div>
      </div>
      <div class="field">
        <div class="inp">
          <button class="btn btn-login">${lang.AUTH_LOGIN}</button>
        </div>
      </div>
      <div class="field center">
        <div class="txt center">atau</div>
      </div>
      <div class="field">
        <div class="inp">
          <a href="/x/auth/google?${newQueries}" class="btn btn-google">
            <i class="fa-brands fa-google"></i> Google Login
          </a>
        </div>
        <div class="inp">
          <a href="/x/auth/github?${newQueries}" class="btn btn-github">
            <i class="fa-brands fa-github"></i> GitHub Login
          </a>
        </div>
        <div class="inp">
          <a href="/x/auth/discord?${newQueries}" class="btn btn-discord">
            <i class="fa-brands fa-discord"></i> Discord Login
          </a>
        </div>
      </div>
      <div class="field center">
        <div class="txt center"><p>${lang.AUTH_NOTICE}</p></div>
      </div>
    </form>`;
  }
  formListener() {
    const form = this.el.querySelector("#sign-in-form");
    const btnLang = this.el.querySelector(".btn-lang");
    btnLang.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const newLang = await modal.select({
        ic: "language",
        msg: "Choose Language",
        opt: {
          name: "languages",
          items: langlist.map(itm => {
            return {...itm, actived: (itm.id === klang.klang.currLang) ? true : false}
          })
        }
      });
      if(!newLang || newLang === klang.klang.currLang) {
        this.isLocked = false;
        return;
      }
      const formData = new FormData(form);
      formData.forEach((val, _) => this.email = val);
      klang.klang.currLang = newLang;
      klang.klang.save();
      await modal.loading(klang.klang.load());
      lang = klang.lang;
      this.isLocked = false;
      await this.destroy();
      new SignEmail({ email:this.email }).init();
    }
    form.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      this.isLocked = true;
      const data = {};
      const formData = new FormData(form);
      formData.forEach((val, k) => data[k] = val);
      const userLogin = await modal.loading(xhr.post("/x/auth/sign-in", data));
      if(!userLogin.ok) {
        await modal.alert(lang[userLogin.msg] || lang.ERROR);
        this.isLocked = false;
        return;
      }
      this.isLocked = false;
      await this.destroy();
      new SignCode({ email: userLogin.data.email }).init();
    }
  }
  destroy() {
    return new Promise(async resolve => {
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.isLocked = false;
      this.el.remove();
      resolve();
    });
  }
  init() {
    this.createElement();
    auth_container.append(this.el);
    this.formListener();
  }
}

class SignCode {
  constructor({ email = null } = {}) {
    this.email = email;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement('div');
    this.el.classList.add('box');
    this.el.innerHTML = `
    <div class="top">
      <p>KULON</p>
    </div>
    <form action="/x/auth/verify" method="post" class="form" id="verify-form">
      <div class="field">
        <div class="btn btn-lang">
          <span>Language</span> <i class="fa-solid fa-chevron-down"></i>
        </div>
      </div>
      <div class="field">
        <div class="labels">
          <label for="email">${lang.AUTH_EMAIL}:</label>
        </div>
        <div class="inp">
          <input type="text" name="email" id="email" autocomplete="email" placeholder="example@example.com" ${this.email ? 'value="' + this.email + '"' : ''} readonly required />
        </div>
      </div>
      <div class="field">
        <div class="labels">
          <label for="code">${lang.AUTH_OTP_CODE}:</label>
        </div>
        <div class="inp">
          <input type="number" class="otp" name="code" id="code" autocomplete="off" placeholder="-------" required/>
        </div>
        <div class="sm">
          <i>${lang.AUTH_VERIFICATION_OTP}</i>
        </div>
      </div>
      <div class="field">
        <div class="inp">
          <button class="btn btn-login">${lang.AUTH_VERIFY}</button>
        </div>
      </div>
      <div class="field">
        <div class="txt center"><div class="btn btn-headback center">${lang.AUTH_HEADBACK_TXT}</div></div>
      </div>
    </form>`;
  }
  formListener() {
    const btnLang = this.el.querySelector(".btn-lang");
    btnLang.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const newLang = await modal.select({
        ic: "language",
        msg: "Language",
        opt: {
          name: "languages",
          items: langlist.map(itm => {
            return {...itm, actived: (itm.id === klang.klang.currLang) ? true : false}
          })
        }
      });
      if(!newLang || newLang === klang.klang.currLang) {
        this.isLocked = false;
        return;
      }
      klang.klang.currLang = newLang;
      klang.klang.save();
      await modal.loading(klang.klang.load());
      lang = klang.lang;
      this.isLocked = false;
      await this.destroy();
      new SignCode({ email:this.email }).init();
    }
    const btnHeadback = this.el.querySelector(".btn-headback");
    btnHeadback.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const confBack = await modal.confirm(lang.AUTH_HEADBACK);
      if(!confBack) {
        this.isLocked = false;
        return;
      }
      this.isLocked = false;
      await this.destroy();
      new SignEmail({ email:this.email }).init();
    }
    const form = this.el.querySelector("#verify-form");
    form.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      this.isLocked = true;
      const data = {};
      const formData = new FormData(form);
      formData.forEach((val, k) => data[k] = val);
      const userLogin = await modal.loading(xhr.post("/x/auth/verify", data));
      if(userLogin?.code === 403423) {
        this.isLocked = false;
        await this.destroy();
        auth_container.remove();
        return new ForceClose({
          msg_1: "Your account has been suspended due to policy violations",
          msg_2: "Akun kamu telah ditangguhkan karena pelanggaran kebijakan",
          action_text: "HOMEPAGE",
          action_url: "/x/auth/logout"
        }).init();
      }
      if(!userLogin.ok) {
        await modal.alert(lang[userLogin.msg] || lang.ERROR);
        this.isLocked = false;
        return;
      }
      if(returnPage) {
        this.isLocked = true;
        await this.destroy();
        auth_container.remove();
        window.location.href = "/" + returnPage;
      }
      this.isLocked = false;
      await this.destroy();
      auth_container.remove();
      return new Preload({ skins: allSkins, sounds: allSounds }).init(tempPeer);
    }
  }
  destroy() {
    return new Promise(async resolve => {
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.isLocked = false;
      this.el.remove();
      resolve();
    });
  }
  init() {
    this.createElement();
    auth_container.append(this.el);
    this.formListener();
  }
}