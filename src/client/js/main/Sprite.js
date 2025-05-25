import asset from "../manager/asset.js";
import utils from "./utils.js";

export default class Sprite {
  constructor(config) {
    this.isLoaded = false;
    this.loadedNumber = 0;
    this.tileHeight = 20;

    this.images = typeof config.src === "string" ? [config.src] : config.src;
    this.toLoad = this.images.length;
    this.sheetImages = [];
    this.offset = config.offset;
    this.images.forEach(k => {
      const img = new Image();
      img.onload = () => {
        this.loadedNumber++;
        if(this.loadedNumber >= this.toLoad) this.isLoaded = true;
        if(this.offset) {
          this.offArea = [(img.width / this.offset[0]), (img.height / (this.offset[1] + 1))];
          this.offCentre = [((this.offArea[0] / 2) - 8), (this.offArea[1] - (16 * 2))];
        }
      }
      img.alt = k;
      img.src = asset[k].src;
      this.sheetImages.push(img);
    });

    this.animate = config.animate;
    this.noShadow = config.noShadow || false;

    if(!this.noShadow) {
      this.shadow = new Image();
      this.shadow.onload = () => {
        this.isShadowLoaded = true;
      }
      this.shadow.src = asset.shadow.src;
    }

    this.animations = config.animations || {
      "idle-down" : [ [18,1],[19,1],[20,1],[21,1],[22,1],[23,1], ],
      "idle-right": [ [0,1],[1,1],[2,1],[3,1],[4,1],[5,1], ],
      "idle-up"   : [ [6,1],[7,1],[8,1],[9,1],[10,1],[11,1], ],
      "idle-left" : [ [12,1],[13,1],[14,1],[15,1],[16,1],[17,1], ],
      "walk-down" : [ [18,2],[19,2],[20,2],[21,2],[22,2],[23,2], ],
      "walk-right": [ [0,2],[1,2],[2,2],[3,2],[4,2],[5,2], ],
      "walk-up"   : [ [6,2],[7,2],[8,2],[9,2],[10,2],[11,2], ],
      "walk-left" : [ [12,2],[13,2],[14,2],[15,2],[16,2],[17,2], ],
      "phone-idle": [[3, 6],[4,6],[5,6],[5,6],[5,6],[7,6],[8,6],[4,6]],
    }
    this.currentAnimation = config.currentAnimation || "idle-down";
    this.currentAnimationFrame = 0;

    this.animationFrameLimit = config.animationFrameLimit || 8;
    this.animationFrameProgress = this.animationFrameLimit;
    

    //Reference the game object
    this.gameObject = config.gameObject;
  }

  get frame() {
    return this.animations[this.currentAnimation][this.currentAnimationFrame]
  }

  setAnimation(key) {
    if (this.currentAnimation !== key) {
      this.currentAnimation = key;
      this.currentAnimationFrame = 0;
      this.animationFrameProgress = this.animationFrameLimit;
    }
  }

  updateAnimationProgress() {
    //Downtick frame progress
    if (this.animationFrameProgress > 0) {
      this.animationFrameProgress -= 1;
      return;
    }

    this.animationFrameProgress = this.animationFrameLimit;

    this.currentAnimationFrame += 1;
    if (this.frame === undefined) {
      this.currentAnimationFrame = 0
    }
  }
  draw(ctx, cameraPerson) {
    const x = this.gameObject.x + utils.withGrid(10.5) - cameraPerson.x;
    const y = this.gameObject.y - this.tileHeight + utils.withGrid(6) - cameraPerson.y;

    if(!this.noShadow && this.isShadowLoaded) ctx.drawImage(this.shadow, x, y + 2);

    const [frameX, frameY] = this.frame;

    if(this.isLoaded) {
      for(const image of this.sheetImages) {
        const areaX = this.offset ? this.offArea[0] : 16;
        const areaY = this.offset ? this.offArea[1] : 32;
        const offsetX = this.offset ? this.offCentre[0] : 0;
        const offsetY = this.offset ? (this.offCentre[1] + this.tileHeight) : this.tileHeight;
  
        ctx.drawImage(image,
          frameX * areaX, frameY * areaY,
          areaX, areaY,
          x - offsetX,(y - offsetY) + this.tileHeight,
          areaX, areaY
        );
      }
    }
    this.updateAnimationProgress();
  }

}