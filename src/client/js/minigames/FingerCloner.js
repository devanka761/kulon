import utils from "../main/utils.js";
import asset from "../manager/asset.js";
import Kaudio from "../manager/Kaudio.js";
import playerState from "../manager/PlayerState.js";


const fingImg = [ "fingclo_a.svg", "fingclo_b.svg", "fingclo_c.svg" ];

export default class FingerCloner {
  constructor({onComplete}) {
    this.id = "minigame";
    this.onComplete = onComplete;
    this.imgpar = 0;
    this.scale = 2;
    this.tutordone = false;
    this.nFingImg = [];
    this.connections = null;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("FingClo");
    this.el.innerHTML = `
    <div class="conn">
      <div class="top">
        <div class="left">
          <div class="desc">target</div>
          <div class="content" data-target="fingclo"></div>
        </div>
        <div class="right">
          <div class="desc">components</div>
          <div class="content">
            <div class="box" data-connections="fingclo"></div>
          </div>
        </div>

      </div>
      <div class="bottom">
        <div class="left">
          <div class="title">targets</div>
          <div class="step" data-step="fingclo">
            <div class="sq"></div>
            <div class="sq"></div>
            <div class="sq"></div>
          </div>
        </div>
        <div class="right">
          <div class="btn btn-abort" data-abort="fingclo">ABORT</div>
        </div>
      </div>
    </div>`;
    this.target = this.el.querySelector("[data-target]");
    this.connections = this.el.querySelector("[data-connections]");
  }
  tutorPopup() {
    const elTutor = document.createElement("div");
    elTutor.classList.add("tutor");
    elTutor.innerHTML = `
    <div class="box">
      <p class="title"><b>Fingerprint Cloner</b></p>
      <ul>
        <li>Objek di kiri adalah target sidik jari</li>
        <li>Objek di kanan adalah komponen sidik jari</li>
      </ul>
      <ol>
        <li>Urutkan komponen sehingga cocok dengan target</li>
        <li>Tekan panah (kanan - kiri) pada komponen untuk pindah urutan</li>
        <li>Tekan "ABORT" untuk membatalkan</li>
      </ol>
      <ul>
        <li>Cloner memiliki 3 koneksi yang harus diselesaikan</li>
      </ul>
      <div class="btn btn-ok" role="button" data-tutor="next">LANJUT</div>
    </div>`;
    this.el.appendChild(elTutor);
    const btnOk = elTutor.querySelector("[data-tutor]");
    btnOk.onclick = () => {
      elTutor.classList.add("out");
      setTimeout(() => { elTutor.remove() }, 400);
    }
  }
  shuffleImg() {
    for(let i=0;i<3;i++) {
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
        <div class="desc">${this.imgpar + 1}/3</div>
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
  nextConn() {
    const elConns = this.el.querySelectorAll("[data-step] .sq")[this.imgpar];
    elConns.classList.add("done");
  }
  abortListener() {
    const btnAbort = this.el.querySelector("[data-abort]");
    btnAbort.onclick = () => {
      this.onLastCheck(false);
    }
  }
  async placeConnections() {
    await this.stageDetail();
    this.nextConn();

    if(!this.tutordone) {
      this.tutorPopup();
      this.tutordone = true;
    }

    const img = new Image();
    img.src = asset[this.nFingImg[this.imgpar]].src;
    img.alt = "Fingerprint Cloner Target";

    this.imgTarget = img;
    this.target.appendChild(img);

    const components = [];

    await new Promise(resolve => {
      img.onload = () => {
        const imgHeight = () => {
          return this.imgTarget.offsetHeight;
        }
        const fingcoor = [
          0,
          (imgHeight() / 8) + 6,
          imgHeight() - ((imgHeight() / 8) * 6) + 6,
          imgHeight() - ((imgHeight() / 8) * 5) + 6,
          imgHeight() - ((imgHeight() / 8) * 4) + 6,
          imgHeight() - ((imgHeight() / 8) * 3) + 6,
          imgHeight() - ((imgHeight() / 8) * 2) + 6,
          imgHeight() - (imgHeight() / 8) + 6
        ]

        for(let i=0;i<8;i++) {
          const imgcover = document.createElement("div");
          imgcover.classList.add("imgcover");
          imgcover.innerHTML = `
            <div class="aleft arrow"><i class="fa-solid fa-chevron-left"></i></div>
            <div class="aright arrow"><i class="fa-solid fa-chevron-right"></i></div>
          `;
          imgcover.style.width =  `${this.imgTarget.offsetWidth}px`;
          imgcover.style.height = `${(this.imgTarget.offsetHeight / 8) - 5}px`;
          let definePos = i === 0 ? 7 : Math.floor(Math.random() * fingcoor.length);
          let setCoor = fingcoor[definePos];
          imgcover.setAttribute("data-pos", i);
          imgcover.setAttribute("data-coor", definePos);
          imgcover.style.backgroundImage = `url(${img.src})`;
          imgcover.style.backgroundPositionY = `-${setCoor}px`;
          this.connections.appendChild(imgcover);

          const arrow_left = imgcover.querySelector(".aleft.arrow");
          arrow_left.onclick = () => {
            Kaudio.play("sfx", "hack_select2");
            let oCoor = Number(imgcover.getAttribute("data-coor"));
            oCoor--;
            if(oCoor < 0) oCoor = 7;
            imgcover.setAttribute("data-coor", oCoor);
            imgcover.style.backgroundPositionY = `-${fingcoor[oCoor]}px`;
            this.checkConnections();
          }
          const arrow_right = imgcover.querySelector(".aright.arrow");
          arrow_right.onclick = () => {
            Kaudio.play("sfx", "hack_select2");
            let oCoor = Number(imgcover.getAttribute("data-coor"));
            oCoor++;
            if(oCoor > 7) oCoor = 0;
            imgcover.setAttribute("data-coor", oCoor);
            imgcover.style.backgroundPositionY = `-${fingcoor[oCoor]}px`;
            this.checkConnections();
          }
        }

        resolve();
      }

      this.sizeListener(true);
    });
  }
  async checkConnections() {
    const elConns = this.connections.querySelectorAll(".imgcover");
    let conCorrect = 0;
    elConns.forEach(elConn => {
      if(elConn.getAttribute("data-pos") === elConn.getAttribute("data-coor")) conCorrect++;
    });
    if(conCorrect >= 8) {
      setTimeout(() => {
        Kaudio.play("nfx1", "Hack_Scanning");
      }, 100);
      const fingscan = document.createElement("div");
      fingscan.classList.add("fingscan");
      fingscan.innerHTML = `
      <div class="content">
          <div></div>
          <div class="box">
            <div class="connection"></div>
            <div class="connection"></div>
            <div class="connection"></div>
            <div class="connection"></div>
          </div>
          <div class="desc">CHECKING</div>
      </div>`;
      this.el.appendChild(fingscan);
      await utils.wait(1500);
      Kaudio.play("nfx1", "Hack_Match");
      fingscan.querySelector(".desc").innerHTML = "CONNECTED";
      fingscan.querySelector(".desc").classList.add("cyan");
      fingscan.querySelector(".box").classList.add("correct");
      await utils.wait(1500);
      fingscan.classList.add("out");
      await utils.wait(400);
      fingscan.remove();
      this.imgTarget.remove();
      this.imgTarget = null;
      const elConnImgs = this.connections.querySelectorAll(".imgcover");
      elConnImgs.forEach(elConnImg => elConnImg.remove());
      if(this.imgpar > 1) return this.onLastCheck(true);
      this.imgpar++;
      this.placeConnections();
    }
  }
  async onLastCheck(condition) {
    if(condition) {
      Kaudio.play("sfx", "Hack_Success");
    } else {
      Kaudio.play("sfx", "Hack_Failed");
    }
    const elLastCheck = document.createElement("div");
    elLastCheck.classList.add("fingscan", (condition ? "true" : "false"));
    elLastCheck.innerHTML = `
    <div class="content">
      <div class="desc"></div>
      <div class="desc" style="color:#000000">CONNECTION ${condition ? "RESOLVED" : "REJECTED"}</div>
      <div class="desc"></div>
    </div>`;
    this.el.appendChild(elLastCheck);
    await utils.wait(2500);
    elLastCheck.classList.add("out");
    Kaudio.play("bgm", "inside_bgm", 1);
    await utils.wait(400);
    elLastCheck.remove();
    this.destroy(condition ? "LANJUT" : "BATAL");
  }
  sizeListener(condition) {
    const resizing = () => {
      if(!this.imgTarget) return;
      const imgHeight = () => {
        return this.imgTarget.offsetHeight;
      }
      const fingcoor = [
        0,
        (imgHeight() / 8) + 6,
        imgHeight() - ((imgHeight() / 8) * 6) + 6,
        imgHeight() - ((imgHeight() / 8) * 5) + 6,
        imgHeight() - ((imgHeight() / 8) * 4) + 6,
        imgHeight() - ((imgHeight() / 8) * 3) + 6,
        imgHeight() - ((imgHeight() / 8) * 2) + 6,
        imgHeight() - (imgHeight() / 8) + 6
      ]

      const elConns = this.connections.querySelectorAll(".imgcover");
      elConns.forEach(elConn => {
        elConn.style.width = `${this.imgTarget.offsetWidth}px`;
        elConn.style.height = `${(this.imgTarget.offsetHeight / 8) - 5}px`;
        let i = Number(elConn.getAttribute("data-coor"));
        elConn.style.backgroundPositionY = `-${fingcoor[i]}px`;
      })
    }

    if(condition) {
      window.removeEventListener("resize", resizing);
      window.addEventListener("resize", resizing);
    } else {
      window.removeEventListener("resize", resizing);
    }
  }
  destroy(next) {
    return new Promise(async resolve => {
      this.sizeListener(false);
      this.el.remove();
      this.imgpar = 0;
      this.tutordone = false;
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
    this.placeConnections();
    this.abortListener();
  }
}