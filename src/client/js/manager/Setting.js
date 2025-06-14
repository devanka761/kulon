import setting_list from "../../../../public/json/main/settings.json";
import { klang, lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import kulonpad from "../mobile/KulonPad.js";
import Kaudio from "./Kaudio.js";
import playerState from "./PlayerState.js";

function itemParent() {
  const card = document.createElement("div");
  card.classList.add("item");
  return card;
}

const itemCard = {
  string(s) {
    const card = itemParent();
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[klang.currLang]}</p>
    </div>
    <div class="item-value">
      <span class="btn-string string">${s.default}</span>
    </div>`
    return card;
  },
  boolean(s) {
    const card = itemParent();
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[klang.currLang]}</p>
    </div>
    <div class="item-value">
      <input type="checkbox" name="${s.id}" id="${s.id}" />
    </div>`;
    const inp = card.querySelector("input");
    if(s.default) {
      if(!playerState.setting[s.id]) inp.checked = true;
    } else {
      if(playerState.setting[s.id]) inp.checked = true;
    }
    return card;
  },
  option(s) {
    const card = itemParent();
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name[klang.currLang]}</p>
    </div>
    <div class="item-value">
      <select name="lang" id="lang">
      </select>
    </div>`;
    const eselect = card.querySelector("#lang");
    s.list.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option.id;
      opt.innerHTML = option.label;
      eselect.append(opt);
    });
    return card;
  },
  text(s) {
    const card = itemParent();
    card.innerHTML = `
    <div class="item-title">
      <p>${s.bold ? "<b>" : ""}${s.name[klang.currLang]}${s.bold ? "</b>" : ""}</p>
    </div>`;
    return card;
  },
  func(s) {
    const card = itemParent();
    card.innerHTML = `
    <div class="item-title">
      <p>${s.name?.[klang.currLang] || ""}</p>
    </div>
    <div class="item-value">
      <div class="btn btn-${s.id}${s.cl ? " " + s.cl : " b"}">${s.value[klang.currLang]}</div>
    </div>`;
    return card;
  }
}

export default class Setting {
  constructor({onComplete, map, classBefore=null, page=null} = {onComplete, map}) {
    this.id = "setting";
    this.map = map;
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
    this.page = page || "1";
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Setting");
    this.el.innerHTML = `
    <div class="box">
      <div class="top">
        <div class="menus">
        </div>
        <div class="actions">
          <div class="btn-close"><i class="fa-solid fa-x"></i></div>
        </div>
      </div>
      <div class="bottom">
      </div>
    </div>`;
    this.ebottom = this.el.querySelector(".bottom");
    this.menus = this.el.querySelector(".menus");
  }
  selectedBtn() {
    return this.menus.querySelectorAll(".btn.selected");
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy();
    }

    setting_list.groups.forEach(itm => {
      const card = document.createElement("div");
      card.classList.add("btn");
      if(itm.id === this.page) card.classList.add("selected");
      card.innerHTML = itm.name[klang.currLang];
      this.menus.append(card);
      card.onclick = () => {
        if(itm.id === this.page) return;
        Kaudio.play("sfx", "menu_select");
        this.page = itm.id;
        this.selectedBtn().forEach(oldbtn => oldbtn.classList.remove("selected"));
        card.classList.add("selected");
        this.writeList();
      }
    });
  }
  writeList() {
    const listBefore = this.el.querySelector(".list");
    if(listBefore) listBefore.remove();
    const list = document.createElement("div");
    list.classList.add("list");
    const items = setting_list.items.filter(itm => itm.group === this.page);
    items.forEach(itm => {
      const card = itemCard[itm.type](itm);
      list.append(card);
      if(itm.uniq) return this[itm.uniq](card, itm);
      if(itm.type === "boolean") return this.writeCheckBox(card, itm);
      if(itm.type === "string") return this.writeString(card);
    });
    this.ebottom.append(list);
  }
  writeString(card) {
    const btnString = card.querySelector(".btn-string");
    btnString.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      await modal.alert(lang.ST_NOT_READY);
      this.isLocked = false;
    }
  }
  writeRestoreDefault(card) {
    const btnRestore = card.querySelector(".btn");
    btnRestore.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      await modal.alert(lang.ST_NOT_READY);
      this.isLocked = false;
    }
  }
  writeCheckBox(card, s) {
    const inp = card.querySelector("input");
    inp.onchange = () => {
      const boolStatus = s.default ? inp.checked !== true : inp.checked === true;
      playerState.setting[s.id] = boolStatus;
      if(!boolStatus) delete playerState.setting[s.id];
      this.map.overworld.progress.save();
      if(!boolStatus) {
        Kaudio.play("sfx", "phone_selected");
      } else {
        Kaudio.play("sfx", "phone_closed");
      }
    }
  }
  writeLogout(card) {
    const btnLogout = card.querySelector(".btn");
    btnLogout.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const confLogout = await modal.confirm(lang.ST_TXT_LOGOUT);
      if(!confLogout) {
        this.isLocked = false;
        return;
      }
      await modal.loading(xhr.get("/x/auth/logout"), "LOGGING OUT");
      this.isLocked = false;
      window.location.href = "/x/auth/logout";
    }
  }
  writeLanguage(card) {
    const eselect = card.querySelector("#lang");
    eselect.onchange = async() => {
      if(this.isLocked) return;
      if(!eselect.value || eselect.value === "null" || eselect.value === klang.currLang) return;
      this.isLocked = true;
      klang.currLang = eselect.value;
      klang.save();
      document.documentElement.setAttribute("lang", eselect.value);
      document.documentElement.lang = eselect.value;
      await modal.loading(klang.load());
      this.isLocked = false;
      const updateSetting = new Setting({
        onComplete:this.onComplete, map:this.map, classBefore:this.classBefore, page: this.page
      });
      await this.destroy(updateSetting);
    }
  }
  writeTouchPad(card, s) {
    const inp = card.querySelector("input");
    inp.onchange = () => {
      const boolStatus = s.default ? inp.checked !== true : inp.checked === true;
      playerState.setting[s.id] = boolStatus;
      if(!boolStatus) delete playerState.setting[s.id];
      this.map.overworld.progress.save();
      if(!boolStatus) {
        kulonpad.enable();
        Kaudio.play("sfx", "phone_selected");
      } else {
        kulonpad.disable();
        Kaudio.play("sfx", "phone_closed");
      }
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
      playerState.pmc = null;
      resolve();
      if(next) return next.init();
      if(!this.classBefore) return this.onComplete();
      this.classBefore.init();
    });
  }
  init() {
    playerState.pmc = this;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.btnListener();
    this.writeList();
  }
}