import modal from "../helper/modal.js";
import Landing from "../pages/Landing.js";

let tempPeer = null;
let desktopTest = null;

function goodAgent() {
  desktopTest.destroy();
  window.removeEventListener("keydown", goodAgent);
  window.removeEventListener("blur", notFocusing);
  new Landing().init(tempPeer);
}
function notFocusing() {
  desktopTest.updateTest(false);
}
export default class DesktopTest {
  constructor({peer}) {
    tempPeer = peer;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("DesktopTest");
    this.el.innerHTML = `
    <div class="box">
      <div class="dl-summary">
        <p><b>This game requires a physical keyboard</b></p>
        <p>If you're on mobile, please connect a keyboard or use a desktop</p>
      </div>
      <div class="dl-test">
        <div class="btn btn-test">CLICK TO CHECK</div>
      </div>
      <div class="dl-actions">
        <a href="/" class="btn btn-exit"><b>EXIT</b></a>
      </div>
    </div>`;
    this.box = this.el.querySelector(".box");
    this.btnTest = this.el.querySelector(".btn-test");
  }
  updateTest(cond) {
    if(cond) {
      this.box.classList.add("wait");
      this.btnTest.innerHTML = "PRESS ANY KEY TO CONTINUE";
    } else {
      this.box.classList.remove("wait");
      this.btnTest.innerHTML = "CLICK TO CHECK";
    }
  }
  checkAgent() {
    window.addEventListener("keydown", goodAgent);
    window.addEventListener("blur", notFocusing);
    this.btnTest.onclick = () => this.updateTest(true);
  }
  destroy() {
    this.el.remove();
    this.el = null;
  }
  async init() {
    desktopTest = this;
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
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.updateTest(false);
    this.checkAgent();
  }
}