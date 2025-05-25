import cloud_items from "../../../../client/json/items/cloud_items.json";
import asset from "../manager/asset.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";
import { klang, lang } from "./lang.js";

export default function Splash(rewards) {
  return new Promise(resolve => {
    const elsBefore = document.querySelectorAll('.Splash');
    if(elsBefore.length >= 1) elsBefore.forEach(eb => eb.remove());
    Kaudio.play("sfx", "item_collected");
    const el = document.createElement("div");
    el.classList.add("Splash");
    el.innerHTML = `
    <div class="box">
      <div class="rewards-title"><p>${lang.SP_TITLE}</p></div>
      <div class="list"></div>
      <div class="desc"><p>${lang.SP_DESC}</p></div>
    </div>`;
    const list = el.querySelector('.list');

    rewards.forEach(r => {
      const item = cloud_items.find(itm => itm.id === r.id);
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `${r.expiry ? '<div class="expire"></div>' : ''}<img src="${asset[item.src].src}" alt="${item.name[klang.currLang]}"/><div class="number">${r.amount}</div>`;
      list.append(card);
    });
    el.onclick = () => {
      el.remove();
      resolve();
    }
    document.querySelector(".app").append(el);
  });
}