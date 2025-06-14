import asset from "../manager/asset.js";
import utils from "./utils.js";
import Person from "./Person.js";
import OverworldEvent from "./OverworldEvent.js";
import playerState from "../manager/PlayerState.js";
import { StaticCloud, StaticLocal } from "./StaticProps.js";
import modal from "../helper/modal.js";
import db from "../manager/db.js";
import mapList from "../manager/mapList.js";
import kulonpad from "../mobile/KulonPad.js";

export default class OverworldMap {
  constructor(config) {
    this.mapId = config.id;
    this.overworld = null;
    this.configObjects = config.configObjects;
    this.gameObjects = {};
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerLoaded = false;

    // this.lowerImage = new Image();
    // this.lowerImage.src = asset[config.lowerSrc].src;
    this.lowerImage = asset[config.lowerSrc]

    // this.upperImage = new Image();
    // this.upperImage.src = asset[config.upperSrc].src;
    this.upperImage = asset[config.upperSrc];

    this.isCutscenePlaying = false;
    this.isPaused = false;
  }

  drawLowerImage(ctx, cameraPerson) {
    if(ctx && cameraPerson && cameraPerson.x && cameraPerson.y) {
      ctx.drawImage(
        this.lowerImage,
        utils.withGrid(10.5) - cameraPerson.x, 
        utils.withGrid(6) - cameraPerson.y
      )
    }
  }

  drawUpperImage(ctx, cameraPerson) {
    if(ctx && cameraPerson && cameraPerson.x && cameraPerson.y) {
      ctx.drawImage(
        this.upperImage, 
        utils.withGrid(10.5) - cameraPerson.x,
        utils.withGrid(6) - cameraPerson.y
      )
    }
  } 

  isSpaceTaken(currentX, currentY, direction) {
    const {x,y} = utils.nextPosition(currentX, currentY, direction);
    if (this.walls[`${x},${y}`]) {
      return true;
    }
    // Check for objects that match
    return Object.values(this.gameObjects).find(obj => {
      if (obj.x === x && obj.y === y) { return true; }
      if (obj.intentPosition && obj.intentPosition[0] === x && obj.intentPosition[1] === y) {
        return true;
      }
      return false;
    })
  }

  mountObjects() {
    Object.keys(this.configObjects).forEach(key => {

      let config = this.configObjects[key];
      config.id = key;

      const crewKey = key.replace("crew_", "");

      let newX = config.x;
      let newY = config.y;

      if(db.job?.map?.[crewKey] === this.mapId) {
        newX = mapList[this.mapId].configObjects[key].x;
        newY = mapList[this.mapId].configObjects[key].y;
      } else if(db.job?.map?.[crewKey] && db.job?.map?.[crewKey] !== this.mapId) {
        newX = utils.withGrid(3000);
        newY = utils.withGrid(3000);
      }

      let obj;
      if (config.type === "Person") {
        obj = new Person({...config, x: newX, y: newY});
      }
      if (config.type === "StaticLocal") {
        obj = new StaticLocal(config);
      }
      if (config.type === "StaticCloud") {
        obj = new StaticCloud(config);
      }
      this.gameObjects[key] = obj;
      this.gameObjects[key].id = key;
      obj.mount(this);
    })
  }

  async startCutscene(events) {
    kulonpad.hide();
    this.isCutscenePlaying = true;

    for (let i=0; i<events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      const result = await eventHandler.init();
      if (result === "BATAL") {
        break;
      }
    }
    this.isCutscenePlaying = false;
    kulonpad.show();
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {
      const relevantScenario = match.talking.find(scenario => {
        if(scenario.local_req) return scenario.local_req.every(sf => {
          return playerState.localFlags[sf];
        });
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf];
        });
      })
      relevantScenario && this.startCutscene(relevantScenario.events)
    }
  }

  async checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
    const openedPhone = this.isCutscenePlaying && playerState.pmc?.id === "phone";
    if ((openedPhone || !this.isCutscenePlaying) && match) {
      if(openedPhone) {
        await modal.waittime(250);
        const hasModal = document.querySelector(".modal");
        if(hasModal) {
          const btnCancel = hasModal.querySelector(".btn-cancel");
          const btnOk = hasModal.querySelector(".btn-ok");
          if(btnCancel) {
            btnCancel.click();
            await modal.waittime(850);
          } else if(btnOk) {
            btnOk.click();
            await modal.waittime(850);
          }
        }
        await playerState.pmc.destroy();
      }
      const relevantScenario = match.find(scenario => {
        if(scenario.local_req) return scenario.local_req.every(sf => {
          return playerState.localFlags[sf];
        });
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf];
        });
      })
      relevantScenario && this.startCutscene(relevantScenario.events)
    }
  }
}