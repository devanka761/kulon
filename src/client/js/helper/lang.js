import xhr from "./xhr.js";

export const lang = {};

class KulonLangs {
  constructor() {
    this.fileKey = "kulon_lang";
    this.currLang = "en";
  }
  save() {
    window.localStorage.setItem(this.fileKey, JSON.stringify({lang: this.currLang}));
  }
  read() {
    if (!window.localStorage) return null;
    const file = window.localStorage.getItem(this.fileKey);
    return file ? JSON.parse(file) : null;
  }
  async load() {
    const file = this.read();
    this.currLang = file?.lang === "en" ? "en" : "id";
    const newLang = await xhr.get(`/json/locales/${this.currLang}.json`);
    Object.keys(newLang).forEach(k => lang[k] = newLang[k]);
  }
}

export const klang = new KulonLangs();