import kchat from "../manager/KChat";
import playerState from "../manager/PlayerState";

class KulonPad {
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("GamePad");
    this.el.innerHTML = `
    <div class="gp-game">
      <div class="gg gp-pause">
        <i class="fa-solid fa-mobile-notch fa-2x"></i>
      </div>
      <div class="gg gp-chat">
        <i class="fa-regular fa-message-lines fa-2x"></i>
      </div>
      <div class="gg gp-eye ar-eye">
        <i class="fa-regular fa-gamepad-modern fa-2x"></i>
      </div>
    </div>
    <div class="gp-arrows">
      <div class="ar"></div>
      <button class="ar ar-gp ar-up"><i class="fa-solid fa-caret-up fa-2x fa-fw"></i></button>
      <div class="ar"></div>
      <button class="ar ar-gp ar-left"><i class="fa-solid fa-caret-left fa-2x fa-fw"></i></button>
      <div class="ar"></div>
      <button class="ar ar-gp ar-right"><i class="fa-solid fa-caret-right fa-2x fa-fw"></i></button>
      <div class="ar"></div>
      <button class="ar ar-gp ar-down"><i class="fa-solid fa-caret-down fa-2x fa-fw"></i></button>
      <div class="ar"></div>
    </div>
    <div class="gp-interact">
      <span class="fa-stack fa-2x">
        <i class="fa-solid fa-circle fa-stack-2x"></i>
        <i class="fa-solid fa-exclamation fa-stack-1x fa-inverse"></i>
      </span>
    </div>
    `;
  }
  phoneListener() {
    const btnPhone = this.el.querySelector(".gp-pause");
    btnPhone.onclick = () => {
      if (!this.map.isCutscenePlaying && !kchat.formOpened) {
        this.map.startCutscene([
          { type: "phone" }
        ]);
      }
    };
  }
  chatListener() {
    const btnChat = this.el.querySelector(".gp-chat");
    btnChat.onclick = () => kchat.open();
  }
  arrowsListener(directionInput) {
    const arrows = {
      btnup: this.el.querySelector(".ar-up"),
      btnleft: this.el.querySelector(".ar-left"),
      btnright: this.el.querySelector(".ar-right"),
      btndown: this.el.querySelector(".ar-down")
    }
    Object.keys(arrows).forEach(k => {
      arrows[k].addEventListener("mousedown", () => {
        directionInput.touchStart(k);
      });
      arrows[k].addEventListener("touchstart", e => {
        e.preventDefault();
        directionInput.touchStart(k);
      }, true);
      arrows[k].addEventListener("touchend", () => {
        directionInput.touchEnd(k);
      });
      arrows[k].addEventListener("mouseup", () => {
        directionInput.touchEnd(k);
      });
      arrows[k].addEventListener("mouseout", () => {
        directionInput.touchEnd(k);
      });
    });
  }
  eyeListener() {
    const btnEye = this.el.querySelector(".ar-eye");
    btnEye.onclick = () => {
      if (!this.map.isCutscenePlaying && !kchat.formOpened) {
        this.map.startCutscene([
          { "type": "textMessage", "who": "Kulon Touch Pad", "text": {
            "id": "Kamu menonaktifkan tombol touchscreen",
            "en": "You disabled the touchscreen buttons"
          } },
          { "type": "textMessage", "who": "Kulon Touch Pad", "text": {
            "id": "Pergi ke menu Pengaturan untuk mengaktifkannya kembali",
            "en": "You can re-enable them on the Setting Menu"
          } },
        ]);
        this.disable();
        playerState.setting["130"] = true;
        this.map.overworld.progress.save();
      }
    }
  }
  interactListener() {
    const btnInteract = this.el.querySelector(".gp-interact");
    btnInteract.onclick = () => {
      if(!kchat.formOpened) {
        this.map.overworld.map.checkForActionCutscene()
      }
    }
  }
  show() {
    if(this.el.classList.contains("hide")) this.el.classList.remove("hide");
  }
  hide() {
    if(!this.el.classList.contains("hide")) this.el.classList.add("hide");
  }
  enable() {
    if(this.el.classList.contains("disabled")) this.el.classList.remove("disabled");
  }
  disable() {
    if(!this.el.classList.contains("disabled")) this.el.classList.add("disabled");
  }
  init(map, directionInput) {
    this.map = map;
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.phoneListener();
    this.chatListener();
    this.arrowsListener(directionInput);
    this.eyeListener();
    this.interactListener();
    if(playerState.setting["130"] === true) this.disable();
  }
}

const kulonpad = new KulonPad();
export default kulonpad;