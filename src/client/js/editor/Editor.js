import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import asset from "../manager/asset.js";
import NewArea from "./NewArea.js";
import NewAsset from "./NewAsset.js";
import NewObject from "./NewObject.js";

const minZoom = 1;
const maxZoom = 5;
let coorTimeout = null;

export default class Editor {
  constructor({project_name, mapdata, finishedEvents}) {
    this.project_name = project_name;
    this.mapdata = mapdata || {};
    this.finishedEvents = finishedEvents || [];
    this.isLocked = false;
    this.currArea = null;
    this.currImg = null;
    this.currTiles = null;
    this.zoom = 2;
    this.mode = "Wall";
    this.tempMode = null;
    this.bulk = {};
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("Editor");
    this.el.innerHTML = `
    <div class="mode-outer">
      <div class="mode-title">Kulon Editor: ${this.project_name}</div>
      <div class="mode-content">
        <div class="mode-files">
          <div class="btn btn-add-files"><i class="fa-duotone fa-solid fa-folder-plus fa-fw"></i> Add Asset</div>
          <div class="btn btn-rem-files"><i class="fa-duotone fa-solid fa-folder-minus fa-fw"></i> Remove Asset</div>
        </div>
        <div class="mode-list">
          <div k-mode="Bulk" class="btn btn-mode">Bulk</div>
          <div class="btn btn-help"><i class="fa-duotone fa-circle-question fa-fw"></i></div>
          <div k-mode="Wall" class="btn btn-mode selected">Wall</div>
          <div k-mode="Space" class="btn btn-mode">Space</div>
          <div k-mode="Object" class="btn btn-mode">Object</div>
        </div>
      </div>
    </div>
    <div class="map-outer">
      <div class="file-outer">
        <div class="areas-outer">
          <div class="areas-actions">
            <div class="btn btn-add" title="New Area">
              <i class="fa-solid fa-plus fa-fw"></i>
            </div>
            <div class="btn btn-zoom-in" title="Zoom In">
              <i class="fa-sharp fa-solid fa-magnifying-glass-plus fa-fw"></i>
            </div>
            <div class="btn btn-zoom-out" title="Zoom Out">
              <i class="fa-sharp fa-solid fa-magnifying-glass-minus fa-fw"></i>
            </div>
            <div class="btn btn-remove" title="Delete Area">
              <i class="fa-solid fa-trash-can fa-fw"></i>
            </div>
            <div class="btn btn-finish" title="Finish Scenes">
              <i class="fa-solid fa-person-running fa-fw"></i>
            </div>
            <div class="btn btn-sz" title="Safe Zone">
              <i class="fa-solid fa-location-dot fa-fw"></i>
            </div>
            <div class="btn btn-rename" title="Rename">
              <i class="fa-solid fa-i fa-fw"></i>
            </div>
            <div class="btn btn-full" title="Full Screen">
              <i class="fa-solid fa-expand fa-fw"></i>
            </div>
          </div>
          <div class="areas-list">
            <ul></ul>
          </div>
        </div>
        <div class="actions-outer">
          <div class="actions-list">
            <div class="btn btn-export">SAVE <i class="fa-solid fa-caret-right"></i></div>
            <div class="btn btn-close">EXIT</div>
          </div>
        </div>
      </div>
      <div class="tile-outer">
        <div class="currmap">
        </div>
      </div>
    </div>`;
    this.arealist = this.el.querySelector(".areas-list ul");
    this.currmap = this.el.querySelector(".currmap");
    this.modeTitle = this.el.querySelector(".mode-title");
  }
  btnListener() {
    const btnHelp = this.el.querySelector(".btn-help");
    btnHelp.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      await modal.alert({msg:"Use <b><b>Bulk</b></b> to select many tiles at once<br/><br/>The bulk list can be set to <b><b>Walls</b></b> or <b><b>Spaces</b></b> by pressing certain buttons after tiles are selected<br/><br/>Yellow: on bulk<br/>Red: walls<br/>Green: cutscene spaces<br/>Blurple: objects<br/><i>&nbsp;</i>",ic:"circle-question"});
      this.isLocked = false;
    }
    const btnExport = this.el.querySelector(".btn-export");
    const btnClose = this.el.querySelector(".btn-close");
    btnExport.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const typelist = [
        {id: "preview", label: "Preview JSON Map File", actived: true},
        {id: "export", label: "Apply to Server"},
      ];
      const setType = await modal.select({
        msg: "Select Save Type",
        ic: "floppy-disk",
        opt: {
          name: "event-type",
          items: typelist
        }
      });
      if(!setType) {
        this.isLocked = false;
        return;
      }
      this.setSave(setType);
    }
    btnClose.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      const confClose = await modal.confirm("Exit Kulon Map Editor?");
      if(!confClose) {
        this.isLocked = false;
        return;
      }
      this.isLocked = false;
      this.destroy();
    }
    const btnAddAsset = this.el.querySelector(".btn-add-files");
    btnAddAsset.onclick = () => {
      if(this.isLocked) return;
      this.isLocked = true;
      new NewAsset({editor:this, type:1, project_name: this.project_name}).run();
    }
    const btnRemAsset = this.el.querySelector(".btn-rem-files");
    btnRemAsset.onclick = () => {
      if(this.isLocked) return;
      this.isLocked = true;
      new NewAsset({editor:this, type:0, project_name: this.project_name}).run();
    }
  }
  async renameArea() {
    let newName = await modal.prompt({msg: "New Area Name", val: this.currArea.replace("kulon", "")});
    if(!newName) return;
    newName = "kulon" + newName.replace(/\s/g, "");
    if(newName === this.currArea) return;
    const confName = await modal.confirm(`Renamve "${this.currArea}" to "${newName.replace("kulon", "")}"?`);
    if(!confName) return;
    const oldString = JSON.stringify(this.mapdata).toString();
    const oldArea = this.currArea;
    const liArea = this.arealist.querySelectorAll("li");
    liArea.forEach(li => li.remove());
    this.destroy(true);
    const newString = oldString.replaceAll(oldArea, newName);

    const newMapdata = JSON.parse(newString);
    this.mapdata = newMapdata;
    this.currArea = newName;
    this.run();
    // const passedData = {...this.mapdata[this.currArea]};
    // delete this.mapdata[this.currArea];
    // const liArea = this.arealist.querySelector(`#${this.currArea}`);
    // if(liArea) liArea.remove();
    // this.mapdata[newName] = passedData;
    // this.mapdata[newName].id = newName;
    // this.currArea = newName;
    // this.setAreaObj(this.mapdata[newName]);
    // this.setTileImage(this.mapdata[newName].id, this.mapdata[newName].lowerSrc);
  }
  editSafeZone(mapId) {
    return new Promise(async resolve => {
      const oldX = this.mapdata[mapId].safeZone?.x || null;
      const oldY = this.mapdata[mapId].safeZone?.y || null;
      const currSz = (oldX && oldY) ? `${oldX},${oldY}` : "";
      const coor = await modal.prompt({
        msg: `Set Safe Zone for Map ${mapId} (x,y)`,
        pholder: "ex: 7,12",
        val: currSz
      });
      if(!coor) return resolve();
      const coorX = Number(coor.split(",")?.[0]?.trim() || -1);
      const coorY = Number(coor.split(",")?.[1]?.trim() || -1);
      if((!isNaN(coorX) && coorX >= 0) && (!isNaN(coorY) && coorY >= 0)) {
        this.mapdata[mapId].safeZone = { x: coorX, y: coorY };
        return resolve();
      }
      return resolve();
    });

  }
  async setSave(setType) {
    const noSafeZones = Object.keys(this.mapdata).find(k => !this.mapdata[k].safeZone);
    if(noSafeZones) {
      const setSZ = await modal.confirm(`Map ${noSafeZones} has no Safe Zone!<br/>Set now?`);
      if(!setSZ) {
        this.isLocked = false;
        return;
      }
      await this.editSafeZone(noSafeZones);
      return this.setSave(setType);
    }
    if(setType === "preview") {
      this.saveToPreview();
    } else if(setType === "export") {
      this.saveToServer();
    }
  }
  async saveToServer() {
    const file1 = JSON.stringify(this.mapdata);
    const file2 = JSON.stringify(this.finishedEvents);
    const data = {};
    data.file1 = file1;
    data.file2 = file2;
    data.project_name = this.project_name;
    const upProject = await modal.loading(xhr.post("/x/admin/editor-saveproject", data), "SAVING");
    if(!upProject.ok) {
      await modal.alert(upProject.msg || "Something went wrong!");
      this.isLocked = false;
      return;
    }
    this.isLocked = false;
  }
  async saveToPreview() {
    const text1 = JSON.stringify(this.mapdata);
    const text2 = JSON.stringify(this.finishedEvents);
    const file1 = new Blob([text1], { type: "application/json" });
    const file2 = new Blob([text2], { type: "application/json" });
    const fileURL1 = URL.createObjectURL(file1);
    const fileURL2 = URL.createObjectURL(file2);
    await modal.alert({msg: `Preview Map:<br/><a href="${fileURL1}" target="_blank">Open In New Tab <i class="fa-duotone fa-regular fa-up-right-from-square"></i></a><br/><br/>Preview On Mission Completed:<br/><a href="${fileURL2}" target="_blank">Open In New Tab <i class="fa-duotone fa-regular fa-up-right-from-square"></i></a>`, ic: "circle-check"});
    URL.revokeObjectURL(fileURL1);
    URL.revokeObjectURL(fileURL2);
    this.isLocked = false;
  }
  zoomListener() {
    const zoomIn = this.el.querySelector(".btn-zoom-in");
    const zoomOut = this.el.querySelector(".btn-zoom-out");
    const addArea = this.el.querySelector(".btn-add");
    const removeArea = this.el.querySelector(".btn-remove");
    const fullDoc = this.el.querySelector(".btn-full");
    const btnSz = this.el.querySelector(".btn-sz");
    const btnRename = this.el.querySelector(".btn-rename");
    const btnFinish = this.el.querySelector(".btn-finish");
    btnFinish.onclick = () => { 
      if(this.isLocked) return;
      this.isLocked = true;
      const x = -1;
      const y = -1;
      new NewObject({x, y, editor:this, passed: {
        id: "finished",
        finished: [{events: this.finishedEvents}]
      }, isSpace: true}, true).run();
    }
    btnRename.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      await this.renameArea();
      this.isLocked = false;
    }

    btnSz.onclick = async() => {
      if(this.isLocked) return;
      this.isLocked = true;
      await this.editSafeZone(this.currArea);
      this.isLocked = false;
    }

    fullDoc.onclick = async() => {
      const docEl = document.documentElement;

      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      }

      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch (err) {
          console.warn("Gagal mengunci orientasi:", err);
        }
      }
    }

    addArea.onclick = () => {
      if(this.isLocked) return;
      this.isLocked = true;
      new NewArea({editor:this}).run();
    }
    removeArea.onclick = async() => {
      if(this.isLocked) return;
      const oldAreas = Object.values(this.mapdata);
      if(oldAreas.length <= 1) {
        await modal.alert("Cannot delete the only area you have");
        return;
      }
      this.isLocked = true;
      const confRem = await modal.confirm(`Remove Area: ${this.currArea}?`);
      if(!confRem) {
        this.isLocked = false;
        return;
      }
      delete this.mapdata[this.currArea];
      const liArea = this.arealist.querySelector(`#${this.currArea}`);
      if(liArea) liArea.remove();
      this.isLocked = false;
      const areas = Object.values(this.mapdata);
      this.setTileImage(areas[0].id, areas[0].lowerSrc);
    }
    zoomIn.onclick = () => {
      if(this.zoom >= maxZoom) return;
      this.zoom = (this.zoom + (0.5));
      this.currmap.style.transform = `scale(${this.zoom})`;
    }
    zoomOut.onclick = () => {
      if(this.zoom <= minZoom) return;
      this.zoom = (this.zoom - (0.5));
      this.currmap.style.transform = `scale(${this.zoom})`;
    }
    const btnModes = this.el.querySelectorAll(".btn-mode");
    btnModes.forEach(btn => {
      const work = btn.getAttribute("k-mode");
      btn.onclick = async() => {
        this.tempMode = work === "Bulk" ? null : work;
        if(Object.keys(this.bulk).length >= 1) {
          if(this.tempMode === "Wall") {
            Object.keys(this.bulk).forEach(coor => {
              this.addWall(coor);
              this.addBulk(coor);
            });
            this.tempMode = null;
            return;
          } else if(this.tempMode === "Space") {
            return this.tileWork(-1, -1);
          } else {
            await modal.alert("Bulk list can only be set to Walls or Spaces");
            this.tempMode = null;
            return;
          }
        }
        this.tempMode = null;
        const btnActived = this.el.querySelector(".btn-mode.selected");
        if(btnActived) btnActived.classList.remove("selected");
        btn.classList.add("selected");
        this.mode = work;
      }
    });
  }
  setAreas() {
    const areas = Object.values(this.mapdata || {});
    areas.forEach(area => this.setAreaObj(area));
    if(areas.length >= 1) {
      if(this.currArea) {
        this.setTileImage(this.mapdata[this.currArea].id, this.mapdata[this.currArea].lowerSrc);
      } else {
        this.setTileImage(areas[0].id, areas[0].lowerSrc);
      }
    }
  }
  setAreaObj(area) {
    const li = document.createElement("li");
    li.id = area.id;
    li.innerHTML = area.id.replace("kulon", "");
    li.onclick = () => this.setTileImage(area.id, area.lowerSrc);
    this.arealist.append(li);
  }
  setTileImage(area_id, area_src) {
    Object.keys(this.bulk).forEach(k => {
      delete this.bulk[k];
    })
    this.currArea = area_id;
    const areaActives = this.arealist.querySelectorAll("li.selected");
    areaActives.forEach(area => area.classList.remove("selected"));
    this.arealist.querySelector(`#${area_id}`).classList.add("selected");
    this.writeImage(area_id, area_src);
  }
  writeImage(area_id, area_src) {
    if(this.currImg) this.currImg.remove();
    if(this.currTiles) this.currTiles.remove();
    this.currImg = new Image();
    this.currImg.onload = () => {
      this.currmap.append(this.currImg);
      this.writeGrid(this.currImg);
      this.loadCoor();
    }
    this.currImg.alt = area_id;
    this.currImg.src = asset[area_src].src;
  }
  writeGrid(img) {
    this.currTiles = document.createElement("div");
    this.currTiles.classList.add("tiles");

    const img_coloumns = (img.width / 16);
    const img_rows = (img.height / 16);
    const img_tile_total = img_coloumns * img_rows;

    this.currTiles.style.gridTemplateColumns = `repeat(${img_coloumns}, 16px)`;
    this.currTiles.style.gridTemplateRows = `repeat(${img_rows}, 16px)`;

    let x = 0, y = 0;
    for(let i = 1; i <= img_tile_total; i ++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      tile.setAttribute("k-coor", `${x},${y}`);
      const newX = x;
      const newY = y;
      tile.onclick = () => this.tileWork(newX, newY);
      this.currTiles.append(tile);
      x++;
      if(x === img_coloumns) {
        x = 0;
        y++;
      }
    }

    this.currmap.append(this.currTiles);
  }
  loadCoor() {
    const walls = Object.keys(this.mapdata[this.currArea].walls);
    walls.forEach(k => this.addWall(k, true));
    const spaces = Object.keys(this.mapdata[this.currArea].cutsceneSpaces);
    spaces.forEach(k => this.addSpace(k));
    const cobj = this.mapdata[this.currArea].configObjects;
    const confobjects = Object.keys(cobj);
    confobjects.forEach(k => {
      this.addObject(`${cobj[k].x},${cobj[k].y}`);
    });
  }
  addBulk(k, rm=false) {
    const etile = this.currmap.querySelector(`.tiles .tile[k-coor="${k}"]`);
    if(this.bulk[k] || rm) {
      delete this.bulk[k];
      etile.classList.remove("b");
    } else {
      this.bulk[k] = true;
      etile.classList.add("b");
    }
  }
  addWall(k, initial=false) {
    const etile = this.currmap.querySelector(`.tiles .tile[k-coor="${k}"]`);
    if(this.mapdata[this.currArea].walls[k] && !initial) {
      delete this.mapdata[this.currArea].walls[k];
      etile.classList.remove("w");
    } else {
      this.mapdata[this.currArea].walls[k] = true;
      etile.classList.add("w");
    }
  }
  addSpace(k, rm=false) {
    const etile = this.currmap.querySelector(`.tiles .tile[k-coor="${k}"]`);
    if(rm) {
      etile.classList.remove("s");
    } else {
      etile.classList.add("s");
    }
  }
  addObject(k, rm=false) {
    const etile = this.currmap.querySelector(`.tiles .tile[k-coor="${k}"]`);
    if(rm) {
      etile.classList.remove("o");
    } else {
      etile.classList.add("o");
    }
  }
  showLastCoor(x, y) {
    if(coorTimeout) {
      this.hideLastCoor();
    }
    this.modeTitle.innerHTML = `Last Coor: ${x}x, ${y}y`;
    coorTimeout = setTimeout(() => this.hideLastCoor(), 120000);
  }
  hideLastCoor() {
    if(coorTimeout) {
      clearTimeout(coorTimeout);
      coorTimeout = null;
      this.modeTitle.innerHTML = `Kulon Editor: ${this.project_name}`;
    }
  }
  async tileWork(x, y) {
    if(this.isLocked) return;
    this.isLocked = true;
    const coor = `${x},${y}`;
    this.showLastCoor(x, y);
    if(this.mode === "Bulk" && !this.tempMode) {
      const cobj = this.mapdata[this.currArea].configObjects;
      const obj_key = Object.keys(cobj).find(k => cobj[k].x === x && cobj[k].y === y);
      if(cobj[obj_key]) {
        await modal.alert("This tile has been set to Object");
        this.isLocked = false;
        return;
      }
      if(this.mapdata[this.currArea].cutsceneSpaces[coor]) {
        await modal.alert("This tile has been set to Space");
        this.isLocked = false;
        return;
      }
      if(this.mapdata[this.currArea].walls[coor]) {
        await modal.alert("This tile has been set to Wall");
        this.isLocked = false;
        return;
      }
      this.addBulk(coor);
      this.isLocked = false;
    } else if(this.mode === "Wall" && !this.tempMode) {
      const cobj = this.mapdata[this.currArea].configObjects;
      const obj_key = Object.keys(cobj).find(k => cobj[k].x === x && cobj[k].y === y);
      if(cobj[obj_key]) {
        await modal.alert("This tile has been set to Object");
        this.isLocked = false;
        return;
      }
      if(this.mapdata[this.currArea].cutsceneSpaces[coor]) {
        await modal.alert("This tile has been set to Space");
        this.isLocked = false;
        return;
      }
      this.addWall(coor);
      this.isLocked = false;
    } else if(this.mode === "Object" && !this.tempMode) {
      if(this.mapdata[this.currArea].walls[coor]) {
        await modal.alert("This tile has been set to Wall");
        this.isLocked = false;
        return;
      }
      if(this.mapdata[this.currArea].cutsceneSpaces[coor]) {
        await modal.alert("This tile has been set to Space");
        this.isLocked = false;
        return;
      }
      const cobj = this.mapdata[this.currArea].configObjects;
      const obj_key = Object.keys(cobj).find(k => cobj[k].x === x && cobj[k].y === y);
      new NewObject({x, y, editor:this, passed: (obj_key ? {...cobj[obj_key], id: obj_key} : null), isSpace: false}).run();
    } else if(this.mode === "Space" || this.tempMode === "Space") {
      if(this.mapdata[this.currArea].walls[coor]) {
        await modal.alert("This tile has been set to Wall");
        this.isLocked = false;
        return;
      }
      const cobj = this.mapdata[this.currArea].configObjects;
      const obj_key = Object.keys(cobj).find(k => cobj[k].x === x && cobj[k].y === y);
      if(cobj[obj_key]) {
        await modal.alert("This tile has been set to Object");
        this.isLocked = false;
        return;
      }
      const skey = coor;
      const sobj = this.mapdata[this.currArea].cutsceneSpaces[skey];
      let myCoor = null;
      if(sobj) {
        myCoor = {};
        myCoor[skey] = sobj;
        myCoor.id = skey;
      }
      new NewObject({x, y, editor:this, passed: myCoor, isSpace: true}).run();
    }
  }
  newArea(data) {
    const areaname = "kulon" + data["area-name"];
    this.mapdata[areaname] = {
      "id": areaname,
      "lowerSrc": data["lower-src"],
      "upperSrc": data["upper-src"],
      "configObjects": {},
      "walls": {},
      "cutsceneSpaces": {}
    }
    this.setAreaObj(this.mapdata[areaname]);
    this.setTileImage(areaname, data["lower-src"]);
    this.isLocked = false;
  }
  editFinish(finish_data) {
    this.finishedEvents = finish_data;
  }
  editObject(object_id, object_data, old_object_id=null) {
    if(old_object_id && this.mapdata[this.currArea].configObjects[old_object_id]) {
      delete this.mapdata[this.currArea].configObjects[old_object_id];
    }
    this.mapdata[this.currArea].configObjects[object_id] = object_data;
    this.addObject(`${object_data.x},${object_data.y}`);
  }
  removeObject(object_data) {
    if(object_data.id && this.mapdata[this.currArea].configObjects[object_data.id]) {
      this.addObject(`${object_data.x},${object_data.y}`, true);
      delete this.mapdata[this.currArea].configObjects[object_data.id];
    }
  }
  editSpace(space_id, space_data) {
    if(Object.keys(this.bulk).length >= 1) {
      Object.keys(this.bulk).forEach(k => {
        if(this.mapdata[this.currArea].cutsceneSpaces[k]) {
          delete this.mapdata[this.currArea].cutsceneSpaces[k];
        }
        this.mapdata[this.currArea].cutsceneSpaces[k] = space_data[space_id];
        this.addSpace(k);
        this.addBulk(k);
      });
      this.tempMode = null;
      return;
    }
    if(this.mapdata[this.currArea].cutsceneSpaces[space_id]) {
      delete this.mapdata[this.currArea].cutsceneSpaces[space_id];
    }
    this.addSpace(space_id);
    this.mapdata[this.currArea].cutsceneSpaces[space_id] = space_data[space_id];
  }
  removeSpace(space_id) {
    if(this.mapdata[this.currArea].cutsceneSpaces[space_id]) {
      this.addSpace(space_id, true);
      delete this.mapdata[this.currArea].cutsceneSpaces[space_id];
    }
  }
  unlock() {
    this.isLocked = false;
    this.tempMode = null;
  }
  destroy(restart) {
    this.mapdata = {};
    this.isLocked = false;
    this.currArea = null;
    this.currImg = null;
    this.currTiles = null;
    this.zoom = 2;
    this.mode = "Wall";
    this.tempMode = null;
    this.bulk = {};
    this.el.remove();
    if(!restart) window.location.reload();
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.setAreas();
    this.zoomListener();
    this.btnListener();
  }
}