import cloud_items from "../../../../public/json/items/cloud_items.json"
import { Exchange } from "../Contents/Exchange"
import shop_items from "../../../../public/json/items/shop_items.json"
import db from "../data/db"
import modal from "../lib/modal"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import xhr from "../lib/xhr"
import Appearance from "../Events/Appearance"
import setNewGame from "../manager/setNewGame"
import MapList from "../data/MapList"
import MatchMaking from "../Events/MatchMaking"
import peers from "../data/Peers"
import socket from "../lib/Socket"
import Payout from "../Events/Payout"
import { Game } from "../main/Game"
import { ISival } from "../types/lib.types"
import { IJobToReturn } from "../types/job.types"
import { CharacterAPI } from "../APIs/CharacterAPI"
import Prologue from "../Events/Prologue"

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class ItemRun {
  readonly id = "itemrun"
  game!: Game
  isLocked: boolean = false
  exchange(config: ISival): void {
    return new Exchange({
      onComplete: config.onComplete,
      classBefore: config.classBefore,
      item_id: shop_items.find((k) => k.req === config.itemId)!.id
    }).init()
  }
  restartGameMap(): void {
    setNewGame({ ...MapList }, this.game, true)
  }
  async appearance(config: ISival): Promise<void> {
    if (db.onduty > 1) {
      await modal.alert(lang.ITD_ONDUTY)
      return config.classBefore.init()
    }
    return new Appearance({
      onComplete: config.onComplete,
      classBefore: config.classBefore,
      item_id: config.id,
      pmcTitle: "CHAR_APR_TITLE",
      pmcContinue: "CHAR_APR_CONTINUE",
      game: this.game
    }).init()
  }
  async changeName(config: ISival): Promise<void> {
    if (db.onduty > 1) {
      await modal.alert(lang.ITD_ONDUTY)
      return config.classBefore.init()
    }
    const locales = [
      {
        id: "Masukkan username baru",
        en: "Enter new username"
      },
      {
        id: "Ganti username menjadi <b>{username}</b>?",
        en: "Change username to <b>{username}</b>?"
      }
    ]

    const newName = await modal.prompt({
      msg: locales[0][LocalList.lang!],
      ic: "pencil",
      max: 20,
      pholder: db.me.username,
      iregex: /[^A-Za-z0-9_]/g
    })

    if (newName === db.me.username) return config.classBefore.init()
    if (!newName) return config.classBefore.init()

    const usernameregex = /^[A-Za-z0-9_]+$/

    if (!newName.match(usernameregex)) {
      await modal.alert(lang.ACC_USERNAME_NOT_VALID)
      return await this.changeName(config)
    }

    const nameConfirm = await modal.confirm({
      msg: locales[1][LocalList.lang!].replace("{username}", newName),
      ic: "question"
    })

    if (!nameConfirm) return config.classBefore.init()

    const nameChanged = await modal.loading(
      xhr.post("/x/account/update-username", {
        username: newName,
        item_id: config.id
      })
    )

    if (!nameChanged || !nameChanged.ok) {
      await modal.alert((lang[nameChanged.msg] || lang.ERROR).replace("{username}", newName))
      return await this.changeName(config)
    }

    db.bag.bulkUpdate(nameChanged.data)

    db.me.username = newName

    await modal.alert({
      msg: lang.ACC_NAME_CARD_SUCCESS.replace("{username}", db.me.username),
      ic: "circle-check"
    })

    return config.classBefore.init()
  }
  async startJob(config: ISival): Promise<void> {
    if (db.onduty > 1) {
      await modal.alert(lang.ITD_ONDUTY)
      return config.classBefore.init()
    }

    const job = await modal.loading(xhr.post("/x/job/create", { mission_id: config.mission.id }), "CREATING")
    if (!job.ok) {
      const price = cloud_items.find((citm) => citm.id === config.mission.price[0])
      await modal.alert((lang[job.msg] || lang.ERROR).replace("{price}", price!.name[LocalList.lang!]))
      return config.classBefore.init()
    }
    db.job.create(job.data)

    return new MatchMaking({
      onComplete: config.onComplete,
      game: this.game,
      mission: config.mission
    }).init()
  }
  async joinJob(config: ISival): Promise<void> {
    if (db.onduty > 1) {
      await modal.alert(lang.ITD_ONDUTY)
      return config.classBefore.init()
    }

    const joinType = config.code ? "code" : "invite"
    const url = "/x/job/join/" + joinType
    const data = { [joinType]: config[joinType] }

    const job = await modal.loading(xhr.post(url, data), "JOINING")
    if (!job.ok) {
      await modal.alert(lang[job.msg] || lang.MM_JOB_INVALID)
      return config.classBefore.init()
    }
    const jobData = job.data as IJobToReturn
    db.job.create(jobData)

    const matchMaking = new MatchMaking({
      onComplete: config.onComplete,
      game: this.game,
      mission: config.mission
    })
    matchMaking.init()
    jobData.users
      .filter((user) => user.id !== db.me.id)
      .forEach((user) => {
        const { remote } = peers.add(user) as CharacterAPI
        remote.call()
        matchMaking.updateCrew(user)
      })
  }
  async leaveJob(config: ISival): Promise<void> {
    const confirmLeave = await modal.confirm(lang.MS_CONFIRM_LEAVE)
    if (!confirmLeave) return config.classBefore.init()

    socket.send("jobExit")
    if (db.pmc?.id === "prologue") {
      const pmc = db.pmc as Prologue
      pmc.manualAborted(db.me)
    }
    return new Payout({ ...config, fail: true }).init()
  }
  run(runId: string, config: ISival = {}) {
    db.pmc = this
    return {
      init: async () => {
        if (INVALID_CONTROLS.find((control) => control === runId)) return config.classBefore.init()

        // @ts-expect-error no default
        if (this[runId]) return this[runId](config)

        await modal.alert({ ic: "helmet-safety", msg: "UNDER DEVELOPMENT" })
        return config.classBefore.init()
      }
    }
  }
  init(game: Game) {
    this.game = game
  }
}
const itemRun = new ItemRun()
export default itemRun
