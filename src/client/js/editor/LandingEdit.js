import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import StartEditor from "./StartEdit.js";

const urlParams = new URLSearchParams(window.location.search);
const skipSplash = urlParams.get("skipSplash");

export default class LandingEdit {
  createElement() {
    this.el = document.createElement("p");
    this.el.classList.add("LandingEdit");
    this.el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Connecting<br/><i class="fa-solid fa-map"></i> <i class="fa-regular fa-map"></i> <i class="fa-light fa-map"></i> <i class="fa-thin fa-map"></i> <i class="fa-duotone fa-solid fa-map"></i> <i class="fa-duotone fa-regular fa-map"></i> <i class="fa-duotone fa-light fa-map"></i> <i class="fa-duotone fa-thin fa-map"></i> <i class="fa-sharp fa-solid fa-map"></i> <i class="fa-sharp fa-regular fa-map"></i> <i class="fa-sharp fa-light fa-map"></i> <i class="fa-sharp fa-thin fa-map"></i> <i class="fa-sharp-duotone fa-solid fa-map"></i> <i class="fa-sharp-duotone fa-regular fa-map"></i> <i class="fa-sharp-duotone fa-light fa-map"></i> <i class="fa-sharp-duotone fa-thin fa-map"></i>`;
  }
  async checkUser() {
    const isUser = await xhr.get("/x/auth/isUser");
    if(isUser && isUser.code === 403) {
      this.el.innerHTML = `You are not allowed to access this page<br/>This page can only be accessed by admins<br/><a href="/app">Back to App</a>`;
      return;
    }
    if(isUser && isUser.code !== 200) {
      this.el.innerHTML = `Please login to the game first before start the editor<br/><a href="/app?returnPage=editor${skipSplash?"&skipSplash=1":""}">Login</a>`;
      return;
    }
    this.el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Getting Editor Ready`;
    this.checkMapData();
  }
  async checkMapData() {
    await modal.waittime(1200);
    const mapData = await xhr.get("/x/admin/editor-mapdata");
    this.el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Loading`;
    await modal.waittime(1000);
    if(!mapData.ok || mapData.code !== 200) {
      await modal.waittime(1200);
      return this.checkMapData();
    }
    this.destroy();
    new StartEditor({mapdata: mapData.data}).run();
  }
  destroy() {
    this.el.remove();
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.checkUser();
  }
}