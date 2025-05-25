import cloud_items from "../../../../client/json/items/cloud_items.json";
import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import db from "../manager/db.js";
import playerState from "../manager/PlayerState.js";
import sdate from "../helper/sdate.js";
import ItemData from "../manager/itemData.js";
import cloud from "../manager/cloud.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

let currentPage = "1";
let expireInterval = null;

function itemCard(s) {
  const item = cloud_items.find(itm => itm.id === s.id);
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
  ${s.expiry ? '<div class="expire"></div>' : ''}
  <div class="icon"><img src="${asset[item.src].src}" alt="${item.name[klang.currLang]}"/></div>
  <div class="price">
    <span>${s.amount}</span>
  </div>`;
  return card;
}

export default class Backpack {
  constructor({ onComplete, map, classBefore=null } = { onComplete }) {
    this.onComplete = onComplete;
    this.map = map;
    this.classBefore = classBefore;
    this.isLocked = false;
    this.items = null;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-shop", "f-backpack");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-backpack"></i> ${lang.PHONE_BACKPACK}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="con-list">
          <div k-type="0" class="card">${lang.ITM_BAR_JOURNEY}</div>
          <div k-type="1" class="card">${lang.ITM_BAR_PRECIOUS}</div>
          <div k-type="2" class="card">${lang.ITM_BAR_DECORATION}</div>
        </div>
        <div class="board">
          <div class="economies">
            <div class="eco eco-perisma">
              <img src="/assets/items/cloud/perismato.png" alt="perisma"/>
              <i>0</i>
            </div>
            <div class="eco eco-token">
              <img src="/assets/items/cloud/token.png" alt="token"/>
              <i>0</i>
            </div>
          </div>
          <div class="item-container">
            <div class="item-list">
            </div>
          </div>
          <div class="detail">
          </div>
        </div>
      </div>
    </div>`;
    this.itemContainer = this.el.querySelector(".item-container");
    this.itemDetail = this.el.querySelector(".detail");
  }
  async btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }

    const btnChanges = this.el.querySelectorAll(".con-list .card");
    btnChanges.forEach(btn => {
      btn.onclick = () => {
        if(btn.getAttribute("k-type") === currentPage) return;
        Kaudio.play("sfx", "menu_select");
        currentPage = btn.getAttribute("k-type");
        this.writeDesc(null);
        this.activatedBtn(btn);
        this.writeItems(btn.getAttribute("k-type"));
      }
    });
  }
  updateEconomies() {
    const eperisma = this.el.querySelector(".economies .eco-perisma i");
    const etoken = this.el.querySelector(".economies .eco-token i");
    this.items = {...db.char.backpack};
    if(db.job && db.job.bag) {
      Object.keys(db.job.bag).forEach(k => {
        this.items[k] = db.job.bag[k];
      })
    }

    const xperisma = Object.values(this.items).find(k => k.id === "69");
    const xtoken = Object.values(this.items).find(k => k.id === "420");

    eperisma.innerHTML = xperisma?.amount || 0;
    etoken.innerHTML = xtoken?.amount || 0;
  }
  activatedBtn(btn = null) {
    const btnSelecteds = this.el.querySelectorAll(".con-list .card.selected");
    btnSelecteds.forEach(el => el.classList.remove("selected"));
    if(!btn) btn = this.el.querySelector(`.con-list .card[k-type="${currentPage}"]`);
    btn.classList.add("selected");
  }
  writeItems(ktype) {
    if(expireInterval) {
      clearInterval(expireInterval);
      expireInterval = null;
    }
    const pageItems = Object.keys(this.items).filter(k => (cloud_items.find(citm => citm.id === this.items[k].id).group === ktype) && (!this.items[k].expiry || this.items[k].expiry > Date.now()) && this.items[k].amount >= 1);

    const elistBefore = this.el.querySelector(".item-list");
    if(elistBefore) elistBefore.remove();
    const elist = document.createElement("div");
    elist.classList.add("item-list");
    pageItems.forEach(itm => {
      const card = itemCard(this.items[itm]);
      card.onmousedown = () => {
        Kaudio.play("sfx", "phone_selected");
        const cardSelecteds = this.el.querySelectorAll(".item-list .card.selected");
        cardSelecteds.forEach(el => el.classList.remove("selected"));
        card.classList.add("selected");
        this.writeDesc({...this.items[itm], _id:itm});
      }
      elist.append(card);
    });
    if(pageItems.length < 1) {
      elist.innerHTML = `<div class="center">~ ${lang.EMPTY} ~</div>`;
    }
    this.itemContainer.append(elist);
  }
  writeDesc(s = null) {
    if(expireInterval) {
      clearInterval(expireInterval);
      expireInterval = null;
    }
    if(!s) s = {id: "null"};
    const fieldBefore = this.itemDetail.querySelector(".field");
    if(fieldBefore) fieldBefore.remove();
    const item = cloud_items.find(itm => itm.id === s.id);
    const field = document.createElement("div");
    field.classList.add("field");
    field.innerHTML = `
    <div class="item-name">${item.name[klang.currLang]}</div>
    <div class="item-desc">${item.desc[klang.currLang]}</div>
    <div class="item-note">${s.id === "null" ? '' : lang.ITM_PERMANENT}</div>
    <div class="item-actions"></div>`;
    if(s.expiry) {
      let isValid = sdate.remain(s.expiry);
      const itmNote = field.querySelector(".item-note");
      itmNote.innerHTML = isValid ? `${lang.ITM_REMAIN} ${isValid}` : lang.ITM_EXPIRED;

      expireInterval = setInterval(() => {
        isValid = sdate.remain(s.expiry);
        itmNote.innerHTML = isValid ? `${lang.ITM_REMAIN} ${isValid}` : lang.ITM_EXPIRED;
        if(!isValid) {
          cloud.asend("item_expired", {item_n: s._id});
          clearInterval(expireInterval);
          expireInterval = null;
        }
      }, 1000);
    }
    if(item.run) {
      const btnBuy = document.createElement("div");
      btnBuy.classList.add("btn", "btn-buy");
      btnBuy.innerHTML = lang.ITM_USE;
      const itmAct = field.querySelector(".item-actions");
      btnBuy.onclick = async() => {
        if(this.isLocked) return;
        Kaudio.play("sfx", "menu_select");
        // this.isLocked = true;
        const itemData = new ItemData({_id: item.run, passedData: s, classBefore:this, onComplete:this.onComplete, map:this.map});
        this.destroy(itemData);
        // const itemData = new ItemData({id: item.run});
        // await itemData.init(s);
        // this.items = db.char.backpack;
        // this.isLocked = false;
        // this.writeItems(currentPage);
      }
      itmAct.append(btnBuy);
    }

    this.itemDetail.append(field);
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      if(expireInterval) {
        clearInterval(expireInterval);
        expireInterval = null;
      }
      this.items = null;
      this.el.classList.add("out");
      await modal.waittime(500, 5);
      this.el.remove();
      this.isLocked = false;
      playerState.pmc = null;
      resolve();
      if(!next) return this.onComplete();
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    if(db.onduty === 2) currentPage = "0";
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.btnListener();
    this.updateEconomies();
    this.activatedBtn();
    this.writeItems(currentPage);
    this.writeDesc();
  }
}