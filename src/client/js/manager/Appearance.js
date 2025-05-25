import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import asset from "./asset.js";
import db from "./db.js";
import Kaudio from "./Kaudio.js";
import mapList from "./mapList.js";
import playerState from "./PlayerState.js";

export default class Appearance {
  constructor({ onComplete, map, item_id, classBefore=null } = { onComplete, map, item_id }) {
    this.id = "appearance";
    this.onComplete = onComplete;
    this.map = map;
    this.item_id = item_id;
    this.classBefore = classBefore;
    this.isLocked = false;
    this.skins = null;
    this.chars = {};
    this.spriteRotation = -48;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("CharacterCreation", "appearance");
    this.el.innerHTML = `
    <div class="outer">
      <div class="citizen">
        <div class="citizen-detail">
          <div class="title"><p>LOADING</p></div>
          <div class="avatar">
            <div class="hero">
            </div>
          </div>
          <div class="citizen-actions">
            <button class="left"><i class="fa-solid fa-left"></i></button>
            <button class="right">
              <i class="fa-solid fa-right"></i>
            </button>
          </div>
        </div>
        <div class="citizen-done">
          <div class="btn btn-cancel">${lang.CHAR_APR_CANCEL}</div>
          <div class="btn btn-continue">${lang.CHAR_APR_CONTINUE}</div>
        </div>
      </div>
      <div class="editor">
      </div>
    </div>`;
    this.etitle = this.el.querySelector(".title p");
  }
  applyToChar({k, skin_type, skin_model = 0, imgel, valuep, valuer = null} = {k, skin_type, imgel, valuep}) {
    if(valuer) {
      this.chars[k] = this.skins[k][skin_type][skin_model];
      valuep.innerText = skin_type + 1;
      valuer.innerText = skin_model + 1;
      if(k === "Hairstyles" && skin_type >= 1 && this.chars["Hats"] !== "null") {
        imgel.src = asset[this.skins["Hairstyles"][1][skin_model]].src;
      } else {
        imgel.src = asset[this.skins[k][skin_type][skin_model]].src;
      }
    } else {
      this.chars[k] = this.skins[k][skin_type];
      valuep.innerText = skin_type + 1;
      if(k === "Hats" && this.chars["Hairstyles"] !== "null") {
        const imgHairstyle = this.el.querySelector(".sk-Hairstyles");
        if(skin_type >= 1) {
          const hairColor = this.chars["Hairstyles"].substring((this.chars["Hairstyles"].length - 1), (this.chars["Hairstyles"].length));
          imgHairstyle.src = asset[this.skins["Hairstyles"][1][Number(hairColor) - 1]].src;
        } else {
          imgHairstyle.src = asset[this.chars["Hairstyles"]].src;
        }
      }
      imgel.src = asset[this.skins[k][skin_type]].src;
    }
  }
  applyToSprite() {
    const preview = this.el.querySelectorAll(`.avatar .hero img`);
    preview.forEach((sprite) => {
      sprite.style.transform = `translateX(${this.spriteRotation}px)`;
    });
  }
  cardEditor(k, n = 0) {
    const card = document.createElement("div");
    card.classList.add("field");
    card.innerHTML = `
    <div class="text">${k}</div>
    <div class="actions">
      <div class="act primary">
        <button class="left"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="value">1</div>
        <button class="right"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      ${n ? '<div class="act secondary"><button class="left"><i class="fa-solid fa-chevron-left"></i></button><div class="value">1</div><button class="right"><i class="fa-solid fa-chevron-right"></i></button></div>' : ''}
    </div>`;
    return card;
  }
  async setSkins() {
    const charSkinList = await xhr.get("/json/skins/character_creation_list.json");
    this.skins = charSkinList;
    this.etitle.innerHTML = lang.CHAR_APR_TITLE;
    this.formListener();
  }
  formListener() {
    const eleditor = this.el.querySelector(".outer .editor");
    const charPreview = this.el.querySelector(".avatar .hero");

    if(!db.char.admin || db.char.admin < 7) {
      this.skins.Outfits = this.skins.Outfits.filter(k => {
        return !k.find(skid => skid.includes("Dvnkz"));
      });
    }

    Object.keys(this.skins).forEach((k) => {
      if (typeof this.skins[k][0] === "string") {
        const currIdx = this.skins[k].findIndex(sk => sk === db.char.skinList[k]);
        let skin_type = currIdx < 0 ? 0 : currIdx;
        const card = this.cardEditor(k);

        const btnLeftp = card.querySelector(".primary button.left");
        const btnRightp = card.querySelector(".primary button.right");
        const valuep = card.querySelector(".primary .value");

        const imgel = new Image();
        imgel.alt = skin_type;
        imgel.classList.add("sk-" + k);
        imgel.src = asset[this.skins[k][skin_type]].src;
        imgel.classList.add(k);

        charPreview.append(imgel);
        eleditor.append(card);

        btnLeftp.onclick = () => {
          Kaudio.play("sfx", "pop");
          if (skin_type <= 0) skin_type = this.skins[k].length;
          skin_type--;
          this.applyToChar({k, skin_type, imgel, valuep});
        };

        btnRightp.onclick = () => {
          Kaudio.play("sfx", "pop");
          if (skin_type >= this.skins[k].length - 1) skin_type = -1;
          skin_type++;
          this.applyToChar({k, skin_type, imgel, valuep});
        };
        this.applyToChar({k, skin_type, imgel, valuep});
      } else if (typeof this.skins[k][0] === "object") {

        const curtIdx = this.skins[k].findIndex(sk => sk.find(skx => skx === db.char.skinList[k]));
        const curmIdx = this.skins[k][curtIdx < 0 ? 0 : curtIdx].findIndex(sk => sk === db.char.skinList[k]);

        let skin_type = curtIdx < 0 ? 0 : curtIdx;
        let skin_model = curmIdx < 0 ? 0 : curmIdx;
        const card = this.cardEditor(k, 1);

        const btnLeftp = card.querySelector(".primary button.left");
        const btnRightp = card.querySelector(".primary button.right");
        const valuep = card.querySelector(".primary .value");

        const btnLeftr = card.querySelector(".secondary button.left");
        const btnRightr = card.querySelector(".secondary button.right");
        const valuer = card.querySelector(".secondary .value");

        const imgel = new Image();
        imgel.classList.add("sk-" + k);
        imgel.alt = skin_type;
        imgel.src = asset[this.skins[k][skin_type][skin_model]].src;
        imgel.classList.add(k);

        charPreview.append(imgel);
        eleditor.append(card);

        btnLeftp.onclick = () => {
          Kaudio.play("sfx", "pop");
          if (skin_type <= 0) skin_type = this.skins[k].length;
          skin_model = 0;
          skin_type--;
          this.applyToChar({k, skin_type, skin_model, imgel, valuep, valuer});
        };
        btnRightp.onclick = () => {
          Kaudio.play("sfx", "pop");
          if (skin_type >= this.skins[k].length - 1) skin_type = -1;
          skin_model = 0;
          skin_type++;
          this.applyToChar({k, skin_type, skin_model, imgel, valuep, valuer});
        };
        btnLeftr.onclick = () => {
          Kaudio.play("sfx", "pop");
          if (skin_model <= 0) skin_model = this.skins[k][skin_type].length;
          skin_model--;
          this.applyToChar({k, skin_type, skin_model, imgel, valuep, valuer});
        };
        btnRightr.onclick = () => {
          Kaudio.play("sfx", "pop");
          if (skin_model >= this.skins[k][skin_type].length - 1) skin_model = -1;
          skin_model++;
          this.applyToChar({k, skin_type, skin_model, imgel, valuep, valuer});
        };

        this.applyToChar({k, skin_type, skin_model, imgel, valuep, valuer});
      }
    });

    const rotate_left = this.el.querySelector('.citizen-actions .left');
    const rotate_right = this.el.querySelector('.citizen-actions .right');

    rotate_left.onclick = () => {
      Kaudio.play("sfx", "swipe");
      if (this.spriteRotation >= 0) {
        this.spriteRotation = -48;
      } else {
        this.spriteRotation = this.spriteRotation + 16;
      }
      this.applyToSprite();
    }
    rotate_right.onclick = () => {
      Kaudio.play("sfx", "swipe");
      if (this.spriteRotation <= -48) {
        this.spriteRotation = 0;
      } else {
        this.spriteRotation = this.spriteRotation - 16;
      }
      this.applyToSprite();
    }

    const btnCancel = this.el.querySelector(".btn-cancel");
    btnCancel.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      if(this.isLocked) return;
      this.resumeMap();
      return this.destroy(this.classBefore);
    }

