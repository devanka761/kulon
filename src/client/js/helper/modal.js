import Kaudio from "../manager/Kaudio.js";
import * as klang from "./lang.js";

const modal = {
  async waittime(ts = 500, tsa = null) {
    const ms = ts - tsa || 0;
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  async loading(newfunc, msg = "LOADING") {
    Kaudio.play("nfx2", "dialogue_process");
    const el = document.createElement("div");
    el.classList.add("loading");
    el.innerHTML = `
    <div class="box">
      <div class="spinner">
        <i class="fa-solid fa-spinner fa-spin"></i>
      </div>
      <div class="msg"><p>${msg}</p></div>
    </div>`;
    document.querySelector('.app').append(el);

    await this.waittime();

    return await newfunc.then(async res => {
      el.classList.add('out');
      await this.waittime(500, 5);
      Kaudio.play("nfx2", "dialogue_end");
      el.remove();
      return res;
    }).catch(async err => {
      el.classList.add('out');
      await this.waittime(500, 5);
      Kaudio.play("nfx2", "dialogue_end");
      el.remove();
      return err;
    });
  },
  async smloading(newfunc, msg = "LOADING") {
    Kaudio.play("sfx", "dialogue_process");
    const el = document.createElement("div");
    el.classList.add("sm-loading");
    el.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${msg}</span>`;
    document.querySelector('.app').append(el);

    await this.waittime();

    return await newfunc.then(res => {
      el.remove();
      return res;
    }).catch(err => {
      el.remove();
      return err;
    });
  },
  element() {
    const el = document.createElement("div");
    el.classList.add("modal");
    return el;
  },
  alert(s) {
    return new Promise(async resolve => {
      const lang = klang.lang;

      const el = this.element();
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic:'circle-exclamation'}"></i></p>
        </div>
        <div class="inf">
          <p>${typeof s === 'string' ? (s || '') : (s.msg || '')}</p>
        </div>
        <div class="act">
          <button class="btn btn-ok">${lang.OK || "OK"}</button>
        </div>
      </div>`;

      const btn = el.querySelector('.act .btn-ok');
      if(s.okx) btn.innerText = s.okx;

      document.querySelector('.app').append(el);
      btn.focus();

      btn.onclick = async() => {
        Kaudio.play("sfx", "menu_exit");
        el.classList.add('out');
        await this.waittime(500, 5);
        el.remove();
        resolve(false);
        if(s.ok) s.ok();
      }
    });
  },
  confirm(s) {
    return new Promise(async resolve => {
      const lang = klang.lang;

      const el = this.element();
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic:'circle-exclamation'}"></i></p>
        </div>
        <div class="inf">
          <p>${typeof s === 'string' ? (s || '') : (s.msg || '')}</p>
        </div>
        <div class="acts">
          <button class="btn btn-cancel">${lang.CANCEL || "CANCEL"}</button>
          <button class="btn btn-ok">${lang.OK || "OK"}</button>
        </div>
      </div>`;

      const btnOk = el.querySelector('.acts .btn-ok');
      if(s.okx) btnOk.innerText = s.okx;
      const btnCancel = el.querySelector('.acts .btn-cancel');
      if(s.cancelx) btnCancel.innerText = s.cancelx;

      document.querySelector('.app').append(el);
      btnOk.focus();

      btnOk.onclick = async() => {
        Kaudio.play("sfx", "menu_select");
        el.classList.add('out');
        await this.waittime(500, 5);
        el.remove();
        resolve(true);
        if(s.ok) s.ok();
      }
      btnCancel.onclick = async() => {
        Kaudio.play("sfx", "menu_exit");
        el.classList.add('out');
        await this.waittime(500, 5);
        el.remove();
        resolve(false);
        if(s.cancel) s.cancel();
      }
    });
  },
  prompt(s) {
    return new Promise(async resolve => {
      const lang = klang.lang;

      const el = this.element();
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic:'circle-exclamation'}"></i></p>
        </div>
        <div class="inf">
          <p><label for="prompt-field">${typeof(s) === 'string' ? (s || '') : (s.msg || '')}</label></p>
        </div>
        <div class="acts">
          <button class="btn btn-cancel">${lang.CANCEL || "CANCEL"}</button>
          <button class="btn btn-ok">${lang.OK || "OK"}</button>
        </div>
      </div>`;

      const einf = el.querySelector(".inf");
      let inp = null;
      if(s.tarea) {
        inp = document.createElement("textarea");
        inp.maxLength = s.max ? s.max : 300;
      } else {
        inp = document.createElement("input");
        inp.type = "text";
        inp.maxLength = s.max ? s.max : 100;
        inp.autocomplete = "off";
      }
      inp.name = "prompt-field";
      inp.id = "prompt-field";
      inp.placeholder = s.pholder || lang.TYPE_HERE || "Type Here";
      if(s.iregex) inp.oninput = () => inp.value = inp.value.replace(s.iregex, "");

      const btnOk = el.querySelector('.acts .btn-ok');
      if(s.okx) btnOk.innerText = s.okx;
      const btnCancel = el.querySelector('.acts .btn-cancel');
      if(s.cancelx) btnCancel.innerText = s.cancelx;

      einf.append(inp);
      document.querySelector('.app').append(el);
      inp.focus();
      if(s.val) inp.value = s.val;

      btnOk.onclick = async() => {
        Kaudio.play("sfx", "menu_select");
        el.classList.add('out');
        await this.waittime();
        el.remove();
        resolve(inp.value);
        if(s.ok) s.ok();
      }
      btnCancel.onclick = async() => {
        Kaudio.play("sfx", "menu_exit");
        el.classList.add('out');
        await this.waittime();
        el.remove();
        resolve(null);
        if(s.cancel) s.cancel();
      }
      inp.onkeydown = e => {
        if(e.key.toLowerCase() === 'enter') {
          e.preventDefault();
          btnOk.click();
        }
      }
    });
  },
  select(s) {
    return new Promise(async resolve => {
      const lang = klang.lang;

      const el = this.element();
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic:'circle-exclamation'}"></i></p>
        </div>
        <div class="inf">
          <p><label for="prompt-field">${typeof(s) === 'string' ? (s || '') : (s.msg || '')}</label></p>
          <form class="modal-radio-form" id="modal-radio-form"></form>
        </div>
        <div class="acts">
          <button class="btn btn-cancel">${lang.CANCEL || "CANCEL"}</button>
          <button class="btn btn-ok">${lang.OK || "OK"}</button>
        </div>
      </div>`;

      const form = el.querySelector('.box .inf #modal-radio-form');
      const optionId = Date.now().toString(36);
      s.opt.items.forEach((itm, i) => {
        const radio = document.createElement("div");
        radio.classList.add('radio');
        radio.innerHTML = `
        <label for="${optionId}-${itm.id || (i + 1)}">
          <input type="radio" name="${optionId}" id="${optionId}-${itm.id}" value="${itm.id}" required />
          <p>${itm.label}</p>
        </label>`;
        if(itm.actived) radio.querySelector('input').checked = true;
        form.append(radio);
      });

      const btnOk = el.querySelector('.acts .btn-ok');
      if(s.okx) btnOk.innerText = s.okx;
      const btnCancel = el.querySelector('.acts .btn-cancel');
      if(s.cancelx) btnCancel.innerText = s.cancelx;

      document.querySelector('.app').append(el);

      btnOk.onclick = async() => {
        Kaudio.play("sfx", "menu_select");
        let data = null;
        const formData = new FormData(form);
        formData.forEach(val => data = val);
        el.classList.add('out');
        await this.waittime();
        el.remove();
        resolve(data);
        if(s.ok) s.ok();
      }
      btnCancel.onclick = async() => {
        Kaudio.play("sfx", "menu_exit");
        el.classList.add('out');
        await this.waittime();
        el.remove();
        resolve(null);
        if(s.cancel) s.cancel();
      }
    });
  }
}
export default modal;