import Peer from "peerjs";
import Landing from "./Landing.js";
import ForceClose from "./ForceClose.js";
import DesktopTest from "../main/DesktopTest.js";
import modal from "../helper/modal.js";

function waittime(ts = 500, tsa = null) {
  const ms = ts - tsa || 0;
  return new Promise(resolve => setTimeout(resolve, ms));
}

const urlParams = new URLSearchParams(window.location.search);
const skipSplash = urlParams.get("skipSplash");

export default class Intros {
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Intros");
  }
  writeImage(img_src, img_alt) {
    return new Promise(async resolve => {
      const img = new Image();
      img.src = img_src;
      img.alt = img_alt;
      this.el.append(img);
      await waittime(2500);
      img.classList.add('out');
      await waittime(1000, 5);
      img.remove();
      resolve();
    });
  }
  async desktopTest(tempPeer) {
    if(window.innerWidth < 720 || window.innerHeight < 480) {
      const confExit = await modal.confirm({
        msg: `Your screen/browser/window size (<b>${window.innerWidth} x ${window.innerHeight}</b>) is too small to play this game<br/><br/>Please resize to at least <b>720 x 480</b>`,
        okx: "RELOAD",
        cancelx: "EXIT"
      });
      if(confExit) {
        window.location.reload();
        return;
      }
      window.location.href = "/";
      return;
    }
    return new Landing().init(tempPeer);
  }
  async writeAllInfo(tempPeer) {
    await this.writeImage("./images/dvnkz.png", "Devanka: Tipsy Corvus Studio");
    await this.writeImage("./images/Kulon.png", "Devanka: Kulon");
    this.el.remove();
    this.desktopTest(tempPeer);
    // new DesktopTest({peer: tempPeer}).init();
  }
  init() {
    let tempPeer = new Peer();
    tempPeer.on("error", err => {
      if(err.type === "browser-incompatible") {
        tempPeer.destroy();
        tempPeer.disconnect();
        tempPeer = null;
        return new ForceClose({
          msg_1: "Your browser is incompatible",
          msg_2: "Browser yang kamu gunakan tidak mendukung",
          action_text: "KEMBALI KE HOMEPAGE",
          action_url: "/"
        }).init();
      }
    });
    if(!isNaN(Number(skipSplash)) && Number(skipSplash) >= 1) return new Landing().init(tempPeer);
    this.createElement();
    document.querySelector('.app').append(this.el);
    this.writeAllInfo(tempPeer);
  }
}
