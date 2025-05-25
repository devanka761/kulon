import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import LoadAssets from "../manager/LoadAssets.js";
import Editor from "./Editor.js";

export default class StartEditor {
  constructor({mapdata}) {
    this.mapdata = mapdata;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("MapChooser");
    this.el.innerHTML = `
    <div class="Map-Content">
      <div class="Map-About">
        <div class="Map-Meta">
          <div class="Map-Title">Kulon Editor</div>
          <div class="Map-Desc">by <a href="https://devanka.id" target="_blank">Devanka 761</a></div>
        </div>
        <div class="Map-Back">
          <a href="/app" class="btn btn-back"><i class="fa-solid fa-gamepad"></i> Play Kulon</a>
        </div>
      </div>
      <div class="Map-List">
      </div>
    </div>
    <div class="Map-Actions">
      <div class="btn btn-new-project">
        <i class="fa-solid fa-plus"></i> <span>New Project</span>
      </div>
    </div>`;
    this.emaplist = this.el.querySelector(".Map-List");
  }
  btnListener() {
    const btnNewProject = this.el.querySelector(".btn-new-project");
    btnNewProject.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const project_name = await modal.prompt("Projet Name");
      if(!project_name) {
        this.isLocked = false;
        return;
      }
      const setNewProject = await modal.loading(xhr.post("/x/admin/editor-newproject", {project_name}));
      if(!setNewProject.ok) {
        await modal.alert(setNewProject.msg || "Something went wrong!");
        this.isLocked = false;
        return;
      }
      this.isLocked = false;
      this.destroy();
      new Editor({ project_name, mapdata: null }).run();
    }
  }
  writeMapData() {
    Object.keys(this.mapdata).forEach(k => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
      <div class="card-title"><span>${k}</span> <i class="fa-solid fa-pen"></i></div>
      <div class="card-actions">
        <div class="btn btn-delete"><i class="fa-solid fa-trash-can fa-fw"></i></div>
      </div>`;
      const cardDelete = card.querySelector(".btn-delete");
      cardDelete.onclick = async() => {
        if(this.isLocked) return;
        this.isLocked = true;
        await modal.alert("Error: This \"destroyProject\" method can only be accessed by admins");
        this.isLocked = false;
      }
      const cardTitle = card.querySelector(".card-title");
      cardTitle.onclick = async() => {
        if(this.isLocked) return;
        this.isLocked = true;
        const loadProject = await modal.loading(xhr.get(`/x/admin/editor-loadproject/${k}`));
        if(!loadProject.ok) {
          await modal.alert(loadProject.msg || "Something When Wrong");
          this.isLocked = false;
          return;
        }
        this.setMapData(loadProject.data.id);
      }
      this.emaplist.append(card);
    });
  }
  async setMapData(fileid) {
    const mpjson = await modal.loading(xhr.get(`/json/maps/mp_${fileid}.json`), "LOADING MAPS");
    const csjons = await modal.loading(xhr.get(`/json/scenes/cs_${fileid}.json`), "LOADING COMPLETED EVENTS") || [];
    const stjson = await modal.loading(xhr.get(`/json/assets/st_${fileid}.json`), "GETTING ASSETS INFORMATION");
    await modal.loading(new LoadAssets({skins: stjson}).run(), "DOWNLOADING ASSETS");
    this.isLocked = false;
    this.destroy();
    new Editor({ project_name:fileid, mapdata: mpjson, finishedEvents: csjons }).run();
  }
  destroy() {
    if(this.isLocked) return;
    this.isLocked = true;
    this.el.remove();
    this.isLocked = false;
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.writeMapData();
    this.btnListener();
  }
  /*
  setListener() {
    this.inp = document.createElement("input");
    this.inp.id = "jsonmap";
    this.inp.name = "jsonmap";
    this.inp.type = "file";
    this.inp.onchange = () => {
      if(this.isLocked) return;
      this.isLocked = true;
      const file = this.inp.files[0];
      const reader = new FileReader();
      reader.onload = () => this.setMapData(file.name, reader.result);
      reader.readAsText(file);
    }
    this.el.append(this.inp);
  }
  async setMapData(filename, filejson) {
    this.el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> LOADING`;
    this.inp.remove();
    const mapname = filename.replace("mp_", "");
    const nextAssets = await xhr.get(`/json/assets/st_${mapname}`);
    await new LoadAssets({skins: nextAssets}).run();
    this.isLocked = false;
    this.destroy();
    new Editor({ project_name, mapdata: JSON.parse(filejson) }).run();
  }
  */
}