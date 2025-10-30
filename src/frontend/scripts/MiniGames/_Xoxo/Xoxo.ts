import "../../../stylesheets/mXoxo.scss"
import JobAPI from "../../APIs/JobAPI"
import peers from "../../data/Peers"
import { eroot, kel } from "../../lib/kel"
import socket from "../../lib/Socket"
import waittime from "../../lib/waittime"
import { Game } from "../../main/Game"
import { playRandomPop } from "../../manager/randomPlays"
import { IPlayers, IPMX, IPMXConfig } from "../../types/db.types"
import { ISival } from "../../types/lib.types"
import Participant from "./_Participant"
import { getByGrid, getGrid } from "./XoxoBoardAPI"

type Resolve = (val?: ISival) => void

type IBoard = (string | null)[][]

const BOARD_SIZE = 11
const WIN_COND = 5

export default class Xoxo implements IPMX {
  readonly id: string = "minigame/xoxo"
  private game?: Game
  private peers: typeof peers
  private socket: typeof socket
  private me: string
  private them!: string
  private job: JobAPI
  private el: HTMLDivElement = kel("div", "Xoxo")

  private Participants: Participant[] = []

  private board: IBoard = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null))

  private isHost: boolean = false
  private currPlayer: string

  constructor(config: IPMXConfig) {
    this.job = config.job
    this.me = config.me
    this.peers = config.peers
    this.socket = config.socket
    this.currPlayer = this.job.host!
  }
  createElement(): void {
    eroot().append(this.el)
  }
  writePlayers(): void {
    this.job.players!.forEach(async (player: IPlayers) => {
      const username = this.job.getUser(player.id)!.username
      const participant = new Participant(player.id, username, this)
      this.Participants.push(participant)
      this.el.append(participant.html)

      if (player.id !== this.me) this.them = player.id

      if (player.id === this.job.host) {
        await waittime(4000)
        participant.resumeTime()
      }
    })
  }
  setInitialBoard(): void {}
  addClaim(_state: string, _status: boolean | string): void {}
  onInteract(posX: number, posY: number, isRemote: boolean = false, data?: ISival): void {
    if (!this.game || (!isRemote && this.currPlayer !== this.me)) return

    const userId = isRemote ? this.them : this.me

    const targetX = Math.round(posX / 16)
    const targetY = Math.ceil(posY / 16)
    const board = getGrid(`${targetX},${targetY}`)
    if (!board) return

    const [gridX, gridY] = board.grid.split(",").map(Number)
    if (typeof this.board[gridY][gridX] === "string") return
    playRandomPop()

    this.currPlayer = userId === this.me ? this.them : this.me

    const participant = this.Participants.find((player) => player.id === userId)!
    participant.pauseTime()

    if (data?.timeout) participant.syncTimeTo(data.timeout)

    const nextParticipant = this.Participants.find((player) => player.id === this.currPlayer)!
    nextParticipant.resumeTime()

    if (!isRemote) {
      this.peers.send("onInteract", {
        posX,
        posY,
        timeout: participant.getTime()
      })
    }

    this.board[gridY][gridX] = userId

    const [firstCoorX, firsCoorY] = board.coor[0].split(",").map(Number)

    this.game.addGameObject({
      id: `xoxo_${board.grid}`,
      type: "Prop",
      x: firstCoorX,
      y: firsCoorY,
      floor: true,
      offset: [1, 1],
      collision: [0, 0, 2, 2],
      src: userId === this.job.host ? "xoxo_o" : "xoxo_x",
      states: [`XOXO_${board.grid}`]
    })
    this.checkWinner(gridY, gridX, userId)
  }
  checkWinner(lastRow: number, lastCol: number, lastPlayer: string) {
    const player = this.board[lastRow][lastCol]

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ]

    const coors: string[] = []
    coors.push(`${lastCol},${lastRow}`)

    for (const [dRow, dCol] of directions) {
      let count = 1

      let r = lastRow + dRow
      let c = lastCol + dCol
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
        count++
        coors.push(`${c},${r}`)
        r += dRow
        c += dCol
      }

      r = lastRow - dRow
      c = lastCol - dCol
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && this.board[r][c] === player) {
        count++
        coors.push(`${c},${r}`)
        r -= dRow
        c -= dCol
      }

      if (count >= WIN_COND) {
        this.setWinner(lastPlayer, coors)
      }
    }

    coors.splice(0, coors.length)
  }
  async setWinner(userId: string, coors?: string[]): Promise<void> {
    this.Participants.forEach((player) => {
      player.destroy()
    })
    if (coors) {
      const states = coors.map((coor) => {
        const [gridX, gridY] = coor.split(",")
        return `XOXO_${gridX},${gridY}`
      })

      const centerGrid = getByGrid(coors[2])!
      const [posX, posY] = centerGrid.coor[0].split(",").map(Number)!

      const checkCutscene = async (resolve: Resolve) => {
        if (this.game?.isCutscenePlaying) {
          await waittime(100)
          return await checkCutscene(resolve)
        }
        return resolve(true)
      }

      const allowed = await new Promise((resolve) => checkCutscene(resolve))
      if (!allowed) return

      const onShot = userId === this.me
      await this.game!.startCutscene([
        { who: "hero", x: posX + (onShot ? 0 : 1), y: posY + (onShot ? 0 : 1), direction: "down", type: "teleport" },
        { who: "hero", direction: "down", type: "stand", time: 1000 },
        { states, type: "addLocalFlags" },
        { who: "hero", direction: "down", type: "stand", time: 500 },
        { who: "hero", direction: onShot ? "right" : "left", type: "stand", time: 1500 },
        { who: "hero", direction: "down", type: "stand", time: 1000 }
      ])
    }

    if (userId === this.me) {
      socket.send("addClaims", { states: ["XOXO_WON"] })
    }
  }
  onTimeOut(playerId: string): void {
    if (playerId === this.me) {
      this.setWinner(this.them)
      return
    }
    this.setWinner(this.me)
  }
  destroy(): void {
    this.Participants.forEach((player) => {
      player.destroy()
    })
    this.el.remove()
    return
  }
  setGame(game: Game): void {
    this.game = game
  }
  init(_data: ISival): void {
    this.createElement()
    this.setInitialBoard()
    this.writePlayers()
  }
}
