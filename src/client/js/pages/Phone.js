import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import { copyToClipboard } from "../helper/navigators.js";
import notip from "../helper/notip.js";
import KeyPressListener from "../main/KeyPressListener.js";
import asset from "../manager/asset.js";
import db from "../manager/db.js";
import Kaudio from "../manager/Kaudio.js";
import phonelist from "../manager/phonelist.js";
import playerState from "../manager/PlayerState.js";

function posCard(s) {
  const card = document.createElement("div");
  card.classList.add("u");
  card.innerHTML = `
  <div class="avatar"><div class="hero"></div></div>
  <div class="m">${(s.id === db.char.id ? db.char.mapId : db.job.map[s.id]).replace("kulon", "").replaceAll("_", "")}</div>`;
  const eskin = card.querySelector(".avatar .hero");
  s.skin.forEach(sk => {
    const img = new Image();
    img.src = asset[sk].src;
    img.alt = sk;
    eskin.append(img);
  });
  return card;
}

export default class Phone {
  constructor({onComplete, map}) {
    this.onComplete = onComplete;
    this.map = map;
    this.id = 'phone';
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Phone");
    this.el.innerHTML = `
    <div class="profile">
      <div class="detail">
        <div class="avatar">
          <div class="hero"></div>
        </div>
        <div class="user">
          <div class="username"></div>
          <div class="userid">
            <div class="uid"></div>
            <div class="btn btn-copy"><i class="fa-solid fa-copy"></i></div>
          </div>
        </div>
      </div>
      <div class="btn btn-close">
        <i class="fa-solid fa-x"></i>
      </div>
    </div>
    <div class="apps">
      <div class="list">
        <div class="btn">
          <div class="ic"><i class="fa-duotone fa-address-book"></i></div>
          <div class="name">Teman</div>
        </div>
        <div class="btn">
          <div class="ic"><i class="fa-duotone fa-briefcase"></i></div>
          <div class="name">Job</div>
        </div>
        <div class="btn">
          <div class="ic"><i class="fa-duotone fa-people-group"></i></div>
          <div class="name">Tim</div>
        </div>
        <div class="btn b-shop">
          <div class="ic"><i class="fa-duotone fa-shopping-bag"></i></div>
          <div class="name">Toko</div>
        </div>
        <div class="btn b-trophies">
          <div class="ic"><i class="fa-duotone fa-trophy-star"></i></div>
          <div class="name">Pencapaian</div>
        </div>
        <div class="btn">
          <div class="ic"><i class="fa-duotone fa-backpack"></i></div>
          <div class="name">Inventory</div>
        </div>
        <div class="btn">
          <div class="ic"><i class="fa-duotone fa-envelope"></i></div>
          <div class="name">Surat</div>
        </div>
        <div class="btn">
          <div class="ic"><i class="fa-duotone fa-circle-user"></i></div>
          <div class="name">Akun</div>
        </div>
        <div class="btn">
          <div class="ic"><i class="fa-duotone fa-gear"></i></div>
          <div class="name">Pengaturan</div>
        </div>
      </div>
    </div>`;
    const euname = this.el.querySelector(".profile .detail .user .username");
    const euserid = this.el.querySelector(".profile .detail .user .userid .uid");
    const eskin = this.el.querySelector(".profile .detail .avatar .hero");

    euname.append(db.char.username);
    this.btnRename = document.createElement("i");
    this.btnRename.classList.add("fa-duotone", "fa-pen-to-square", "btn-rename");
    euname.append(this.btnRename);
    euserid.append(`UID: ${db.char.id}`);

    db.char.skin.forEach(skin => {
      const img = new Image();
      img.alt = skin;
      img.src = asset[skin].src;
      eskin.append(img);
    });
  }
  btnListener() {
    const btnClose = this.el.querySelector(".profile .btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "phone_closed");
      this.destroy();
    }
    this.btnRename.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "phone_selected");
      this.isLocked = true;
      const nextHelp1 = await modal.confirm({
        msg: lang.ACC_PHONE_USERNAME_HELP_1,ic:"circle-info",
        okx: lang.ACC_PHONE_USERNAME_OK_1,
        cancelx: lang.ACC_PHONE_USERNAME_CANCEL
      });
      if(!nextHelp1) {
        this.isLocked = false;
        return;
      }
      const nextHelp2 = await modal.confirm({
        msg: lang.ACC_PHONE_USERNAME_HELP_2,ic:"circle-info",
        okx: lang.ACC_PHONE_USERNAME_OK_2,
        cancelx: lang.ACC_PHONE_USERNAME_CANCEL
      });
      if(!nextHelp2) {
        this.isLocked = false;
        return;
      }
      await modal.alert({msg:lang.ACC_PHONE_USERNAME_HELP_3,ic:"circle-info"});
      this.isLocked = false;
    }
    const btnUID = this.el.querySelector(".profile .detail .user .userid .btn-copy");
    btnUID.onclick = async() => {
      Kaudio.play("sfx", "menu_select");
      const copiedText = await copyToClipboard(db.char.id);
      if(copiedText.ok) {
        const copySuccess = lang.COPY_TEXT;
        btnUID.innerHTML = "<i class=\"fa-solid fa-check\"></i>"
        setTimeout(() => btnUID.innerHTML = "<i class=\"fa-solid fa-copy\"></i>", 500);
        notip({
          a: copySuccess,
          b: db.char.id,
          ic: "clipboard-check",
          c: 1
        });
      } else {
        await modal.alert('No Permission');
      }
    }
  }
  writeApps() {
    const eapplist = this.el.querySelector(".apps .list");
    eapplist.innerHTML = '';
    const applist = phonelist.filter(k => k.g.includes(db.onduty) || (k.g.includes(761) && db.char.admin));
    applist.forEach(k => {
      const card = document.createElement("div");
      card.classList.add("btn");
      if(k.cl) card.classList.add("b-custom", k.cl[db.onduty]);
      if(db.unread[k.id]) {
        const hasUnread = Object.keys(db.unread[k.id]).length;
        if(hasUnread >= 1) card.classList.add("unread");
      }
      card.innerHTML = `<div class="ic"><i class="${k.ic}"></i></div><div class="name">${lang[k.n]}</div>`;
      eapplist.append(card);
      card.onclick = async() => {
        Kaudio.play("sfx", "phone_selected");
        await this.destroy(true);
        k.r({onComplete: this.onComplete, map: this.map, classBefore: this});
      }
    });
  }
  createPos() {
    this.pos = document.createElement("div");
    this.pos.classList.add("Pos");
  }
  updatePos() {
    while (this.pos.lastChild) {
      this.pos.lastChild.remove();
    }
    (db.job?.onduty || [db.char.id]).forEach(k => {
      const userData = k === db.char.id ? db.char : db.job.players[k];
      this.pos.append(posCard(userData));
    });
  }
  async destroy(condition) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.el.classList.add('out');
      this.pos.classList.add('out');
      await modal.waittime(500, 5);
      this.esc?.unbind();
      this.p?.unbind();
      this.el.remove();
      this.pos.remove();
      this.isLocked = false;
      playerState.pmc = null;
      if(!condition) this.onComplete();
      resolve();
    })
  }
  async init() {
    playerState.pmc = this;
    this.createElement();
    this.createPos();
    this.updatePos();
    document.querySelector(".app").append(this.el, this.pos);
    this.writeApps();
    this.btnListener();
    await modal.waittime(500);
    this.esc = new KeyPressListener("p", () => {
      Kaudio.play("sfx", "phone_closed");
      this.destroy();
    });
    this.p = new KeyPressListener("escape", () => {
      Kaudio.play("sfx", "phone_closed");
      this.destroy();
    });
  }
}