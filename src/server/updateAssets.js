const fs = require("fs");
const db = require("./main/db");

function getCharCreate() {
   const skins = require("../../public/json/skins/skin_list.json");

   let charCreateList = {
      Bodies: [],
      Eyes: [],
      Outfits: [],
      Backpacks: [],
      Beards: [],
      Glasses: [],
      Hairstyles: [],
      Hats: [],
   };

   let numberBefore = "";
   let parentNumber = -1;
   let partbefore = "";

   for(const skin of skins) {
      if(skin.path.includes("characters")) {
         const endpart = skin.path.substring(19, skin.path.length);
         const partof = endpart.split("/")[0];
   
         if(partof != "Null") {
            if(!charCreateList[partof]) charCreateList[partof] = [];

            const numbers = skin.id.replace(/\D/g, "");

            if(partof != partbefore) {
               partbefore = partof;
               parentNumber = -1;
               numberBefore = "";
   
               if(partof != "Bodies" && partof != "Outfits" && partof != "Eyes") {
                  numberBefore = "";
                  parentNumber++;
                  if(numbers.length === 4) {
                     charCreateList[partof].push(["null"]);
                  } else if(numbers.length === 2) {
                     charCreateList[partof].push("null");
                  }
               }
            }

            if(numbers.length === 4) {
               const first = numbers.substring(0, 2);
               if(first == numberBefore) {
                  if(!charCreateList[partof][parentNumber]) charCreateList[partof][parentNumber] = [];
                  charCreateList[partof][parentNumber].push(skin.id);
               } else {
                  numberBefore = first;
                  parentNumber++;
                  charCreateList[partof].push([skin.id]);
               }
            } else if(numbers.length === 2) {
               charCreateList[partof].push(skin.id);
            }
         }
      }
   }

   return charCreateList;
}

async function createCharCreateData() {
   console.log("2/3 LOADING (CHARACTERS)");
   const skinlist = getCharCreate();
   const skinFolderPath = fs.existsSync("./public/json/skins");
   if(!skinFolderPath) fs.mkdirSync("./public/json/skins");
   let skinDataPath = "./public/json/skins/character_creation_list.json";

   fs.writeFileSync(skinDataPath, JSON.stringify(skinlist), "utf-8");
   console.log("2/3 LOADED (CHARACTERS)");
   createAudioData();
}

async function getSkinFile() {
   const skinPath = "./public/assets";
   let skinlist = [];

   const parents = fs.readdirSync(skinPath).filter(dsk => dsk !== "maps");
   parents.forEach(dsk => {console.log("1/3 READING (SKINS) >> " + dsk)});

   for(const parent of parents) {
      const folders = fs.readdirSync(skinPath + "/" + parent);

      for(const folder of folders) {
         const files = fs.readdirSync(skinPath + "/" + parent + "/" + folder);

         for(const file of files) {
            skinlist.push({
               id: file.replace(".png", ""),
               path: `/assets/${parent}/${folder}/${file}`
            });
         }
      }
   }

   return skinlist;
}

async function createSkinData() {
   const skinFolderPath = fs.existsSync("./public/json/skins");
   if(!skinFolderPath) fs.mkdirSync("./public/json/skins");

   console.log("1/3 LOADING (SKINS)");
   const skinlist = await getSkinFile();
   const skinDataPath = "./public/json/skins/skin_list.json";

   fs.writeFileSync(skinDataPath, JSON.stringify(skinlist), "utf-8");
   console.log("1/3 LOADED (SKINS)");

   createCharCreateData();
}

function getAudioData() {
   const audioPath = "./public/audio";
   let audioList = [];

   const parents = fs.readdirSync(audioPath);
   parents.forEach(dsk => {console.log("3/3 READING (AUDIO) >> " + dsk)});

   for(const parent of parents) {
      const files = fs.readdirSync(audioPath + "/" + parent);
      for(const file of files) {
         audioList.push({
            id: file.replace(".mp3", ""),
            path: `/audio/${parent}/${file}`
         });
      }
   }
   return audioList;
}
function createAudioData() {
   console.log("3/3 LOADING (AUDIO)");

   const audiolist = getAudioData();
   const audioDataPath = "./public/json/audio/audio.json";

   fs.writeFileSync(audioDataPath, JSON.stringify(audiolist), "utf-8");
   console.log("3/3 LOADED (AUDIO)");
}

async function updateAll() {
   console.log("Updating Databases ...");
   db.load();
   console.log("Databases Updated!");
   console.log("Assets Unpacking Started ...");
   await createSkinData();
   console.log("Assets Unpacking Completed!");
}

updateAll();