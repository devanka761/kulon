import fs from "fs"

let skinSize: number = 0
let audioSize: number = 0

interface ISkinInfo {
  id: string
  path: string
}

type CharCreateListValue = (string | string[])[]

interface ICharCreateList {
  Bodies: CharCreateListValue
  Eyes: CharCreateListValue
  Outfits: CharCreateListValue
  Backpacks: CharCreateListValue
  Beards: CharCreateListValue
  Glasses: CharCreateListValue
  Hairstyles: CharCreateListValue
  Hats: CharCreateListValue
  [key: string]: CharCreateListValue
}

function getCharCreate() {
  const skins: ISkinInfo[] = JSON.parse(fs.readFileSync("./public/json/skins/skin_list.json", "utf-8"))
  const charCreateList: ICharCreateList = {
    Bodies: [],
    Eyes: [],
    Outfits: [],
    Backpacks: [],
    Beards: [],
    Glasses: [],
    Hairstyles: [],
    Hats: []
  }

  let numberBefore: string = ""
  let parentNumber = -1
  let partbefore: string = ""

  for (const skin of skins) {
    if (skin.path.includes("characters")) {
      const endpart = skin.path.substring(19, skin.path.length)
      const partof = endpart.split("/")[0]

      if (partof !== "Null") {
        if (!charCreateList[partof]) charCreateList[partof] = []

        const numbers = skin.id.replace(/\D/g, "")

        if (partof !== partbefore) {
          partbefore = partof
          parentNumber = -1
          numberBefore = ""

          if (partof != "Bodies" && partof != "Outfits" && partof != "Eyes") {
            numberBefore = ""
            parentNumber++
            if (numbers.length === 4) {
              charCreateList[partof].push(["null"])
            } else if (numbers.length === 2) {
              charCreateList[partof].push("null")
            }
          }
        }

        if (numbers.length === 4) {
          const first = numbers.substring(0, 2)
          if (first === numberBefore) {
            if (!charCreateList[partof][parentNumber]) charCreateList[partof][parentNumber] = []
            const targetArray = charCreateList[partof][parentNumber] as string[]
            targetArray.push(skin.id)
          } else {
            numberBefore = first
            parentNumber++
            charCreateList[partof].push([skin.id])
          }
        } else if (numbers.length === 2) {
          charCreateList[partof].push(skin.id)
        }
      }
    }
  }

  return charCreateList
}

function createCharCreateData() {
  console.log("2/3 LOADING (CHARACTERS)")
  const skinlist = getCharCreate()
  const skinFolderPath = fs.existsSync("./public/json/skins")
  if (!skinFolderPath) fs.mkdirSync("./public/json/skins")
  const skinDataPath = "./public/json/skins/character_creation_list.json"

  fs.writeFileSync(skinDataPath, JSON.stringify(skinlist), "utf-8")
  console.log("2/3 LOADED (CHARACTERS)")
  createAudioData()
}

async function getSkinFile() {
  const skinPath = "./public/assets"
  const skinlist: ISkinInfo[] = []

  const parents = fs.readdirSync(skinPath).filter((dsk) => dsk !== "maps")
  parents.forEach((dsk) => {
    console.log("1/3 READING (SKINS) >> " + dsk)
  })

  for (const parent of parents) {
    const folders = fs.readdirSync(skinPath + "/" + parent)

    for (const folder of folders) {
      const files = fs.readdirSync(skinPath + "/" + parent + "/" + folder)

      for (const file of files) {
        const skinAssetPath = `/assets/${parent}/${folder}/${file}`
        const asset = fs.statSync(`./public${skinAssetPath}`)
        skinSize += asset.size
        skinlist.push({
          id: file.replace(".png", ""),
          path: skinAssetPath
        })
      }
    }
  }

  return skinlist
}

