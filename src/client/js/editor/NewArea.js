import modal from "../helper/modal.js";
import asset from "../manager/asset.js";

export default class NewArea {
  constructor({editor}) {
    this.editor = editor;
  }
  createElement() {
    this.el = document.createElement("div");
    this.el.classList.add("newArea");
    this.el.innerHTML = `
    <form action="/uwu/newmap" method="post" class="form" id="area-form">
      <div class="field">
        <div class="title">NEW AREA</div>
      </div>
      <div class="field">
        <label for="area-name">Area Name</label>
        <input type="text" name="area-name" id="area-name" maxlength="40" autocomplete="off" required />
      </div>
      <div class="field">
        <label for="lower-src">Image Source</label>
        <input list="lowers-src" name="lower-src" id="lower-src" required />
        <datalist id="lowers-src">
        </datalist>
      </div>
      <div class="field">
        <label for="upper-src">Layer Source</label>
        <input list="uppers-src" name="upper-src" id="upper-src" required/>
        <datalist id="uppers-src">
        </datalist>
      </div>
      <div class="field">
        <div class="buttons">
          <div class="btn btn-cancel">CANCEL</div>
          <button class="btn btn-ok" type="submit">OK</button>
        </div>
      </div>
    </form>`;
  }
  renderCard(sk) {
    const option = document.createElement("option");
    option.value = sk;
    return option;
  }
  writeAssets() {
    const lowersSrc = this.el.querySelector("#lowers-src");
    const uppersSrc = this.el.querySelector("#uppers-src");
    Object.keys(asset).filter(sk => asset[sk].src.includes(`mp_${this.editor.project_name}`)).forEach(sk => {
      lowersSrc.append(this.renderCard(sk));
      uppersSrc.append(this.renderCard(sk));
    });
  }
  formListener() {
    const inpName = this.el.querySelector("#area-name");
    inpName.readOnly = true;
    inpName.focus();
    setTimeout(() => {inpName.readOnly = false}, 250);
    const btnCancel = this.el.querySelector(".btn-cancel");
    btnCancel.onclick = () => this.destroy();
    this.form = this.el.querySelector("#area-form");
    this.form.onsubmit = e => {
      e.preventDefault();
      const data = {};
      const formData = new FormData(this.form);
      formData.forEach((val, key) => data[key] = val);
      this.editor.newArea(data);
      this.destroy();
    }
  }
  async destroy() {
    this.el.classList.add("out");
    await modal.waittime();
    this.el.remove();
    this.editor.unlock();
  }
  run() {
    this.createElement();
    document.querySelector(".app").append(this.el);
    this.writeAssets();
    this.formListener();
  }
}