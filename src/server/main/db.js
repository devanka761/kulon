const fs = require("fs");
const dbpath = "./dist/db";

const file_folders = ["mails", "trophies", "backpack", "house", "order", "maps"];

class DvnkzDatabase {
  constructor() {
    this.ref = {u:{},f:{},j:{},t:{},m:{},v:{}};
  }
  fileGet(file_key, file_folder) {
    if(!fs.existsSync(`${dbpath}/${file_folder}/${file_key}.json`)) return null;
    const userBuffer = fs.readFileSync(`${dbpath}/${file_folder}/${file_key}.json`, "utf-8");
    return JSON.parse(userBuffer);
  }
  fileSet(file_key, file_folder, new_file_data) {
    if(!fs.existsSync(dbpath)) fs.mkdirSync(dbpath);
    if(!fs.existsSync(`${dbpath}/${file_folder}`)) fs.mkdirSync(`${dbpath}/${file_folder}`);
    fs.writeFileSync(`${dbpath}/${file_folder}/${file_key}.json`, JSON.stringify(new_file_data), "utf-8");
  }
  load() {
    if(!fs.existsSync(dbpath)) fs.mkdirSync(dbpath);
    for(const file_folder of file_folders) {
      if(!fs.existsSync(`${dbpath}/${file_folder}`)) fs.mkdirSync(`${dbpath}/${file_folder}`);
      console.log(`Folder {${file_folder}} Updated!`);
    }
    Object.keys(this.ref).filter(k => !["t","j"].includes(k)).forEach(k => {
      if(!fs.existsSync(`${dbpath}/${k}.json`)) {
        fs.writeFileSync(`${dbpath}/${k}.json`, JSON.stringify(this.ref[k]), "utf-8");
      }
      const fileBuffer = fs.readFileSync(`${dbpath}/${k}.json`);
      const fileParse = JSON.parse(fileBuffer) || this.ref[k];
      if(k === 'u') {
        Object.keys(fileParse).forEach(usr => {
          delete fileParse[usr].peer;
          delete fileParse[usr].zzz;
          delete fileParse[usr].ls;
        })
      }
      this.ref[k] = fileParse;
      console.log(`-${k.toUpperCase()}- data loaded!`);
    });
  }
  save() {
    for(const s of arguments) {
      if(!this.ref[s]) throw new Error({ msg: `${s} is not valid database object name` });
      fs.writeFileSync(`${dbpath}/${s}.json`, JSON.stringify(this.ref[s]), 'utf-8');
    }
  }
}
const db = new DvnkzDatabase();
module.exports = db;