async function createSkinData() {
  const skinFolderPath = fs.existsSync("./public/json/skins")
  if (!skinFolderPath) fs.mkdirSync("./public/json/skins")

  console.log("1/3 LOADING (SKINS)")
  const skinlist = await getSkinFile()
  const skinDataPath = "./public/json/skins/skin_list.json"

  fs.writeFileSync(skinDataPath, JSON.stringify(skinlist), "utf-8")
  console.log("1/3 LOADED (SKINS)")

  createCharCreateData()
}

function getAudioData() {
  const audioPath = "./public/audio"
  const audioList: { id: string; path: string }[] = []

  const parents = fs.readdirSync(audioPath)
  parents.forEach((dsk) => {
    console.log("3/3 READING (AUDIO) >> " + dsk)
  })

  for (const parent of parents) {
    const files = fs.readdirSync(audioPath + "/" + parent)
    for (const file of files) {
      const audioAssetPath = `/audio/${parent}/${file}`
      const asset = fs.statSync(`./public${audioAssetPath}`)
      audioSize += asset.size

      audioList.push({
        id: file.replace(".mp3", ""),
        path: audioAssetPath
      })
    }
  }
  return audioList
}
function createAudioData() {
  console.log("3/3 LOADING (AUDIO)")

  const audiolist = getAudioData()
  const audioDataPath = "./public/json/audio/audio.json"

  fs.writeFileSync(audioDataPath, JSON.stringify(audiolist), "utf-8")
  console.log("3/3 LOADED (AUDIO)")

  createTotalSize()
}

function createTotalSize() {
  console.log(" ")
  const data = {
    Skin: skinSize,
    Audio: audioSize,
    Total: skinSize + audioSize
  }

  const convertOp = 1024 * 1024

  console.log(`[ ${(data.Skin / convertOp).toFixed(2)} MB >> SKIN SIZE ]`)
  console.log(`[ ${(data.Audio / convertOp).toFixed(2)} MB >> AUDIO SIZE ]`)
  console.log(`[ ${(data.Total / convertOp).toFixed(2)} MB >> TOTAL SIZE ]`)
  const totalSizePath = `./public/json/skins/size.json`
  fs.writeFileSync(totalSizePath, JSON.stringify(data), "utf-8")
}

function setBuildNumber(): void {
  const buildFolder = "./public/json/build"
  const buildPath = buildFolder + "/buildNumber.json"

  if (!fs.existsSync(buildFolder)) {
    fs.mkdirSync(buildFolder)
  }
  if (!fs.existsSync(buildPath)) {
    fs.writeFileSync(buildPath, JSON.stringify({ buildNumber: 1 }, null, 2), "utf-8")
  }

  console.log("Build Number Updated!")
}

function setMaps() {
  const mapFolder = "./public/json/build"
  const mapPath = mapFolder + "/maps.json"

  if (!fs.existsSync(mapFolder)) {
    fs.mkdirSync(mapFolder)
  }
  if (!fs.existsSync(mapPath)) {
    fs.writeFileSync(mapPath, JSON.stringify({}, null, 2), "utf-8")
  }

  console.log("Maps Updated!")
}

function writeDeps() {
  const depsFolder = "./public/json/build"
  const depsPath = depsFolder + "/deps.json"

  const curPackage = JSON.parse(fs.readFileSync("./package.json", "utf-8"))
  const depList = {
    prodPackages: Object.keys(curPackage.dependencies),
    devPackages: Object.keys(curPackage.devDependencies),
    sysPackages: [
      { id: "certbot", url: "https://github.com/certbot/certbot#readme" },
      { id: "coturn", url: "https://github.com/coturn/coturn#readme" }
    ]
  }
  if (!fs.existsSync(depsFolder)) {
    fs.mkdirSync(depsFolder)
  }
  fs.writeFileSync(depsPath, JSON.stringify(depList), "utf-8")
  console.log("Deps List Updated!")
}

async function updateAll() {
  console.log("Assets Unpacking Started ...")
  console.log(" ")
  await createSkinData()
  console.log(" ")
  console.log("Assets Unpacking Completed!")
  console.log(" ")
  setMaps()
  setBuildNumber()
  writeDeps()
}

updateAll()
