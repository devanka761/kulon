import backsong from "../APIs/BackSongAPI"
import lang from "../data/language"
import MapList from "../data/MapList"
import Appearance from "../Events/Appearance"
import audio from "../lib/AudioHandler"
import { qutor } from "../lib/kel"
import modal from "../lib/modal"
import socket from "../lib/Socket"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import { IPMCConfig } from "../types/DBTypes"

interface IAppearanceConfig extends IPMCConfig {
  item_id?: string
  pmcTitle?: string
  pmcContinue?: string
}

export default class CharCreation extends Appearance {
  constructor(config: IAppearanceConfig) {
    super(config)
  }
  protected formListener(): void {
    const btnContinue = qutor(".btn-continue", this.el) as HTMLDivElement
    btnContinue.onclick = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      this.isLocked = true
      const uname = await modal.prompt({
        msg: lang.ACC_NO_USERNAME,
        ic: "pencil",
        max: 20,
        pholder: "mbakmega420",
        iregex: /[^A-Za-z0-9_]/g
      })
      if (!uname) {
        this.isLocked = false
        return
      }
      audio.emit({ action: "play", type: "ui", src: "ui02", options: { id: "ui02" } })
      if (uname.trim().length < 1) {
        await modal.alert(lang.ACC_NO_USERNAME)
        this.isLocked = false
        return
      }
      const username = uname.trim()
      if (!username.match(/^[A-Za-z0-9_.-]+$/)) {
        await modal.alert(lang.ACC_USERNAME_NOT_VALID)
        this.isLocked = false
        btnContinue.click()
        return
      }
      if (username.length < 5 || username.length > 20) {
        await modal.alert(lang.ACC_USERNAME_LIMIT)
        this.isLocked = false
        btnContinue.click()
        return
      }
      const data = {
        username: username,
        skin: this.chars
      }
      const saveChar = await modal.loading(xhr.post("/x/account/create-user", data))
      if (saveChar?.code !== 200) {
        await modal.alert(lang[saveChar.msg]?.replace(/{username}/g, saveChar.data?.username || data.username) || lang.ERROR)
        this.isLocked = false
        btnContinue.click()
        return
      }

      socket.updateData(saveChar.data, true)
      Object.keys(MapList).forEach((k) => {
        if (MapList[k].configObjects["hero"]) {
          MapList[k].configObjects["hero"].src = Object.values(saveChar.data.me.skin)
        }
      })

      this.isLocked = false
      backsong.switch(2, 2)
      backsong.start(1000)
      this.resumeMap()
      await this.destroy()
    }
    this.enter = new KeyPressListener("enter", () => {
      btnContinue.click()
    })
  }
  start(): void {
    this.init()
    backsong.switch(0, 5)
    backsong.start(1000)
    const btnCancel = qutor(".btn-cancel", this.el)
    if (btnCancel) btnCancel.remove()
    const helpCancel = qutor(".help-cancel", this.el)
    if (helpCancel) helpCancel.remove()
  }
}
