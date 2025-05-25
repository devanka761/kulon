import Overworld from "../main/Overworld.js";
import db from "./db.js";
import kchat from "./KChat.js";
import mapList from "./mapList.js";
export default function startGame(data) {
  if(!db.version) db.version = data.version;
  if(!db.unread) db.unread = {};
  if(!db.char) db.char = {};
  if(!db.friends) db.friends = {};
  if(!db.job) db.job = {};
  if(!db.onduty) db.onduty = 1;
  if(!db.waiting) db.waiting = [];
  if(!db.crew) db.crew = [];
  if(!db.lastmove) db.lastmove = {};
  Object.keys(data).forEach(k => {
    db[k] = data[k];
  });
  Object.keys(mapList).forEach(k => {
    mapList[k].configObjects.hero.src = data.char.skin
    mapList[k].configObjects.hero.isPlayerControlled = true;
  });
  kchat.run();
  const canvas = document.createElement("canvas");
  canvas.classList.add("canvas", "title-screen");
  canvas.width = 352;
  canvas.height = 198;
  const container = document.querySelector(".app");
  container.prepend(canvas);

  const overworld = new Overworld({ element: container, canvas: canvas });
  overworld.init();
}