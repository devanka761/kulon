import asset from "./asset.js";

let BGM = null;
let SFX = null;
let NFX1 = null;
let NFX2 = null;
let NFX3 = null;
const TALKS = new Audio();
TALKS.onended = () => TALKS.currentTime = 0;
const TALKE = new Audio();

class Kaudio {
  bgm(audioId, isLooping) {
    if(BGM) {
      BGM.pause();
      BGM.currentTime = 0;
    }
    if(!asset[audioId]) return;
    BGM = asset[audioId];
    if(isLooping) {
      BGM.ontimeupdate = () => {
        if(BGM.currentTime >= (BGM.duration - 0.5)) {
          BGM.currentTime = 0.5;
        }
      }
    }
    BGM.play();
    BGM.volume = 1;
  }
  setTalks() {
    TALKS.src = asset["dialogue_start"].src;
    TALKE.src = asset["dialogue_end"].src;
  }
  talkStart() {
    TALKS.play();
  }
  talkEnd() {
    TALKE.play();
    if(TALKS) TALKS.pause(), TALKS.currentTime = 0;
  }
  sfx(audioId) {
    if(SFX) {
      SFX.pause();
      SFX.currentTime = 0;
    }
    if(!asset[audioId]) return;
    SFX = asset[audioId];
    SFX.play();
  }
  nfx1(audioId) {
    if(NFX1) {
      NFX1.pause();
      NFX1.currentTime = 0;
    }
    if(!asset[audioId]) return;
    NFX1 = asset[audioId];
    NFX1.play();
  }
  nfx2(audioId) {
    if(NFX2) {
      NFX2.pause();
      NFX2.currentTime = 0;
    }
    if(!asset[audioId]) return;
    NFX2 = asset[audioId];
    NFX2.play();
  }
  nfx3(audioId) {
    if(NFX3) {
      NFX3.pause();
      NFX3.currentTime = 0;
    }
    if(!asset[audioId]) return;
    NFX3 = asset[audioId];
    NFX3.play();
  }
  play(audioType=null, audioId=null, isLooping=false) {
    if(!audioId || !audioType) return;
    if(this[audioType]) this[audioType](audioId, isLooping);
  }
  stop(audioType=null) {
    if(audioType === "bgm") {
      BGM.pause();
      BGM.currentTime = 0;
    } else if(audioType === "sfx") {
      SFX.pause();
      SFX.currentTime = 0;
    } else if(audioType === "nfx1") {
      NFX1.pause();
      NFX1.currentTime = 0;
    } else if(audioType === "nfx2") {
      NFX2.pause();
      NFX2.currentTime = 0;
    }
  }
}

export default new Kaudio();