import db from "../data/db"
import lang from "../data/language"
import ForceClose from "../pages/ForceClose"
import { qutor } from "./kel"
import socketHandler from "./SocketHandler"
import { setPeerConfig } from "../data/peer.config"
import audio from "./AudioHandler"
import ReconnectTool from "../manager/ReconnectTool"
import waittime from "./waittime"
import peers from "../data/Peers"
import { Game } from "../main/Game"
import Prologue from "../Events/Prologue"
import Prepare from "../Events/Prepare"
import MatchMaking from "../Events/MatchMaking"
import { ISival } from "../types/lib.types"
import backsong from "../APIs/BackSongAPI"
import { GameEvent } from "../main/GameEvent"

function socketError(err: Event) {
  console.error(err)
}
function socketMessage(data: MessageEvent) {
  try {
    const msg = JSON.parse(data.data.toString())
    socketHandler.run(msg)
  } catch (err) {
    console.error(err)
  }
}

class Socket {
  private ws?: WebSocket
  private isExited: number = 0
  private game!: Game
  private host!: string
  private id!: string
  private _start(): void {
    this.ws = new WebSocket(`ws${window.location.protocol === "https:" ? "s" : ""}://${this.host}/socket?id=${this.id}`)

    this.ws.addEventListener("error", socketError)
    this.ws.addEventListener("message", socketMessage)
    this.ws.addEventListener("close", () => this._onClosed(), { once: true })
  }
  destroy(): void {
    this.ws?.removeEventListener("error", socketError)
    this.ws?.removeEventListener("message", socketMessage)
  }
  private async _reconnect(): Promise<void> {
    if (db.pmc?.id === "prologue") {
      const pmc = db.pmc as Prologue
      pmc.aborted(db.me)
      await waittime(500)
    }
    if (db.pmc?.id === "prepare") {
      const pmc = db.pmc as Prepare
      pmc.aborted(db.me)
      await waittime(500)
    }
    if (db.pmc?.id === "matchmaking") {
      const pmc = db.pmc as MatchMaking
      pmc.aborted()
      await waittime(500)
    }

    const checkTitleScreen = async (resolve: ISival) => {
      if (this.game.isPaused && db.pmc?.id !== "appearance") {
        await waittime(1000)
        return checkTitleScreen(resolve)
      }
      return resolve()
    }

    await new Promise((resolve) => checkTitleScreen(resolve))

    let oldPmcId: string = "none"
    const checkPmc = async (resolve: ISival) => {
      if (db.pmc && db.pmc.id === oldPmcId) {
        await waittime(500)
        return resolve()
      } else if (db.pmc && db.pmc.destroy) {
        oldPmcId = db.pmc.id
        await db.pmc.destroy()
        await waittime(500)
        return await checkPmc(resolve)
      } else if (db.pmc) {
        await waittime(500)
        return await checkPmc(resolve)
      }
      return resolve(true)
    }
    await new Promise((resolve) => checkPmc(resolve))

    db.pmc = undefined

    const checkCutscene = async (resolve: ISival) => {
      if (this.game.isCutscenePlaying) {
        await waittime(500)
        return await checkCutscene(resolve)
      }
      return resolve(true)
    }
    await new Promise((resolve) => checkCutscene(resolve))

    this.game.forceCutscene(true)
    this.game.pause()

    const reconnectTool = new ReconnectTool()
    const newUser = await reconnectTool.run()

    if (!newUser.ok) {
      const icon = newUser.msg == "CLOUD_TIMEOUT" ? "wifi-slash" : "sign-posts-wrench"
      const text = newUser.msg == "CLOUD_TIMEOUT" ? "RELOAD" : "UPDATE APP"
      this.endGameProcess()
      new ForceClose({
        msg_1: `<i class="fa-duotone fa-solid fa-${icon}"></i>`,
        msg_2: lang[newUser.msg],
        action_url: "/app",
        action_text: text
      })
      return
    }
    this.game.resume()
    this.game.forceCutscene(false)

    if (db.job.status === 3) this.game.startCutscene([{ type: "playerLeft", user: db.me }])

    this._resetOldData()
    this.updateData(newUser.data)

    await waittime(1000)
    peers.closeAll()
    await waittime(1000)

    if (db.lobby.status === true) {
      db.lobby.disable()
      const eventHandler = new GameEvent(this.game, {
        type: "lobby"
      })
      await eventHandler.init()
    }
  }
  private async _onClosed(): Promise<void> {
    this.ws = undefined
    qutor(".modal .btn-cancel")?.click()
    await waittime()
    if (this.isExited >= 1) return
    this._reconnect()
  }
  setExit(newExit: number): void {
    this.isExited = newExit
  }
  close(): void {
    if (this.ws) this.ws.close()
  }
  send(type: string, obj = {}): void {
    const data = { type, identifier: "kulon", ...obj }
    if (this.ws && this.ws.readyState === this.ws.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
  endGameProcess(): void {
    audio.stopAll()
    backsong.destroy(2000)
    db.pmc?.destroy?.()
    this.game.destroy()
  }
  private _resetOldData(): void {
    peers.closeAll()
    db.room.reset()
    db.bag.reset()
    db.mails.reset()
    db.trophies.reset()
    db.invites.reset()
    if (db.onduty < 2) {
      db.job.reset()
    }
  }
  updateData(s: ISival): void {
    if (s.socket) {
      this.id = s.socket.id
      this.host = s.socket.host
    }
    if (s.provider) db.provider = s.provider
    if (s.me) db.me = s.me
    if (s.room) db.room.parse(s.room)
    if (s.bag) db.bag.bulkUpdate(s.bag)
    if (s.mails) db.mails.bulkUpdate(s.mails)
    if (s.trophies) db.trophies.bulkUpdate(s.trophies)
    if (s.peer) setPeerConfig(s.peer)
    if (s.build) db.version = s.build

    this._start()
  }
  init(game: Game) {
    this.game = game
  }
}

const socket = new Socket()
export default socket
