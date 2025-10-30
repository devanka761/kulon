import backsong from "../APIs/BackSongAPI"
import lang from "../data/language"
import Appearance from "../Events/Appearance"
import audio from "../lib/AudioHandler"
import Doodles from "../lib/Doodle"
import { qutor } from "../lib/kel"
import modal from "../lib/modal"
import xhr from "../lib/xhr"
import { KeyPressListener } from "../main/KeyPressListener"
import startGame from "../manager/startGame"
import { IPMCConfig } from "../types/db.types"
import { IMapList } from "../types/maps.types"

interface IAppearanceConfig extends IPMCConfig {
  item_id?: string
  pmcTitle?: string
  pmcContinue?: string
}

export default class CharCreation extends Appearance {
  private doodle?: Doodles
  private nextMap?: IMapList
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
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
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
      this.isLocked = false
      backsong.destroy()
      await this.destroy()
      if (this.doodle) this.doodle.end()
      startGame(saveChar.data, this.nextMap!, true)
    }
    this.enter = new KeyPressListener("enter", () => {
      btnContinue.click()
    })
  }
  start(doodle: Doodles, nextMap: IMapList): void {
    this.doodle = doodle
    this.nextMap = nextMap
    this.init()
    audio.emit({ action: "play", type: "ambient", src: "sidestreet_amb", options: { fadeIn: 5000, volume: 0.1 } })
    backsong.switch(2)
    backsong.start(2000)
    const btnCancel = qutor(".btn-cancel", this.el)
    if (btnCancel) btnCancel.remove()
    const helpCancel = qutor(".help-cancel", this.el)
    if (helpCancel) helpCancel.remove()
    this.el.classList.remove("appearance")
  }
}
