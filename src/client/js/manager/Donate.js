import cloud_items from "../../../../client/json/items/cloud_items.json";
import shop_items from "../../../../client/json/items/shop_items.json";
import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import playerState from "./PlayerState.js";
import db from "./db.js";
import xhr from "../helper/xhr.js";
import Mails from "../contents/Mails.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "./Kaudio.js";

function drawImg(imgSrc, imgAlt) {
  const img = new Image();
  img.src = imgSrc;
  img.alt = imgAlt;
  return img;
}

export class Donate {
  constructor({onComplete, classBefore, item_id}) {
    this.id = "donate";
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.item_id = item_id;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "kulonXmidtrans");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-duotone fa-regular fa-gem"></i> ${lang.DN_TITLE}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="form">
          <div class="field">
            <div class="nh">${db.char.username}</div>
          </div>
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_BENEFIT}:</div>
              <div class="value" x-bf="benefit"><span></span></div>
            </div>
          </div>
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_PRICE}:</div>
              <div class="value" x-prc="price"><span></span></div>
            </div>
          </div>
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_PAYMD}:</div>
              <div class="nc"><img src="./images/qris.png" alt="qris"/></div>
              <div class="label sm">${lang.DN_TXT_QRIS_NP}</div>
            </div>
          </div>
          <div class="field">
            <div class="np sm">${lang.DN_AGREEMENTS}</div>
          </div>
          <div class="field">
            <div class="btn btn-submit">${lang.DN_TXT_CONTINUE}</div>
          </div>
        </div>
      </div>
    </div>`;
    this.ebenefitImg = this.el.querySelector(`[x-bf]`);
    this.ebenefitAmt = this.el.querySelector(`[x-bf] span`);
    this.eprice = this.el.querySelector(`[x-prc]`);
  }
  writeDetail() {
    const sitem = shop_items.find(itm => itm._n === this.item_id);
    const item = cloud_items.find(itm => itm.id === sitem.id);
    this.ebenefitAmt.innerHTML = `${sitem.amount}${sitem.bonus ? (" + " + sitem.bonus) : ""}`;
    this.ebenefitImg.prepend(drawImg(asset[item.src].src, item.name[klang.currLang]));
    this.eprice.innerHTML = "Rp" + sitem.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const btnSubmit = this.el.querySelector(".btn-submit");
    btnSubmit.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;
      const createInvoice = await modal.loading(xhr.post("/x/donate/create", {item_id:this.item_id}));
      if(createInvoice?.code === 404) {
        const hasActive = await modal.confirm({
          msg: lang.DN_PENDING,
          okx: lang.DN_OPEN_PENDING,
          cancelx: lang.DN_CLOSE_PENDING,
        });
        if(hasActive) {
          this.isLocked = false;
          const invoice = new Invoice({
            classBefore:this.classBefore, onComplete:this.onComplete, detail: createInvoice.data.data
          });
          return this.destroy(invoice);
        }
        this.isLocked = false;
        return this.destroy(this.classBefore);
      }
      if(!createInvoice.ok) {
        await modal.alert(lang[createInvoice.msg] || lang.ERROR);
        this.isLocked = false;
        return;
      }
      this.isLocked = false;
      const invoice = new Invoice({
        classBefore:this.classBefore, onComplete:this.onComplete, detail: createInvoice.data
      });
      return this.destroy(invoice);
    }
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
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
    this.writeDetail();
    this.btnListener();
  }
}

export class Invoice {
  constructor({onComplete, classBefore, detail}) {
    this.id = "invoice";
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.detail = detail;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "kulonXmidtrans");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-duotone fa-regular fa-gem"></i> ${lang.DN_TITLE}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <div class="form">
          <div class="field">
            <div class="nh">ID: #${this.detail.order_id}</div>
          </div>
          <div class="field">
            <div class="input">
              <div class="nc">
                <img src="${this.detail.qr}" alt="qris" />
                <p>${lang.DN_TXT_HELP}</p>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_PRICE}:</div>
              <div class="value" x-prc="price"><span></span></div>
            </div>
          </div>
          <div class="field">
            <div class="input">
              <div class="label">${lang.DN_TXT_EXPIRY}:</div>
              <div class="value" x-exd="expire"><span></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    this.eprice = this.el.querySelector(`[x-prc]`);
    this.lexpiry = this.el.querySelector(`[x-exd]`);
  }
  writeDetail() {
    this.eprice.innerHTML = "Rp" + this.detail.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    this.lexpiry.innerHTML = new Date(this.detail.expiry).toLocaleString()
  }
  btnListener() {
    const btnClose = this.el.querySelector(".btn-close");
    btnClose.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore);
    }
  }
  async settlement() {
    await this.destroy("stop");
    const openMail = await modal.confirm({
      msg: lang.DN_SETTLEMENT,
      okx: lang.DN_NOW_SETTLEMENT,
      cancelx: lang.DN_LATER_SETTLEMENT,
      ic: "circle-check"
    });
    if(!openMail) {
      return this.classBefore.init();
    }
    const mail = new Mails({onComplete:this.onComplete, classBefore:this.classBefore});
    return mail.init();
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
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
    this.writeDetail();
    this.btnListener();
  }
}