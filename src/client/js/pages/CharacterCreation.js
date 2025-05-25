import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import asset from "../manager/asset.js";
import cloud from "../manager/cloud.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";
import startGame from "../manager/startGame.js";
import ForceClose from "./ForceClose.js";

export default class CharacterCreation {
  constructor({ skins }) {
    this.chars = {};
    this.skins = skins;
    this.spriteRotation = -48;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("CharacterCreation");
    this.el.innerHTML = `
    <div class="outer">
      <div class="citizen">
        <div class="citizen-detail">
          <div class="title"><p>${lang.CHAR_CREATION_TITLE}</p></div>
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
          <div class="citizen-data">
            <div class="field citizen-username">
              <p><label for="citizen-username">USERNAME</label></p>
              <input type="text" name="citizen-username" id="citizen-username" placeholder="mbakmega420" maxlength="20" autocomplete="off" required />
            </div>
          </div>
        </div>
        <div class="citizen-done">
          <div class="btn btn-continue">${lang.CHAR_CREATION_CONTINUE}</div>
        </div>
      </div>
      <div class="editor">
      </div>
    </div>`;
  }
  formListener() {
    const eleditor = this.el.querySelector(".outer .editor");
    const charPreview = this.el.querySelector(".avatar .hero");

    this.skins.Outfits = this.skins.Outfits.filter(k => {
      return !k.find(skid => skid.includes("Dvnkz"));
    });

    Object.keys(this.skins).forEach((k) => {
      if (typeof this.skins[k][0] === "string") {
        let skin_type = 0;
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
        let skin_type = 0;
        let skin_model = 0;
        const card = this.cardEditor(k, 1);

        const btnLeftp = card.querySelector(".primary button.left");
        const btnRightp = card.querySelector(".primary button.right");
        const valuep = card.querySelector(".primary .value");

        const btnLeftr = card.querySelector(".secondary button.left");
        const btnRightr = card.querySelector(".secondary button.right");
        const valuer = card.querySelector(".secondary .value");

        const imgel = new Image();
        imgel.alt = skin_type;
        imgel.classList.add("sk-" + k);
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

    const euname = this.el.querySelector("#citizen-username");
    const btnContinue = this.el.querySelector(".btn-continue");
    btnContinue.onclick = async e => {
      e.preventDefault();
      Kaudio.play("sfx", "menu_select");
      if(!euname.value || (euname.value && euname.value.trim().length < 1)) {
        return modal.alert(lang.ACC_NO_USERNAME);
      }
      const username = euname.value.trim();
      if(!username.match(/^[A-Za-z0-9_.-]+$/)) {
        return modal.alert(lang.ACC_USERNAME_NOT_VALID);
      }
      if(username.length < 5 || username.length > 20) {
        return modal.alert(lang.ACC_USERNAME_LIMIT);
      }
      const data = {};
      data.username = euname.value.trim();
      data.skin = this.chars;
      const saveChar = await modal.loading(xhr.post("/x/account/save-char", data));
      if(saveChar?.code !== 200) {
        await modal.alert(lang[saveChar.msg]?.replace(/{username}/g, saveChar.data?.username || data.username) || lang.ERROR);
        return;
      }
      const peerConn = await modal.loading(cloud.run(saveChar.data.peer), "CONNECTING");
      if(!peerConn || peerConn.done > 1) {
        return new ForceClose(peerConn.peerError).init();
      }
      await this.destroy();
      startGame(saveChar.data);
    }
    euname.oninput = () => euname.value = euname.value.replace(/\s/g, "");
    euname.onkeydown = e => {
      if(e.keyCode === 13) {
        e.preventDefault();
        btnContinue.click();
      }
    }
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
  async destroy() {
    this.el.classList.add("out");
    await modal.waittime(1000, 5);
    this.chars = {};
    this.el.remove();
  }
  init() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.formListener();
  }
}
