import playerState from "../manager/PlayerState.js";
import appConfig from "../../../server/config.json";

const dinamicFlags = ["PLAN_INTRODUCTION","GAME_MANUALS"];

export default class Progress {
  constructor() {
    this.mapId = "kulonSafeHouse";
    this.startingHeroX = 48;
    this.startingHeroY = 96;
    this.saveVersion = appConfig.saveVersion;
    this.startingHeroDirection = "down";
    this.saveFileKey = "Koelon_LocalSave";
  }
  save() {
    const saveData = {
      mapId: this.mapId,
      startingHeroX: this.startingHeroX,
      startingHeroY: this.startingHeroY,
      startingHeroDirection: this.startingHeroDirection,
      saveVersion: this.saveVersion,
      playerState: {
        pizzas: playerState.pizzas,
        lineup: playerState.lineup,
        items: playerState.items,
        localFlags: {},
        setting: playerState.setting
      }
    }
    Object.keys(playerState.localFlags).forEach(k => {
      if(dinamicFlags.includes(k)) saveData.playerState.localFlags[k] = playerState.localFlags[k];
    });
    window.localStorage.setItem(this.saveFileKey, JSON.stringify(saveData));
  }
  getSaveFile() {
    if (!window.localStorage) return null;
    const file = window.localStorage.getItem(this.saveFileKey);
    return file ? JSON.parse(file) : null
  }
  load() {
    const file = this.getSaveFile();
    if (file) {
      if(file.saveVersion && file.saveVersion !== this.saveVersion) return;
      this.mapId = file.mapId;
      this.startingHeroX = file.startingHeroX;
      this.startingHeroY = file.startingHeroY;
      this.startingHeroDirection = file.startingHeroDirection;
      Object.keys(file.playerState).forEach(key => {
        playerState[key] = file.playerState[key];
      })
    }
  }
}