    const btnContinue = this.el.querySelector(".btn-continue");
    btnContinue.onclick = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;
      const confirmEdit = await modal.confirm({
        msg: lang.CHAR_APR_CONFIRM,
        ic: "question",
        okx: lang.CHAR_APR_SUBMIT,
        cancelx: lang.CHAR_APR_RECHECK
      });
      if(!confirmEdit) {
        this.isLocked = false;
        return;
      }
      const data = {};
      data.skin = this.chars;
      data.item_id = this.item_id;
      const saveSkin = await modal.loading(xhr.post("/x/account/update-skin", data));
      if(!saveSkin.ok) {
        await modal.alert(lang[saveSkin.msg] || lang.ERROR);
        this.isLocked = false;
        return;
      }
      Object.keys(saveSkin.data.new_amount).forEach(k => {
        if(!db.char.backpack[k]) db.char.backpack[k] = {};
        db.char.backpack[k].id = saveSkin.data.new_amount[k].id;
        db.char.backpack[k].amount = saveSkin.data.new_amount[k].amount;
      });
      db.char.skinList = saveSkin.data.skinList;
      db.char.skin = saveSkin.data.skin;
      Object.keys(mapList).forEach(k => mapList[k].configObjects.hero.src = db.char.skin);
      this.isLocked = false;
      this.resumeMap();
      await this.destroy();
      const hero = this.map.gameObjects["hero"];
      this.map.startCutscene([
        { type: "changeMap",  map: this.map.mapId, x: hero.x, y: hero.y, direction: hero.direction }
      ]);
    }
  }
  resumeMap() {
    this.map.isPaused = true;
    this.map.isPaused = false;
    this.map.overworld.startGameLoop();
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
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    this.map.isPaused = true;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.setSkins();
  }
}