import cloud_items from "../../../../client/json/items/cloud_items.json";
import shop_items from "../../../../client/json/items/shop_items.json";
import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import db from "../manager/db.js";
import playerState from "../manager/PlayerState.js";
import { Exchange } from "../manager/Exchange.js";
import { Donate } from "../manager/Donate.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

let currentPage = "0";

function itemCard(s) {
  const item = cloud_items.find(itm => itm.id === s.id);
  const card = document.createElement("div");
  card.classList.add("card");
  card.innerHTML = `
  <div class="amount">${s.amount} ${s.bonus ? '+ ' + s.bonus : ''}</div>
  <div class="icon"><img src="${asset[item.src].src}" alt="${item.name[klang.currLang]}"/></div>
  <div class="price">
    <span>${s.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}</span>
  </div>`;
  const exreq = cloud_items.find(itm => itm.id === s.req);
  const eprice = card.querySelector(".price");
  if(exreq) {
    const imgPrice = new Image();
    imgPrice.src = asset[exreq.src].src;
    imgPrice.alt = exreq.name[klang.currLang];
    eprice.prepend(imgPrice);
  } else {
    eprice.prepend("Rp");
  }
  return card;
}

export default class Shop {
  constructor({ onComplete, classBefore=null } = { onComplete }) {
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.isLocked = false;
    this.items = null;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-shop");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-shopping-bag"></i> ${lang.PHONE_SHOP}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="con-list">
          <div k-type="0" class="card">${lang.SHP_BAR_EXCHANGE}</div>
          <div k-type="1" class="card">${lang.SHP_BAR_DECORATION}</div>
          <div k-type="9" class="card">${lang.SHP_BAR_DONATE}</div>
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
    this.items = db.char.backpack;

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
    const pageItems = shop_items.filter(k => k.group === ktype);

    const elistBefore = this.el.querySelector(".item-list");
    if(elistBefore) elistBefore.remove();
    const elist = document.createElement("div");
    elist.classList.add("item-list");
    pageItems.forEach(itm => {
      const card = itemCard(itm);
      card.onmousedown = () => {
        Kaudio.play("sfx", "phone_selected");
        const cardSelecteds = this.el.querySelectorAll(".item-list .card.selected");
        cardSelecteds.forEach(el => el.classList.remove("selected"));
        card.classList.add("selected");
        this.writeDesc(itm);
      }
      elist.append(card);
    });
    if(pageItems.length < 1) {
      elist.innerHTML = `<div class="center">~ COMING SOON ~</div>`;
    }
    this.itemContainer.append(elist);
  }
  writeDesc(s = null) {
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

    if(s.id !== "null") {
      const btnBuy = document.createElement("div");
      btnBuy.classList.add("btn", "btn-buy");
      btnBuy.innerHTML = lang.SHP_USE;
      const itmAct = field.querySelector(".item-actions");
      btnBuy.onclick = async() => {
        Kaudio.play("sfx", "menu_select");
        if(s.group === "0") {
          const exchange = new Exchange({
            onComplete: this.onComplete, classBefore: this,
            item_id: s.id, req_id: s.req, amount: s.amount, price: s.price
          });
          await this.destroy(exchange);
        } else {
          const donate = new Donate({
            classBefore: this, onComplete: this.onComplete, item_id: s._n
          });
          await this.destroy(donate);
        }
      }
      itmAct.append(btnBuy);
    }

    this.itemDetail.append(field);
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
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
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.btnListener();
    this.updateEconomies();
    this.activatedBtn();
    this.writeItems(currentPage);
    this.writeDesc();
  }
}