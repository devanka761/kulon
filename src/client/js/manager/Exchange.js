import cloud_items from "../../../../public/json/items/cloud_items.json";
import shop_items from "../../../../public/json/items/shop_items.json";
import asset from "../manager/asset.js";
import modal from "../helper/modal.js";
import playerState from "./PlayerState.js";
import db from "./db.js";
import xhr from "../helper/xhr.js";
import Splash from "../helper/Splash.js";
import { klang, lang } from "../helper/lang.js";
import Kaudio from "./Kaudio.js";

function drawImg(imgSrc, imgAlt) {
  const img = new Image();
  img.src = imgSrc;
  img.alt = imgAlt;
  return img;
}

export class Exchange {
  constructor({ onComplete, classBefore, item_id /*, req_id, amount, price */ }) {
    this.onComplete = onComplete;
    this.classBefore = classBefore;
    this.item_id = item_id;
    this.items = null;
    this.item_n = 0;
    this.req_n = 0;
    this.onPrice = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("fuwi", "f-exchange");
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-right-left"></i> ${lang.EXC_TITLE}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <form class="form" action="/x/exchange-items" method="post" id="exchange-form">
          <div class="field">
            <div class="economies">
              <div class="eco eco-amount">
                <span>0</span>
              </div>
              <div class="eco eco-price">
                <span>0</span>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="con-area">
              <div class="img img-price">
              </div>
              <div class="text"><i class="fa-solid fa-angles-right"></i></div>
              <div class="img img-amount">
              </div>
            </div>
          </div>
          <div class="field">
            <div class="con-area">
              <p>${lang.EXC_CONVERT_TO}</p>
            </div>
          </div>
          <div class="field">
            <div class="text-box">
              <span>0</span>
            </div>
          </div>
          <div class="field">
            <div class="input-manager">
              <div class="btn btn-minus">-</div>
              <div class="inp"><input type="range" name="exchange-inp" id="exchange-inp" min="1" value="1"/></div>
              <div class="btn btn-plus">+</div>
            </div>
          </div>
          <div class="field">
            <div class="price">
              <div class="text">${lang.EXC_PRICE}:</div>
              <div class="object">
                <span>0</span>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="actions">
              <div class="btn btn-cancel btn-close">${lang.CANCEL}</div>
              <div class="btn btn-ok">${lang.EXC_BTN_OK}</div>
            </div>
          </div>
        </form>
      </div>
    </div>`;
    this.eaction = this.el.querySelector(".actions");
    this.btnSubmit = this.el.querySelector(".btn-ok");
  }
  btnListener() {
    const btnCloses = this.el.querySelectorAll(".btn-close");
    btnCloses.forEach(btn => btn.onclick = () => {
      Kaudio.play("sfx", "menu_exit");
      this.destroy(this.classBefore)
    });
  }
  updateEconomies() {
    this.items = db.char.backpack;
    const itemToShop = shop_items.find(k => k.id === this.item_id);
    this.req_id = itemToShop.req;
    this.amount = itemToShop.amount;
    this.price = itemToShop.price;

    const eeco1 = this.el.querySelector(".economies .eco-amount");
    const eeco2 = this.el.querySelector(".economies .eco-price");

    this.item_src1 = cloud_items.find(k => k.id === this.item_id);
    this.item_src2 = cloud_items.find(k => k.id === this.req_id);

    eeco1.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.alt));
    eeco2.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.alt));

    const xeco1 = Object.values(this.items).filter(k => k.id === this.item_id && (!k.expiry || k.expiry > Date.now())).map(k => k.amount || 0);
    const xeco2 = Object.values(this.items).filter(k => k.id === this.req_id && (!k.expiry || k.expiry > Date.now())).map(k => k.amount || 0);

    const aeco1 = this.el.querySelector(".economies .eco-amount span");
    const aeco2 = this.el.querySelector(".economies .eco-price span");

    this.item_n = xeco1.reduce((a,b) => a + b, 0);
    this.req_n = xeco2.reduce((a,b) => a + b, 0);

    aeco1.innerHTML = this.item_n;
    aeco2.innerHTML = this.req_n;

    const exch1 = this.el.querySelector(".con-area .img.img-amount");
    const exch2 = this.el.querySelector(".con-area .img.img-price");
    exch1.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.alt));
    exch2.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.alt));

    const eamt = this.el.querySelector(".text-box");
    const eprc = this.el.querySelector(".price .object");
    eamt.prepend(drawImg(asset[this.item_src1.src].src, this.item_src1.alt));
    eprc.prepend(drawImg(asset[this.item_src2.src].src, this.item_src2.alt));
  }
  priceListener() {
    const priceRate = this.price / this.amount;
    this.onPrice = this.price > this.amount;
    const maxExchange = Math.floor(this.onPrice ? this.req_n / priceRate : Math.floor((this.req_n / priceRate) * priceRate) / this.price);
    this.erange = this.el.querySelector("#exchange-inp");
    this.erange.max = maxExchange;
    if(maxExchange === 1) this.erange.min = 0;

    this.priceAmount = Number(this.onPrice ? Math.ceil(priceRate).toString() : this.price);

    this.eamount = this.el.querySelector(".text-box span");
    this.eamount.innerHTML = this.amount;

    this.eprice = this.el.querySelector(".price .object span");
    this.eprice.innerHTML = this.priceAmount;

    const fixRange = () => {
      if(maxExchange < 1) return;
      if(maxExchange === 1) this.erange.value = 1;
      const erangeVal = Number(this.erange.value);
      const amount_percent = erangeVal / maxExchange;
      const amount_value = Math.floor(amount_percent * (this.req_n / priceRate));
      this.eamount.innerHTML = amount_value;
      this.priceAmount = erangeVal * this.price;
      this.eprice.innerHTML = this.priceAmount;
    }

    this.erange.oninput = () => fixRange();
    const btnMinus = this.el.querySelector(".btn-minus");
    btnMinus.onmousedown = () => {
      Kaudio.play("sfx", "phone_selected");
      if(maxExchange < 1) return;
      const nextVal = Number(this.erange.min) < 1 ? 1 : Number(this.erange.value) - 1;
      this.erange.value = nextVal < Number(this.erange.min) ? this.erange.min : nextVal;
      fixRange();
    }
    const btnPlus = this.el.querySelector(".btn-plus");
    btnPlus.onmousedown = () => {
      Kaudio.play("sfx", "phone_selected");
      if(maxExchange < 1) return;
      const nextVal = Number(this.erange.value) + 1;
      this.erange.value = nextVal > Number(this.erange.max) ? this.erange.max : nextVal;
      fixRange();
    }
    this.btnSubmit.onclick = async() => {
      if(this.isLocked) return;
      Kaudio.play("sfx", "menu_select");
      this.isLocked = true;
      if(maxExchange < 1) {
        await modal.alert(lang.EXC_NOT_ENOUGH.replace("{price}", this.item_src2.name[klang.currLang]));
        this.isLocked = false;
        return;
      }
      const cvrtext = {
        msg: {
          id: "Sudah yakin?<br/>Setelah berhasil, penukaran tidak dapat dikembalikan",
          en: "Continue?<br/>You cannot undone the convertion once it completed"
        },
        okx: {
          id: "LANJUT",
          en: "CONVERT NOW"
        }
      };
      const convertConfirm = await modal.confirm({
        msg: cvrtext.msg[klang.currLang],
        okx: cvrtext.okx[klang.currLang]
      });
      if(!convertConfirm) {
        this.isLocked = false;
        return;
      }
      const convertResult = await modal.loading(xhr.post("/x/account/exchange", {
        item_id: this.item_id,
        req_id: this.req_id,
        price_amount: this.priceAmount
      }));
      if(!convertResult.ok) {
        await modal.alert(lang[convertResult.msg]?.replace("{price}", this.item_src2.name[klang.currLang]) || lang.ERROR);
        this.isLocked = false;
        return;
      }
      Object.keys(convertResult.data.new_amount).forEach(k => {
        if(!db.char.backpack[k]) db.char.backpack[k] = {};
        db.char.backpack[k].id = convertResult.data.new_amount[k].id;
        db.char.backpack[k].amount = convertResult.data.new_amount[k].amount;
      });
      await Splash(convertResult.data.rewards);
      this.isLocked = false;
      this.destroy(this.classBefore);
    }
    if(maxExchange < 1) {
      this.eprice.classList.add("minus");
      this.eaction.classList.add("single");
      this.btnSubmit.remove();
    }
  }
  destroy(next) {
    return new Promise(async resolve => {
      if(this.isLocked) return;
      this.isLocked = true;
      this.items = null;
      this.item_n = 0;
      this.req_n = 0;
      this.onPrice = false;
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
    this.priceListener();
  }
}