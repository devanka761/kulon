import cloud from "../manager/cloud.js";
import db from "../manager/db.js";
import Kaudio from "../manager/Kaudio.js";
import GameObject from "./GameObject.js";
import utils from "./utils.js";

let myStep = 0;

export default class Person extends GameObject {
  constructor(config) {
    super(config);
    this.movingProgressRemaining = 0;
    this.isStanding = false;
    this.phoneTime = config.onPhone || false;

    this.intentPosition = null; //[x,y]

    this.isPlayerControlled = config.isPlayerControlled || false;

    this.directionUpdate = {
      "up": ["y", -1],
      "down": ["y", 1],
      "left": ["x", -1],
      "right": ["x", 1],
    }
    this.standBehaviorTimeout;
  }

  update(state) {
    if (this.movingProgressRemaining > 0) {
      this.updatePosition();
    } else {
      //We're keyboard ready and have an arrow pressed
      if (!state.map.isCutscenePlaying && this.isPlayerControlled && state.arrow) {
        this.startBehavior(state, {
          type: "walk",
          direction: state.arrow
        });
        if(db.crew.length >= 1) {
          cloud.send({
            id: "moving", to: db.crew, data: {
              mapId: db.char.mapId, x: this.x, y: this.y, direction: state.arrow
            }
          });
        }
      }
      this.updateSprite(state);
    }
  }

  startBehavior(state, behavior) {

    if (!this.isMounted) {
      return
    }

    //Set character direction to whatever behavior has
    this.direction = behavior.direction;
    
    if (behavior.type === "walk") {
      if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {
          behavior.retry && setTimeout(() => {
            this.startBehavior(state, behavior)
          }, 10);
          return;
      }
      this.movingProgressRemaining = 16;
      const intentPosition = utils.nextPosition(this.x,this.y, this.direction)
      this.intentPosition = [
        intentPosition.x,
        intentPosition.y,
      ]

      this.updateSprite(state);
    }

    if (behavior.type === "stand") {
      this.isStanding = true;
      this.standBehaviorTimeout = setTimeout(() => {
        utils.emitEvent("PersonStandComplete", {
          whoId: this.id
        })
        this.isStanding = false;
      }, behavior.time)
    }
  }
  updatePosition() {
      const [property, change] = this.directionUpdate[this.direction];
      this[property] += change;
      this.movingProgressRemaining -= 1;

      if(this.isPlayerControlled && this.movingProgressRemaining === 8) {
        myStep++;
        if(myStep > 1) {
          const soundSteps = ["step_1", "step_2"];
          Kaudio.play("nfx1", soundSteps[Math.floor(Math.random() * soundSteps.length)]);
          myStep = 0;
        }
      }

      if (this.movingProgressRemaining === 0) {
        this.intentPosition = null;
        utils.emitEvent("PersonWalkingComplete", {
          whoId: this.id
        });
        if(!db.char.trophies?.["steptaken1"]?.done) cloud.asend("walk");
      }
  }
  usePhone(onPhone) {
    this.phoneTime = onPhone;
  }
  updateSprite() {
    if (this.movingProgressRemaining > 0) {
      this.sprite.setAnimation("walk-"+this.direction);
      return;
    }
    if(this.phoneTime) {
      this.sprite.setAnimation("phone-idle");
      return;
    }
    this.sprite.setAnimation("idle-"+this.direction);
  }

}