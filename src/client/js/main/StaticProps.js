import playerState from "../manager/PlayerState.js";
import GameObject from "./GameObject.js";
import Sprite from "./Sprite.js";

export class StaticLocal extends GameObject {
  constructor(config) {
    super(config);
    let anim_used = [[0,0]];
    let anim_unused = [[0,1]];
    if(config.offset) {
      anim_unused = [];
      anim_used = [];
    }
    if(config.offset) {
      for(let aIdx = 0; aIdx < config.offset[0]; aIdx++) {
        anim_unused.push([aIdx, 0]);
        if(config.offset[1] >= 1) {
          anim_used.push([aIdx, config.offset[1]]);
        } else {
          anim_used.push([0,0]);
        }
      }
    }
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src,
      animations: {
        "used-down": anim_used,
        "unused-down": anim_unused
      },
      currentAnimation: "unused-down",
      animate: config.animate || null,
      offset: config.offset || null,
      noShadow: config.noShadow || false,
    });
    this.localFlags = config.localFlags;

    const customUsedDown = [];
    const customUnUsedDown = [];

    if(config.animate && config.animate[0]) {
      for(let i=0;i<config.animate[0];i++) {
        customUsedDown.push([i, 0]);
      }
    }
    if(config.animate && config.animate[1]) {
      for(let i=0;i<config.animate[1];i++) {
        customUnUsedDown.push([i, 0]);
      }
    }
    if(customUsedDown.length > 0) this.sprite.animations["used-down"] = customUsedDown;
    if(customUnUsedDown.length > 0) this.sprite.animations["unused-down"] = customUnUsedDown;
  }
  update() {
    this.sprite.currentAnimation = playerState.localFlags[this.localFlags] ? "used-down": "unused-down";
  }
}
export class StaticCloud extends GameObject {
  constructor(config) {
    super(config);
    let anim_used = [[0,0]];
    let anim_unused = [[0,1]];
    if(config.offset) {
      anim_unused = [];
      anim_used = [];
    }
    if(config.offset) {
      for(let aIdx = 0; aIdx < config.offset[0]; aIdx++) {
        anim_unused.push([aIdx, 0]);
        if(config.offset[1] >= 1) {
          anim_used.push([aIdx, config.offset[1]]);
        } else {
          anim_used.push([0,0]);
        }
      }
    }
    this.sprite = new Sprite({
      gameObject: this,
      src: config.src,
      animations: {
        "used-down": anim_used,
        "unused-down": anim_unused
      },
      currentAnimation: "unused-down",
      animate: config.animate || null,
      offset: config.offset || null,
      noShadow: config.noShadow || false,
    });
    this.storyFlags = config.storyFlags;

    const customUsedDown = [];
    const customUnUsedDown = [];

    if(config.animate && config.animate[0]) {
      for(let i=0;i<config.animate[0];i++) {
        customUsedDown.push([i, 0]);
      }
    }
    if(config.animate && config.animate[1]) {
      for(let i=0;i<config.animate[1];i++) {
        customUnUsedDown.push([i, 0]);
      }
    }
    if(customUsedDown.length > 0) this.sprite.animations["used-down"] = customUsedDown;
    if(customUnUsedDown.length > 0) this.sprite.animations["unused-down"] = customUnUsedDown;
  }
  update() {
    this.sprite.currentAnimation = playerState.storyFlags[this.storyFlags] ? "used-down": "unused-down";
  }
}