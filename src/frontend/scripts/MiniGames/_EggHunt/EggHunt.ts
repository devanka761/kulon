import "../../../stylesheets/mEggHunt.scss"
import JobAPI from "../../APIs/JobAPI"
import peers from "../../data/Peers"
import SaveList from "../../data/SaveList"
import { eroot, kel } from "../../lib/kel"
import sdate from "../../lib/sdate"
import socket from "../../lib/Socket"
import { Game } from "../../main/Game"
import { IPlayers, IPMX } from "../../types/db.types"
import { ISival } from "../../types/lib.types"
import Participant from "./_Participant"

interface IConfig {
  game: Game
  peers: typeof peers
  socket: typeof socket
  job: JobAPI
}

export default class EggHunt implements IPMX {
  readonly id = "minigame/egghunt"
  private game: Game
  private job: JobAPI
  private el: HTMLDivElement = kel("div", "EggHunt")
  private etime: HTMLSpanElement = kel("span", "egghunt-time")
  private Participants: Participant[] = []
  endTime?: number
  private endInterval?: ReturnType<typeof setInterval>
  // private peers: typeof peers
  // private socket: typeof socket
  constructor(config: IConfig) {
    this.game = config.game
    this.job = config.job
    // this.peers = config.peers
    // this.socket = config.socket
  }
  createElement(): void {
    this.el.prepend(this.etime)
    eroot().append(this.el)
  }

  writePlayers(): void {
    this.job.players!.forEach((player: IPlayers) => {
      const username = this.job.getUser(player.id)!.username
      const participant = new Participant(player.id, username)
      this.Participants.push(participant)
      this.el.append(participant.html)
    })
  }

  addClaim(state: string, owner: string): void {
    SaveList[state] = owner

    const participant = this.Participants.find((player) => player.id === owner)
    if (!participant) return
    participant.addEgg(1)
  }
  setCustom(data: ISival): void {
    const starttime = data as number
    this.endTime = starttime + 1000 * 60 * 3
    this.updateTimeOut()
    this.endInterval = setInterval(() => this.updateTimeOut(), 1000)
  }
  updateTimeOut() {
    const endTime = this.endTime as number
    const remaintime = sdate.remain(endTime, true)
    if (!remaintime) {
      clearInterval(this.endInterval)
      this.endInterval = undefined
      socket.send("endTime")
      return
    }
    this.etime.innerHTML = remaintime
  }
  destroy(): void {
    if (this.endInterval) {
      clearInterval(this.endInterval)
      this.endInterval = undefined
    }
    this.Participants.forEach((player) => player.destroy())
    this.el.remove()
    return
  }
  init(data: ISival): void {
    this.createElement()
    this.writePlayers()
    this.setCustom(data)
  }
}
