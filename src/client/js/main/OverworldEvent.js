import cloud_items from "../../../../client/json/items/cloud_items.json";
import utils from "./utils.js";
import TextMessage from "./TextMessage.js";
import SceneTransition from "./SceneTransition.js";
import playerState from "../manager/PlayerState.js";
import Phone from "../pages/Phone.js";
import TitleScreen from "../pages/TitleScreen.js";
import Choices from "./Choices.js";
import MissionBoard from "../pages/MissionBoard.js";
import Result from "../pages/Result.js";
import mapList from "../manager/mapList.js";
import db from "../manager/db.js";
import cloud from "../manager/cloud.js";
import Payouts from "./Payouts.js";
import Minigames from "../pages/Minigames.js";
import kchat from "../manager/KChat.js";
import notip from "../helper/notip.js";
import { klang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";
import Mails from "../contents/Mails.js";

export default class OverworldEvent {
  constructor({ map, event}) {
    this.map = map;
    this.event = event;
  }
  titleScreen(resolve) {
    const gameStart = new TitleScreen({ map: this.map, onComplete:() => {
      resolve();
    }});
    gameStart.init();
  }
  stand(resolve) {
    const who = this.map.gameObjects[ this.event.who ];
    who.startBehavior({
      map: this.map
    }, {
      type: "stand",
      direction: this.event.direction,
      time: this.event.time
    });
    //Set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = e => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonStandComplete", completeHandler);
        resolve();
      }
    }
    document.addEventListener("PersonStandComplete", completeHandler);
  }
  teleport(resolve) {
    if(db.crew.length >= 1) {
      cloud.send({id:"teleport", to: db.crew, data: {
        who: (this.event.who && this.event.who !== "hero") ? this.event.who : null,
        mapId: db.char.mapId, x: this.event.x, y: this.event.y, direction: this.event.direction
      }});
    }
    const who = this.map.gameObjects[this.event.who || "hero"];
    who.x = this.event.x;
    who.y = this.event.y;
    who.direction = this.event.direction || "down";
    setTimeout(resolve, 500);
  }
  walk(resolve) {
    const who = this.map.gameObjects[this.event.who];
    who.startBehavior({
      map: this.map
    }, {
      type: "walk",
      direction: this.event.direction,
      retry: true
    });
    const completeHandler = e => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonWalkingComplete", completeHandler);
        resolve();
      }
    }
    document.addEventListener("PersonWalkingComplete", completeHandler);
  }
  textMessage(resolve) {
    if (this.event.faceHero) {
      const obj = this.map.gameObjects[this.event.faceHero];
      obj.direction = utils.oppositeDirection(this.map.gameObjects["hero"].direction);
    }
    const message = new TextMessage({
      text: this.event.text,
      who: this.event.who || null,
      onComplete: () => resolve()
    })
    message.init(document.querySelector(".app"));
  }
  choices(resolve) {
    const menu = new Choices({
      options: this.event.options,
      noCancel: this.event.noCancel || false,
      who: this.event.who || null,
      text: this.event.text,
      onComplete: (didnext) => {
        resolve(didnext ? "LANJUT" : "BATAL");
      }
    });
    menu.run();
  }
  changeMap(resolve) {
    if(this.map.overworld.map) this.map = this.map.overworld.map;
    Object.values(this.map.gameObjects).forEach(obj => {
      obj.isMounted = false;
    });
    if(db.crew.length >= 1) {
      cloud.send({id:"changeMap", to: db.crew, data: {
        mapId: this.event.map, x: this.event.x, y: this.event.y, direction: this.event.direction
      }});
    }
    const sceneTransition = new SceneTransition();
    sceneTransition.init(document.querySelector(".app"), () => {
      this.map.overworld.startMap( mapList[this.event.map], {
        x: this.event.x,
        y: this.event.y,
        direction: this.event.direction,
      });
      resolve();
      sceneTransition.fadeOut();
    })
  }
  mail(resolve) {
    Kaudio.play("sfx", "phone_opened");
    this.map.gameObjects.hero.usePhone(true);
    const mails = new Mails({
      onComplete: () => {
        this.map.gameObjects.hero.usePhone(false);
        resolve();
      }
    });
    mails.init();
  }
  phone(resolve) {
    Kaudio.play("sfx", "phone_opened");
    if(db.crew.length >= 1) {
      cloud.send({id: "use_phone", to: db.crew, data: { status: true, mapId: db.char.mapId }});
    }
    if(!db.char.trophies?.["firstphone"]?.done) cloud.asend("use_phone");
    this.map.gameObjects.hero.usePhone(true);
    const menu = new Phone({
      map: this.map,
      onComplete: () => {
        this.map.gameObjects.hero.usePhone(false);
        if(db.crew.length >= 1) {
          cloud.send({id: "use_phone", to: db.crew, data: { status: false, mapId: db.char.mapId }});
        }
        resolve();
      }
    });
    menu.init(document.querySelector(".app"));
  }
  addStoryFlag(resolve) {
    cloud.asend("mpGetFlags", {flags:this.event.flag});
    if(db.crew.length >= 1) {
      cloud.send({id:"cloudflags", to: db.crew, data: {flag: this.event.flag, text:this.event.text}});
    }
    this.event.flag.forEach(fg => {playerState.storyFlags[fg] = true});
    if(this.event.text) {
      Kaudio.play("nfx3", "newflag");
      kchat.add(db.char.id, this.event.text[klang.currLang], true);
    }
    resolve();
  }
  removeStoryFlag(resolve) {
    cloud.asend("mpDelFlags", {flags:this.event.flag});
    if(db.crew.length >= 1) {
      cloud.send({id:"delcloudflags", to: db.crew, data: {flag: this.event.flag}});
    }
    this.event.flag.forEach(fg => { 
      playerState.storyFlags[fg] = false
      delete playerState.storyFlags[fg];
    });
    resolve();
  }
  addLocalFlag(resolve) {
    this.event.flag.forEach(fg => {playerState.localFlags[fg] = true});
    this.map.overworld.progress.save();
    resolve();
  }
  removeLocalFlag(resolve) {
    this.event.flag.forEach(fg => {
      playerState.localFlags[fg] = false;
      delete playerState.localFlags[fg];
    });
    this.map.overworld.progress.save();
    resolve();
  }
  additem(resolve) {
    Kaudio.play("nfx1", "item_collected");
    this.event.amount = Number(this.event.amount);
    cloud.asend("additem", {id:this.event.id, amount:this.event.amount});
    if(db.crew.length >= 1) {
      cloud.send({id:"additem", to: db.crew});
    }
    if(!db.job.bag[this.event.id]) db.job.bag[this.event.id] = {id:this.event.id, amount:0};
    db.job.bag[this.event.id].amount = db.job.bag[this.event.id].amount + this.event.amount;
    const item = cloud_items.find(itm => itm.id === this.event.id);
    notip({
      a: `+${this.event.amount} ${item.name[klang.currLang]}`,
      ic: "backpack"
    });
    resolve();
  }
  missionBoard(resolve) {
    const missionBoard = new MissionBoard({
      map: this.map,
      onComplete: () => {
        resolve();
      }
    });
    missionBoard.init();
  }
  minigame(resolve) {
    const mg = Minigames[this.event.id];
    if(!mg) resolve("BATAL");
    mg.run({
      onComplete: (didnext) => {
        resolve(didnext ? didnext : "BATAL");
      }
    });
  }
  journeyResult(resolve) {
    const resultBoard = new Result({
      map: this.map,
      modal_text: this.event.text || null,
      far: this.event.far || 0,
      onComplete: () => {
        resolve();
      }
    });
    resultBoard.init();
  }
  async MissionCompleted(resolve) {
    if(!this.event.me) {
      cloud.asend("missionComplete");
      if(db.crew.length >= 1) {
        cloud.send({id:"missionComplete", to: db.crew});
      }
    } else {
      this.map.isCutscenePlaying = true;
    }
    const events = playerState.journey.mission.scenes;
    for(const evt of events) {
      const eventHandler = new OverworldEvent({
        event: evt,
        map: this.map,
      });
      const result = await eventHandler.init();
      if (result === "BATAL") {
        break;
      }
    }
    const payouts = new Payouts({
      map: this.map,
      onComplete: () => {
        resolve();
      }
    });
    payouts.init();
  }
  init() {
    return new Promise(resolve => {
      this[this.event.type](resolve);
    })
  }
}