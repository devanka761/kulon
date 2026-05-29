import { spawn } from "child_process"
import fs from "fs"

async function revertPackage(): Promise<boolean> {
  return new Promise((resolve) => {
    const revertetd = spawn(`git checkout HEAD -- package.json}`, {
      shell: true,
      stdio: "inherit"
    })

    revertetd.on("close", (code) => {
      if (code === 0) {
        console.log("`package.json` restored.")
        resolve(true)
      } else {
        console.error(`Process exited with code ${code}`)
        resolve(false)
      }
    })
  })
}

interface PackageNames {
  prodDeps: string
  devDeps: string
}

async function packageReset(): Promise<PackageNames | null> {
  const revertedPackage = await revertPackage()
  if (!revertedPackage) return null

  const packageFile = fs.readFileSync("./package.json", "utf-8")

  const packageList = JSON.parse(packageFile)

  const prodDepsObj = { ...packageList["dependencies"] }
  const devDepsObj = { ...packageList["devDependencies"] }

  delete packageList["dependencies"]
  delete packageList["devDependencies"]

  const prodDepsArr = Object.keys(prodDepsObj).filter((k) => k !== "webfont-awesome-pro")
  const devDepsArr = Object.keys(devDepsObj)

  const prodDeps = prodDepsArr.join(" ")
  const devDeps = devDepsArr.join(" ")

  fs.writeFileSync("./package.json", JSON.stringify(packageList, null, 2), "utf-8")
  console.log("Rewrote `package.json`")

  return { prodDeps, devDeps }
}

async function removeFiles(file: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`Removing ${file}`)
    const fileExists = fs.existsSync(`${file}`)

    if (!fileExists) return resolve(true)

    const destroyPackage = spawn(`rm -rf ${file}`, {
      shell: true,
      stdio: "inherit"
    })

    destroyPackage.on("close", (code) => {
      if (code === 0) {
        console.log(`${file} removed.`)
        resolve(true)
      } else {
        console.error(`Process exited with code ${code}`)
        resolve(false)
      }
    })
  })
}

async function installPackage(cmd: string): Promise<boolean> {
  return new Promise((resolve) => {
    const install = spawn(`${cmd}`, {
      shell: true,
      stdio: "inherit"
    })

    install.on("close", (code) => {
      if (code === 0) {
        console.log("Packages installed successfully.")
        resolve(true)
      } else {
        console.error(`Process exited with code ${code}`)
        resolve(false)
      }
    })
  })
}

async function startCmd(): Promise<void> {
  const removedModules = await removeFiles("node_modules")
  if (!removedModules) return
  const removedLock = await removeFiles("package-lock.json")
  if (!removedLock) return

  const resetingPackage = await packageReset()
  if (!resetingPackage) return

  const { prodDeps, devDeps } = resetingPackage

  const installProd = await installPackage(`npm install ${prodDeps}`)
  if (!installProd) return

  const installFapro = await installPackage(`npm install --save-exact webfont-awesome-pro`)
  if (!installFapro) return

  const instalDev = await installPackage(`npm install --save-dev ${devDeps}`)
  if (!instalDev) return

  console.log("Process finished.")
}

startCmd()
