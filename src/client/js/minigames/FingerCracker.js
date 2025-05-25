import utils from "../main/utils.js";
import asset from "../manager/asset.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";

const fingImg = [ "fingcra_a.svg", "fingcra_b.svg", "fingcra_c.svg", "fingcra_d.svg" ];

export default class FingerCracker {
  constructor({onComplete}) {
    this.id = "minigame";
    this.onComplete = onComplete;
    this.imgpar = 0;
    this.imgwr = 0;
    this.scale = 2;
    this.tutordone = false;
    this.puzzle = { crack: [], attempt: [] };
    this.nFingImg = [];
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("FingCra");
    this.el.innerHTML = `
    <div class="conn">
      <div class="left">
        <div class="desc">target</div>
        <div class="content" data-target="fingcra"></div>
        <div class="desc">connection</div>
        <div class="step v1">
          <div class="sq"></div>
          <div class="sq"></div>
          <div class="sq"></div>
          <div class="sq"></div>
        </div>
      </div>
      <div class="center">
        <div class="desc">attempts</div>
        <div class="step v2">
          <div class="sq"></div>
          <div class="sq"></div>
          <div class="sq"></div>
        </div>
        <div class="content">
          <div class="content-outer" data-connections="fingcra"></div>
        </div>
      </div>
      <div class="right">
        <div class="btn btn-check" role="button" data-check="fingcra">check</div>
        <div class="btn btn-abort" role="button" data-abort="fingcra">abort</div>
      </div>
    </div>`;
  }
  shuffleImg() {
    for(let i=0;i<4;i++) {
      const uFing = fingImg.filter(_n => !this.nFingImg.includes(_n));
      this.nFingImg.push(uFing[Math.floor(Math.random() * uFing.length)]);
    }
  }
  stageDetail() {
    return new Promise(async resolve => {
      if(this.imgpar >= 1) Kaudio.play("sfx", "Hack_Next");
      const stage = document.createElement("div");
      stage.classList.add("fingscan");
      stage.innerHTML = `
      <div class="content">
        <div class="desc">CONNECTION</div>
        <div class="desc">${this.imgpar + 1}/4</div>
        <div class="desc">WAITING</div>
      </div>`;
      this.el.appendChild(stage);
      await utils.wait(1500);
      stage.classList.add("out");
      await utils.wait(400);
      stage.remove();
      resolve();
    });
  }
  setCanvas(imgsrc) {
    return new Promise(resolve => {
      const elCloneTarget = this.el.querySelector("[data-target]");
      const img = new Image();
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.onload = async() => {
        const offcanvas = document.createElement("canvas");
        offcanvas.width = img.width;
        offcanvas.height = img.height;
        const ctx = offcanvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        img.remove();
        resolve(offcanvas);
      }
      img.src = imgsrc;
      elCloneTarget.append(img);
    });
  }
  async placeConnections() {
    await this.stageDetail();
    this.nextConn();
    this.btnCheck.classList.add("disabled");

    if(!this.tutordone) {
      this.tutorPopup();
      this.tutordone = true;
    }

    const img_1 = await this.setCanvas(asset[this.nFingImg[this.imgpar]].src);
    const img_2 = await this.setCanvas(asset[this.nFingImg[this.imgpar === 3 ? 0 : this.imgpar + 1]].src);

    const elCloneTarget = this.el.querySelector("[data-target]");
    const components = [];

    await new Promise(resolve => {
      img_1.style.maxWidth = "100%";
      img_1.style.maxHeight = "100%";
      elCloneTarget.appendChild(img_1);
      let imgWidth = img_1.clientWidth /* * this.scale */;
      let imgHeight = img_1.clientHeight /* * this.scale */;

      const fingcoor = {
        aa: [0, 0],
        ab: [imgWidth - (imgWidth / 2), 0],
        ba: [0, imgHeight / 3],
        bb: [imgWidth - (imgWidth / 2), imgHeight / 3],
        ca: [0, imgHeight - (imgHeight / 3)],
        cb: [imgWidth - (imgWidth / 2), imgHeight - (imgHeight / 3)]
      }

      let oL = [];
      const nL = Object.keys(fingcoor);

      for(let i=0; i<4; i++) {
        const uL = nL.filter(_n => !oL.includes(_n));
        const rL = uL[Math.floor(Math.random() * uL.length)];
        oL.push(rL);

        const canvas = document.createElement("canvas");
        canvas.classList.add("connection-canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = imgHeight;
        canvas.height = imgHeight;

        ctx.drawImage(img_1, fingcoor[rL][0], fingcoor[rL][1], imgHeight, imgHeight, 0, 0, imgHeight * 3, imgHeight * 3);

        let comID = components.length + 1;
        this.puzzle.crack.push(comID.toString());

        components.push({"id": comID.toString(), "img": canvas});
      }
      resolve();
    });

    await new Promise(resolve => {
      img_2.style.maxWidth = "100%";
      img_2.style.maxHeight = "100%";
      img_2.style.visibility = "hidden";
      elCloneTarget.appendChild(img_2);
      let imgWidth = img_2.clientWidth /* * this.scale */;
      let imgHeight = img_2.clientHeight /* * this.scale  */;

      const fingcoor = {
        aa: [0, 0],
        ab: [imgWidth - (imgWidth / 2), 0],
        ba: [0, imgHeight / 3],
        bb: [imgWidth - (imgWidth / 2), imgHeight / 3],
        ca: [0, imgHeight - (imgHeight / 3)],
        cb: [imgWidth - (imgWidth / 2), imgHeight - (imgHeight / 3)]
      }

      let oL = [];
      const nL = Object.keys(fingcoor);

      for(let i=0; i<5; i++) {
        const uL = nL.filter(_n => !oL.includes(_n));
        const rL = uL[Math.floor(Math.random() * uL.length)];
        oL.push(rL);

        const canvas = document.createElement("canvas");
        canvas.classList.add("connection-canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = imgHeight;
        canvas.height = imgHeight;

        ctx.drawImage(img_2, fingcoor[rL][0], fingcoor[rL][1], imgHeight, imgHeight, 0, 0, imgHeight * 3, imgHeight * 3);

        components.push({"id": (components.length + 1).toString(), "img": canvas});
      }
      img_2.remove();
      resolve();
    });

    const oldCom = [];
    const newCom = components.map(_n => _n.id);

    for(let i=0;i<9;i++) {
      const unlCom = newCom.filter(_n => !oldCom.includes(_n));
      const resCom = unlCom[Math.floor(Math.random() * unlCom.length)];

      oldCom.push(resCom);
    }
    oldCom.forEach(conID => {
      let parConn = components.find(_n => _n.id == conID);
      const imgcover = document.createElement("div");
      imgcover.classList.add("imgcover");
      imgcover.appendChild(parConn.img);

      const elConn = this.el.querySelector("[data-connections]");
      elConn.appendChild(imgcover);

      imgcover.onmousedown = () => {

        const imgcovers = elConn.querySelectorAll(".selected");

        if(imgcover.classList.contains("selected")) {
          Kaudio.play("sfx", "hack_select");
          imgcover.classList.remove("selected");
          this.puzzle.attempt = this.puzzle.attempt.filter(_n => _n !== conID);
        } else {
          if(imgcovers.length < 4) {
            Kaudio.play("sfx", "hack_select");
            imgcover.classList.add("selected");
            this.puzzle.attempt.push(conID);
          }
        }
        
        const currimgcovers = elConn.querySelectorAll(".selected");
        if(currimgcovers.length >= 4) {
          this.btnCheck.classList.remove("disabled");
        } else {
          if(!this.btnCheck.classList.contains("disabled")) this.btnCheck.classList.add("disabled");
        }
      }
    });

    const elTarget = this.el.querySelector("[data-target]");
    elTarget.appendChild(img_1);
  }
  tutorPopup() {
    const elTutor = document.createElement("div");
    elTutor.classList.add("tutor");
    elTutor.innerHTML = `
    <div class="box">
      <p class="title"><b>Fingerprint Cracker</b></p>
      <ul>
        <li>Objek di kiri adalah target sidik jari</li>
        <li>Objek di kanan adalah komponen sidik jari</li>
      </ul>
      <ol>
        <li>Carilah komponen yang merupakan bagian dari target</li>
        <li>Pilih 4 komponen dan tekan "CHECK"</li>
        <li>Tekan "ABORT" untuk membatalkan</li>
      </ol>
      <ul>
        <li>Batas kesempatan cracker adalah 3 kali</li>
        <li>Cracker memiliki 4 koneksi yang harus diselesaikan</li>
      </ul>
      <div class="btn btn-ok" role="button" data-tutor="next">LANJUT</div>
    </div>`;
    this.el.appendChild(elTutor);
    const btnOk = elTutor.querySelector("[data-tutor]");
    btnOk.onclick = () => {
      Kaudio.play("nfx1", "menu_exit");
      elTutor.classList.add("out");
      setTimeout(() => { elTutor.remove() }, 400);
    }
  }
  checkListener() {
    let isCorrect = false;

    const btnAbort = this.el.querySelector("[data-abort]");
    btnAbort.onclick = () => {
      this.onLastCheck(null);
    }

    this.btnCheck = this.el.querySelector("[data-check]");
    this.btnCheck.onclick = async() => {
      if(this.btnCheck.classList.contains("disabled")) return;
      Kaudio.play("nfx1", "menu_select");
      const corrects = this.puzzle.crack.filter(key => !this.puzzle.attempt.includes(key));
      if(corrects.length > 0) {
        isCorrect = false;
      } else {
        isCorrect = true;
      }

      const fingscan = document.createElement("div");
      fingscan.classList.add("fingscan");
      this.el.appendChild(fingscan);
      fingscan.innerHTML = `
      <div class="content">
        <div class="desc cyan" style="display:none">SCANNING</div>
      </div>`;
      await utils.wait(500);
      const fingscan_img = new Image();
      fingscan_img.src = asset[this.nFingImg[this.imgpar]].src;
      await new Promise(resolve => {
        fingscan_img.onload = () => {
          Kaudio.play("sfx", "Hack_Scanning");
          const fingscan_box = document.createElement("div");
          fingscan_box.classList.add("box");
          fingscan_box.appendChild(fingscan_img);
          fingscan.querySelector(".content").prepend(fingscan_box);
          let fingscan_desc = fingscan.querySelector(".desc");
          fingscan_desc.style.display = "block";
          resolve();
        }
      })
      await utils.wait(1000);
      let fingscan_desc = fingscan.querySelector(".desc");
      if(isCorrect) {
        Kaudio.play("sfx", "Hack_Match");
        fingscan.classList.add("true");
        fingscan_desc.innerHTML = "GRANTED";
        await utils.wait(1500);
        fingscan.classList.add("out");
        await utils.wait(400);
        fingscan.remove();
        const elTargetImg = this.el.querySelector("[data-target] canvas");
        if(elTargetImg) elTargetImg.remove();
        const elConnImgs = this.el.querySelectorAll("[data-connections] .imgcover");
        elConnImgs.forEach(elConnImg => elConnImg.remove());
        isCorrect = false;
        if(this.imgpar >= 3) return this.onLastCheck(true);
        this.imgpar++;
        this.puzzle.crack = [];
        this.puzzle.attempt = [];
        this.placeConnections();
      } else {
        Kaudio.play("sfx", "Hack_Error");
        fingscan.classList.add("false");
        fingscan_desc.innerHTML = "DENIED";
        await utils.wait(750);
        fingscan.classList.add("out");
        await utils.wait(400);
        fingscan.remove();
        this.stayConn();
      }
    }
  }
  nextConn() {
    const elConns = this.el.querySelectorAll(".conn .left .step.v1 .sq")[this.imgpar];
    elConns.classList.add("done");
  }
  stayConn() {
    const elConns = this.el.querySelectorAll(".conn .center .step.v2 .sq")[this.imgwr];
    elConns.classList.add("done");
    if(this.imgwr > 1) return this.onLastCheck(false);
    this.imgwr++;
  }
  async onLastCheck(condition) {
    const elLastCheck = document.createElement("div");
    elLastCheck.classList.add("fingscan", condition ? "true" : "false");
    elLastCheck.innerHTML = `
    <div class="content" style="background-color:${condition ? "#55ac55" : "#f76767"}">
      <div class="desc"></div>
      <div class="desc" style="color:#000000">CONNECTION ${condition ? "RESOLVED" : "REJECTED"}</div>
      <div class="desc"></div>
    </div>`;
    this.el.appendChild(elLastCheck);
    if(condition) {
      Kaudio.play("sfx", "Hack_Success");
    } else {
      Kaudio.play("sfx", "Hack_Failed");
    }
    await utils.wait(2500);
    elLastCheck.classList.add("out");
    Kaudio.play("bgm", "inside_bgm", 1);
    await utils.wait(400);
    elLastCheck.remove();
    this.destroy(condition ? "LANJUT" : "BATAL");
  }
  destroy(next) {
    return new Promise(async resolve => {
      this.el.remove();
      this.imgpar = 0;
      this.tutordone = false;
      this.puzzle.crack = [];
      this.puzzle.attempt = [];
      this.nFingImg = [];
      playerState.pmc = null;
      resolve();
      if(!next) return this.onComplete();
      if(typeof next === "string") return this.onComplete(next);
      if(typeof next !== "string") return next.init();
    });
  }
  init() {
    playerState.pmc = this;
    Kaudio.play("sfx", "hack_intro");
    Kaudio.play("bgm", "hack_bgm", 1);
    this.shuffleImg();
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.checkListener();
    this.placeConnections();
  }
}