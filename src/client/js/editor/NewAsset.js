import modal from "../helper/modal.js";
import xhr from "../helper/xhr.js";
import asset from "../manager/asset.js";
import LoadAssets from "../manager/LoadAssets.js";

export default class NewAsset {
  constructor({editor, type, project_name}) {
    this.project_name = project_name;
    this.editor = editor;
    this.type = type;
    this.file = null;
    this.dataFile = null;
    this.isLocked = false;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("newArea");
    this.el.innerHTML = `
    <form action="/uwu/newasset" method="post" class="form" id="area-form">
      <div class="field add rem">
        <div class="title">${this.type ? "ADD" : "REMOVE"} ASSET</div>
      </div>
      <div class="field rem">
        <label for="asset-filename">Asset Name</label>
        <input list="assets-filename" name="asset-filename" id="asset-filename" required />
        <datalist id="assets-filename">
        </datalist>
      </div>
      <div class="field add">
        <label for="asset-file">Asset File</label>
        <input type="file" name="asset-file" id="asset-file" accept=".png,.svg" required />
      </div>
      <div class="field add">
        <label for="asset-name">Asset Name</label>
        <input type="text" name="asset-name" id="asset-name" maxlength="40" autocomplete="off" required />
      </div>
      <div class="field add">
        <label for="asset-folder">Asset Folder Name</label>
        <input type="text" name="asset-folder" id="asset-folder" maxlength="40" autocomplete="off" required />
      </div>
      <div class="field add">
        <label for="asset-extension">Asset Extension</label>
        <select name="asset-extension" id="asset-extension" required>
          <option value=".png">.png</option>
          <option value=".svg">.svg</option>
        </select>
      </div>
      <div class="field add rem">
        <div class="buttons">
          <div class="btn btn-cancel">CANCEL</div>
          <button class="btn btn-ok" type="submit">${this.type ? "UPLOAD" : "DELETE"}</button>
        </div>
      </div>
    </form>`;
  }
  formListener() {
    const btnCancel = this.el.querySelector(".btn-cancel");
    btnCancel.onclick = () => this.destroy();
    this.form = this.el.querySelector("#area-form");
    this.form.onsubmit = async e => {
      e.preventDefault();
      if(this.isLocked) return;
      if(this.type && (!this.dataFile || !this.file)) return;
      this.isLocked = true;
      const formData = new FormData(this.form);
      const data = {};
      formData.forEach((val, key) => {
        if(key !== "asset-file") data[key] = val;
      });
      if(this.type) {
        data["asset-file"] = this.dataFile;
      }
      data.project_name = this.project_name;
      const upFile = await modal.loading(xhr.post(`/x/admin/editor-${this.type ? "addasset" : "remasset"}`, data), "UPLOADING");
      if(!upFile.ok) {
        await modal.alert(upFile.msg || "Something Went Wrong!");
        this.isLocked = false;
        return;
      }
      if(this.type) {
        await modal.loading(new LoadAssets({skins: upFile.data.assets}).run(), "DOWNLOADING ASSETS");
      } else {
        delete asset[upFile.data.asset];
      }
      this.isLocked = false;
      this.destroy();
    }
    const inpName = this.el.querySelector("#asset-name");
    const inpExt = this.el.querySelector("#asset-extension");
    const inpFolder = this.el.querySelector("#asset-folder");
    inpFolder.value = `mp_${this.project_name}`;
    const inpFile = this.el.querySelector("#asset-file");
    inpFile.onchange = async() => {
      const file = inpFile.files[0];
      const extRegex = /.png|.svg/i;
      const fileExt = file?.name?.match(extRegex);
      if(fileExt) inpExt.value = fileExt[0].toLowerCase();
      if(!inpName.value || inpName.value.length < 1 || inpName.value === (file?.name || "").replace(extRegex, "")) {
        inpName.value = file.name.replace(extRegex, "");
      }
      this.file = file || null;

      if(this.file) {
        const fileBase64 = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => {
            return resolve(reader.result);
          }
          reader.readAsDataURL(this.file);
        });
        this.dataFile = fileBase64;
      } else {
        this.dataFile = null;
      }
    }
  }
  checkType() {
    const fields = this.el.querySelectorAll(".field");
    fields.forEach(field => {
      if(!field.classList.contains(this.type ? "add" : "rem")) {
        field.remove();
      }
    });
    if(this.type !== 1) {
      const assetsDatalist = this.el.querySelector("#assets-filename");
      Object.keys(asset).forEach(k => {
        const opt = document.createElement("option");
        opt.value = k;
        assetsDatalist.append(opt);
      });
    }
  }
  async destroy() {
    this.el.classList.add("out");
    await modal.waittime();
    this.file = null
    this.dataFile = null
    this.el.remove();
    this.editor.unlock();
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.formListener();
    this.checkType();
  }
}