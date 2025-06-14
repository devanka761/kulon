import { lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import asset from "../manager/asset.js";
import cloud from "../manager/cloud.js";
import Kaudio from "../manager/Kaudio.js";
import LoadAssets from "../manager/LoadAssets.js";
import SetNextMap from "../manager/SetNextMaps.js";
import startGame from "../manager/startGame.js";
import CharacterCreation from "./CharacterCreation.js";
import ForceClose from "./ForceClose.js";

export default class Preload {
  constructor({ skins, sounds }) {
    this.skins = skins;
    this.sounds = sounds;
    this.assets = [];
    this.assetsToLoad = 0;
    this.assetsLoaded = 0;
    this.allAssets = 0;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Preload");
    this.el.innerHTML = `
    <div class="box">
      <div class="title">
        <img src="./images/Kulon.png" alt="kulon" width="200"/>
      </div>
    </div>
    <div class="assetload-action">
      <div class="btn-start center fa-fade">-- ${lang.TS_START} --</div>
    </div>`;
  }
  btnListener(tempPeer) {
    if(tempPeer) {
      tempPeer.destroy();
      tempPeer.disconnect();
      tempPeer = null;
    }
    const ebox = this.el.querySelector(".box");
    const btnLoad = this.el.querySelector(".assetload-action");
    btnLoad.onclick = () => {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen().catch(() => {});;
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen().catch(() => {});;
      }
      btnLoad.remove();
      const eloadel = document.createElement("div");
      eloadel.classList.add("assets-load");
      eloadel.innerHTML = `
      <div class="info">
        <span>${lang.LOADING}</span>
        <span class="status"></span>
      </div>
      <div class="loader">
        <div class="inner-loader"></div>
      </div>`;
      ebox.append(eloadel);
      this.loadPrepare();
    }
  }
  async loadPrepare() {
    this.assets = this.readSkins();

    const assetProgress = {
      text: this.el.querySelector('.assets-load .info .status'),
      bar: this.el.querySelector('.assets-load .loader .inner-loader')
    };

    this.load(assetProgress, this.el);
  }
  loadDev(_, loadscreen) {
    return this.showDone(loadscreen);
  }
  load(assetProgress, loadscreen) {
    if ( !this.assets || this.assets.length == 0 ) {
      return this.showDone(loadscreen);
    }
    if ( this.assets ) {
      this.assetsToLoad = this.assets.length;
      this.allAssets = this.assets.length;

      for ( let i = 0; i < this.assets.length; i++ ) {
        if(this.assets[i].type === "image") {
          this.beginLoadingImage(
            this.assets[i].id,
            this.assets[i].content,
            assetProgress, loadscreen
          );
        } else if(this.assets[i].type === "audio") {
          this.beginLoadingAudio(
            this.assets[i].id,
            this.assets[i].content,
            assetProgress, loadscreen
          );
        }
      }
    }
  }
  readSkins() {
    const allSkin = [];

    for(const skin of this.skins) {
      allSkin.push({ id: skin.id, content: skin.path, type: "image" });
    }
    for(const sound of this.sounds) {
      allSkin.push({ id: sound.id, content: sound.path, type: "audio" });
    }
    return allSkin;
  }
  launchIfReady(assetProgress, loadscreen, fileID) {
    if(fileID === "null") fileID = "Koruptor";
    this.assetsToLoad--;
    this.assetsLoaded++;

    const currProgress = `${Math.floor((this.assetsLoaded / this.allAssets) * 100)}%`;

    assetProgress.text.innerHTML = `${fileID} - ${currProgress}`;
    assetProgress.bar.style.width = currProgress;

    if (this.assetsToLoad == 0) {
      assetProgress.text.innerHTML = "Koruptor_Suit - 100%";
      this.showDone(loadscreen);
    }
  }
  beginLoadingImage(fileID, fileName, assetProgress, loadscreen) {
    asset[fileID] = new Image();
    asset[fileID].onload = () => this.launchIfReady(assetProgress, loadscreen, fileID);
    asset[fileID].src = fileName;
    // asset[fileID] = {};
    // asset[fileID].src = fileName;
    // this.launchIfReady(assetProgress, loadscreen, fileID);
  }
  beginLoadingAudio(fileID, fileName, assetProgress, loadscreen) {
    asset[fileID] = new Audio();
    asset[fileID].oncanplay = () => this.launchIfReady(assetProgress, loadscreen, "dvnkz_sound_effects");
    asset[fileID].src = fileName;
  }
  async showDone() {
    Kaudio.setTalks();
    Kaudio.play("sfx", "dialogue_end");
    await modal.waittime(2000);
    const eloader = this.el.querySelector(".assets-load");
    eloader.remove();
    const initialSkins = await modal.smloading(xhr.get("/json/assets/st_ehek.json"), "Getting User Ready");
    await modal.smloading(new LoadAssets({ skins: initialSkins }).run(), "Loading Character Data");
    const hasSkin = await modal.smloading(this.readCharSkin(), "Loading User Data");
    if(hasSkin?.code === 4041) {
      Kaudio.play("sfx", "loadPrepare");
      Kaudio.play("bgm", "outside1");
      await this.destroy();
      await modal.alert(lang.ACC_FIRST_SKIN);
      return new CharacterCreation({skins:hasSkin.skins}).init();
    }
    if(hasSkin.code !== 200) {
      await modal.alert({msg:"CONNECTION LOST",okx: "RECONNECT", ic: "wifi-slash"});
      return this.showDone();
    }
    const peerConn = await modal.smloading(cloud.run(hasSkin.data.peer), "Connecting to Server");
    if(!peerConn || peerConn.done > 1) {
      return new ForceClose(peerConn.peerError).init();
    }
    Kaudio.play("sfx", "loadPrepare");
    await this.destroy();
    startGame(hasSkin.data);
  }
  async readCharSkin() {
    const nextMap = await xhr.get(`/json/maps/mp_ehek.json`);
    SetNextMap(nextMap);
    const hasSkin = await xhr.get("/x/account/skin");
    if(hasSkin.code !== 200) {;
      const charSkinList = await xhr.get("/json/skins/character_creation_list.json");
      return { code:hasSkin.code, skins:charSkinList };
    }
    return hasSkin;
  }
  destroy() {
    return new Promise(async resolve => {
      this.el.classList.add("out");
      await modal.waittime(1000, 5);
      this.el.remove();
      resolve();
    });
  }
  init(tempPeer) {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.btnListener(tempPeer);
  }
}