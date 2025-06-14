import Progress from "./Progress.js";
import OverworldMap from "./OverworldMap.js";
import KeyPressListener from "./KeyPressListener.js";
import DirectionInput from "./DirectionInput.js";
import mapList from "../manager/mapList.js";
import db from "../manager/db.js";
import kchat from "../manager/KChat.js";
import utils from "./utils.js";
import playerState from "../manager/PlayerState.js";
import Kaudio from "../manager/Kaudio.js";
import introEvents from "../../../../public/json/main/intro.json";
import kulonpad from "../mobile/KulonPad.js";

export default class Overworld {
 constructor(config) {
   this.element = config.element;
   this.canvas = config.canvas;
   this.ctx = this.canvas.getContext("2d");
   this.map = null;
 }

 async gameLoopStepWork(delta) {
   this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
   if(this.map.overworld) this.map.overworld = this;
   
   const cameraPerson = this.map.gameObjects.hero;
   Object.values(this.map.gameObjects).forEach(object => {
     object.update({
       delta,
       arrow: this.directionInput.direction,
       map: this.map,
     })
   })

   this.map.drawLowerImage(this.ctx, cameraPerson);

   Object.values(this.map.gameObjects).sort((a,b) => {
     return a.y - b.y;
   }).forEach(object => {
     object.sprite.draw(this.ctx, cameraPerson);
   })

   this.map.drawUpperImage(this.ctx, cameraPerson);
 }

  startGameLoop() {
    let previousMs;
    const step = 1 / 60;

    const stepFn = (timestampMs) => {
      if (this.map.isPaused) {
        return;
      }
      if (previousMs === undefined) {
        previousMs = timestampMs;
      }

      let delta = (timestampMs - previousMs) / 1000;
      while (delta >= step) {
        this.gameLoopStepWork(delta);
        delta -= step;
      }
      previousMs = timestampMs - delta * 1000;
      requestAnimationFrame(stepFn)
    }
    requestAnimationFrame(stepFn)
 }

 bindActionInput() {
  new KeyPressListener("e", () => {
    if(!kchat.formOpened) {
      this.map.checkForActionCutscene()
    }
  });
  new KeyPressListener("p", () => {
    if (!this.map.isCutscenePlaying && !kchat.formOpened) {
    this.map.startCutscene([
      { type: "phone" }
    ]);
    }
  });
  new KeyPressListener("t", () => {
    kchat.open();
  });
 }

 bindHeroPositionCheck() {
   document.addEventListener("PersonWalkingComplete", e => {
     if (e.detail.whoId === "hero") {
       this.map.checkForFootstepCutscene()
     }
   })
 }

 async startMap(mapConfig, heroInitialState=null) {
  this.map = new OverworldMap(mapConfig);
  this.map.overworld = this;

  this.map.mountObjects();

  if (heroInitialState) {
    const {hero} = this.map.gameObjects;
    hero.x = heroInitialState.x;
    hero.y = heroInitialState.y;
    hero.direction = heroInitialState.direction;
  }

  db.char.mapId = mapConfig.id;
  this.progress.mapId = mapConfig.id;
  this.progress.startingHeroX = this.map.gameObjects.hero.x;
  this.progress.startingHeroY = this.map.gameObjects.hero.y;
  this.progress.startingHeroDirection = this.map.gameObjects.hero.direction;
  if(mapConfig.id === "kulonSmallLake") {
    Kaudio.play("bgm", "lake_bgm", 1);
  } else if(mapConfig.id === "kulonSafeHouse" || mapConfig.id.includes("_")) {
    Kaudio.play("bgm", "inside_bgm", 1);
  } else {
    const audio_outsides = ["outside1", "outside2", "outside3"];
    Kaudio.play("bgm", audio_outsides[Math.floor(Math.random() * audio_outsides.length)], 1);
  }
 }

 async init() {
  this.progress = new Progress();

  // this.titleScreen = new TitleScreen({
  //   progress: this.progress
  // })
  const useSaveFile = true;

  let initialHeroState = null;
  if (useSaveFile) {
    this.progress.load();
    initialHeroState = {
      x: 48,
      y: playerState.localFlags["GAME_MANUALS"] ? 80 : 96,
      direction: "down",
    }
  }

  this.startMap(mapList["kulonSafeHouse"], initialHeroState);

  this.bindActionInput();
  this.bindHeroPositionCheck();

  this.directionInput = new DirectionInput();
  this.directionInput.init();

  kulonpad.init(this.map, this.directionInput);

  this.startGameLoop();

  const isDone = playerState.localFlags["GAME_MANUALS"];
  await this.map.startCutscene(introEvents[playerState.localFlags["GAME_MANUALS"] ? "DONE" : "FIRST"]);
  if(!isDone) {
    if(Object.keys(db.unread.mails || {}).length >= 1) {
      await this.map.startCutscene(introEvents.MAIL_INITIAL);
    }
    this.map.startCutscene(introEvents.SECOND);
  }

 }
}