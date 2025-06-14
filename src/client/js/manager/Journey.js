import { lang } from "../helper/lang.js";
import utils from "../main/utils.js";
import kulonpad from "../mobile/KulonPad.js";
import db from "./db.js";
import mapList from "./mapList.js";
import playerState from "./PlayerState.js";

export default class Journey {
  constructor({map, mission}) {
    this.map = map;
    this.mission = mission;
  }
  showUnfinished(showType=0, data=null) {
    kulonpad.hide();
    if(this.map.isCutscenePlaying) return setTimeout(() => this.showUnfinished(showType, data), 250);

    if(showType === -1) {
      this.map.startCutscene([
        {type: "journeyResult", text: lang.PRP_ON_LEFT.replace("{user}", data.username)}
      ]);
    } else {
      this.map.startCutscene([
        {type: "journeyResult" }
      ]);
    }
  }
  async showFinished() {
    if(this.map.isCutscenePlaying) return setTimeout(() => this.showFinished(), 250);
    if(this.map.overworld.map) this.map = this.map.overworld.map;
    this.map.isCutscenePlaying = true;
    this.map.startCutscene([
      { type: "MissionCompleted", me:true }
    ]);
  }
  setUsePhone(user_id, s) {
    if(db.lastmove[user_id] !== "usephone") return;
    if(db.crew.length < 1) return;
    const peer_user = `crew_${user_id}`;
    if(this.map.overworld.map) {
      this.map = this.map.overworld.map;
    }
    mapList[s.mapId].configObjects[peer_user].onPhone = s.status || false;

    if(s.mapId !== db.char.mapId) return;
    const who = this.map.gameObjects[peer_user];
    if(!who) return;
    who.usePhone(s.status || false);
  }
  setTeleport(user_id, s) {
    if(s.who && s.who === "hero") return;
    if(db.lastmove[user_id] !== "teleport") return;
    if(db.crew.length < 1) return;
    if(!s.x || !s.y || !s.direction || !s.mapId) return;
    s.x = Number(s.x), s.y = Number(s.y);
    const peer_user = s.who ? s.who : `crew_${user_id}`;
    if(!mapList[s.mapId]?.configObjects?.[peer_user]) return;
    s.x = s.x;
    s.y = s.y;
    mapList[s.mapId].configObjects[peer_user].x = s.x;
    mapList[s.mapId].configObjects[peer_user].y = s.y;
    mapList[s.mapId].configObjects[peer_user].direction = s.direction;

    if(s.mapId !== db.char.mapId) return;
    const who = this.map.gameObjects[peer_user];
    if(!who) return;
    who.x = s.x;
    who.y = s.y;
    who.direction = s.direction;
  }
  setPlayerMovement(user_id, s) {
    if(db.lastmove[user_id] !== "moving") return;
    if(db.crew.length < 1) return;
    if(!s.x || !s.y || !s.direction || !s.mapId) return;
    s.x = Number(s.x), s.y = Number(s.y);
    const peer_user = `crew_${user_id}`;
    if(!mapList[s.mapId]?.configObjects?.[peer_user]) return;
    if(this.map.overworld.map) {
      this.map = this.map.overworld.map;
    }
    const directionUpdate = {
      "up": ["y", -1],
      "down": ["y", 1],
      "left": ["x", -1],
      "right": ["x", 1],
    }
    const nextMove = {
      x: directionUpdate[s.direction][0] === "x" ? (s.x + (directionUpdate[s.direction][1] * 16)) : s.x,
      y: directionUpdate[s.direction][0] === "y" ? (s.y + (directionUpdate[s.direction][1] * 16)) : s.y,
      direction: s.direction
    }

    const hasObject = Object.values(mapList[s.mapId].configObjects).find(obj => obj.x === nextMove.x && obj.y === nextMove.y);
    const hasWall = mapList[s.mapId].walls[`${nextMove.x},${nextMove.y}`];

    if(!hasObject && !hasWall) {
      mapList[s.mapId].configObjects[peer_user].x = nextMove.x;
      mapList[s.mapId].configObjects[peer_user].y = nextMove.y;
    }
    mapList[s.mapId].configObjects[peer_user].direction = nextMove.direction;

    if(s.mapId !== db.char.mapId) return;

    const who = this.map.gameObjects[peer_user];
    if(!who) return;
    who.direction = s.direction;
    if(this.map.isSpaceTaken(s.x, s.y, s.direction)) {
      who.x = s.x;
      who.y = s.y;
      return;
    }
    who.movingProgressRemaining = 17;
    const intentPosition = utils.nextPosition(s.x,s.y, s.direction)
    who.intentPosition = [
      intentPosition.x,
      intentPosition.y,
    ]
    who.updateSprite();

    const completeHandler = (e) => {
      if (e.detail.whoId === peer_user) {
        document.removeEventListener(
          "PersonWalkingComplete",
          completeHandler
        );
        if(db.lastmove[user_id] !== "moving") return;
        who.x = directionUpdate[s.direction][0] === "x" ? (s.x + (directionUpdate[s.direction][1] * 16)) : s.x;
        who.y = directionUpdate[s.direction][0] === "y" ? (s.y + (directionUpdate[s.direction][1] * 16)) : s.y;
      }
    };
    document.addEventListener("PersonWalkingComplete", completeHandler);
  }
  setChangeMap(user_id, s) {
    if(db.lastmove[user_id] !== "changemap") return;
    if(db.crew.length < 1) return;
    if(!s.x || !s.y || !s.direction || !s.mapId) return;
    s.x = Number(s.x), s.y = Number(s.y);
    const peer_user = `crew_${user_id}`;
    if(!mapList[s.mapId]?.configObjects?.[peer_user]) return;
    if(this.map.overworld.map) {
      this.map = this.map.overworld.map;
    }
    db.job.map[user_id] = s.mapId;
    if(playerState.pmc?.updatePos) playerState.pmc.updatePos();
    Object.keys(mapList).filter(oldMapId => oldMapId !== s.mapId).forEach(oldMapId => {
      mapList[oldMapId].configObjects[peer_user].x = utils.withGrid(1000);
      mapList[oldMapId].configObjects[peer_user].y = utils.withGrid(1000);
      mapList[oldMapId].configObjects[peer_user].direction = "up";
    });
    mapList[s.mapId].configObjects[peer_user].x = s.x;
    mapList[s.mapId].configObjects[peer_user].y = s.y;
    mapList[s.mapId].configObjects[peer_user].direction = s.direction;

    const who = this.map.gameObjects[peer_user];
    if(!who) return;

    if(s.mapId === db.char.mapId) {
      who.x = s.x;
      who.y = s.y;
      who.direction = s.direction;
    } else {
      who.x = utils.withGrid(10000);
      who.y = utils.withGrid(10000);
      const completeHandler = (e) => {
        if (e.detail.whoId === peer_user) {
          document.removeEventListener(
            "PersonWalkingComplete",
            completeHandler
          );
          if(db.lastmove[user_id] !== "changemap") return;
          who.x = utils.withGrid(10000);
          who.y = utils.withGrid(10000);
        }
      };
      document.addEventListener("PersonWalkingComplete", completeHandler);
    }
  }
  end() {
    playerState.storyFlags = {};
    playerState.journey = null;
  }
  waitingListener() {
    if(db.waiting) {
      db.waiting.forEach(async k => {
        if(k.id === "job_leave") {
          if(playerState.pmc?.destroy) await playerState.pmc.destroy();
          this.showUnfinished(-1, k.user);
        }
      });
      db.waiting = [];
    }
  }
  standBy() {
    playerState.journey = this;
    this.waitingListener();
  }
}