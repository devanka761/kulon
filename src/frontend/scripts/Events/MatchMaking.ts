import db from "../data/db"
import waittime from "../lib/waittime"
import lang from "../data/language"
import { eroot, futor, kel, qutor } from "../lib/kel"
import LocalList from "../data/LocalList"
import MembersAPI from "../APIs/MembersAPI"
import MemberBuilder from "../APIs/MemberBuilder"
import modal from "../lib/modal"
import socket from "../lib/Socket"
import { KeyPressListener } from "../main/KeyPressListener"
import peers from "../data/Peers"
import xhr from "../lib/xhr"
import LoadAssets from "../lib/LoadAssets"
import Prepare from "./Prepare"
import chat from "../manager/Chat"
import audio from "../lib/AudioHandler"
import backsong from "../APIs/BackSongAPI"
import { loadMiniGame } from "../lib/minigameLoader"
import { IPMC, IPMCConfig, IUser } from "../types/db.types"
import { IMissionList } from "../types/job.types"
import { Game } from "../main/Game"
import { ISival } from "../types/lib.types"

interface IMatchMakingConfig extends IPMCConfig {
  onComplete: () => void
  mission: IMissionList
  game: Game
}

export default class MatchMaking implements IPMC {
  id: string = "matchmaking"
  isLocked: boolean = false
  onComplete: () => void

  private mission: IMissionList
  private game: Game

  private el!: HTMLDivElement

  members: MembersAPI = new MembersAPI()
  private activeBoardIndex: number = 1
  private selectedIndices: [number, number, number] = [-1, -1, -1]
  private navKeyListener?: (...args: ISival) => ISival
  private isAborted: boolean = false

  private friendlist!: HTMLDivElement
  private crewlist!: HTMLDivElement
  private btnInvType!: HTMLDivElement
  private btnInvLabel!: HTMLDivElement
  private txtInvType!: HTMLDivElement
  private btnStart!: HTMLDivElement

  private esc?: KeyPressListener
  private keyE?: KeyPressListener
  private keyQ?: KeyPressListener
  private space?: KeyPressListener

  constructor(config: IMatchMakingConfig) {
    this.onComplete = config.onComplete
    this.game = config.game
    this.mission = config.mission
  }
  private createElement(): void {
    this.el = kel("div", "Matchmaking")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="nav-title text">${this.mission.name}</div>
        <div class="nav-desc text">${this.mission.desc[LocalList.lang!]}</div>
      </div>
      <div class="con">
        <div class="board">
          <div class="board-title">${lang.MM_INVITE_TYPE}</div>
          <div class="board-content">
            <div class="card btn-inv-type">
              <div class="lr">
                <div class="switch switch-left">
                  <i class="fa-solid fa-chevron-left"></i>
                  <span class="keyinfo">q</span>
                </div>
                <span class="btn-text">${lang.MM_INV_1_TITLE}</span>
                <div class="switch switch-right">
                  <span class="keyinfo">e</span>
                  <i class="fa-solid fa-chevron-right"></i>
                </div>
              </div>
            </div>
            <div class="card textbox txt-inv-type">${lang.MM_INV_1_DESC}</div>
            <div class="card textbox txt-tutor">${lang.ARROW_ALL.split("<br/>").join(" ")}</div>
            <div class="card textbox txt-tutor">${lang.MM_MEMBER_OPT.split("<br/>").join(" ")}</div>
          </div>
        </div>
        <div class="board">
          <div class="board-title">${lang.MM_TEAMUP}: ${this.mission.min}P - ${this.mission.max}P</div>
          <div class="board-content content-users player-list">
          </div>
        </div>
        <div class="board">
          <div class="board-title">${lang.MM_ACT_INV}</div>
          <div class="board-content content-users friend-list">
          </div>
        </div>
      </div>
      <div class="actions">
        <div class="btn btn-cancel"><span class="keyinfo">esc</span> ${lang.EXIT}</div>
        <div class="btn btn-start disabled">${db.job.host === db.me.id ? '<span class="keyinfo">space</span> ' + lang.TS_START : lang.MM_WAITING}</div>
      </div>
    </div>`
    this.friendlist = qutor(".friend-list", this.el) as HTMLDivElement
    this.crewlist = qutor(".player-list", this.el) as HTMLDivElement
    this.btnInvType = qutor(".btn-inv-type", this.el) as HTMLDivElement
    this.btnInvLabel = qutor(".btn-inv-type .btn-text", this.el) as HTMLDivElement
    this.txtInvType = qutor(".txt-inv-type", this.el) as HTMLDivElement
    this.btnStart = qutor(".btn-start", this.el) as HTMLDivElement
  }
  private setupBoards(): void {
    const actions = futor(".actions", this.el)
    actions.prepend(this.game.kulonUI.chat.html)

    // this.boards = Array.from(futor(".con", this.el).querySelectorAll(".board-content"))
    this.selectInitialCard()
  }
  updateInviteType(isUpdated: boolean = false): void {
    db.job.invite! += isUpdated ? 0 : 1
    if (db.job.invite! > 3) db.job.invite = 1
    if (!isUpdated) socket.send("jobInviteType", { invite: db.job.invite })

    this.btnInvLabel.innerHTML = lang["MM_INV_" + db.job.invite!.toString() + "_TITLE"]
    this.txtInvType.innerHTML = lang["MM_INV_" + db.job.invite!.toString() + "_DESC"].replace("{TEAM_CODE}", db.job.code!.toString())
  }
  private setInitialUser(): void {
    const friends = db.room.friend
    friends.forEach((friend) => {
      this.updateFriends(friend)
    })
    this.updateCrew(db.me)
    this.writeEmptyFriend()
  }
  updateFriends(user: IUser, isDeleting: boolean = false): void {
    if (isDeleting) {
      this.members.removeOne("friend", user.id)
      return
    }
    if (this.members.getFriend(user.id)) return
    const member = new MemberBuilder({
      user,
      matchmaking: this,
      type: "friend",
      host: db.job.host === user.id,
      isLocked: () => this.isLocked || chat.formOpened
    })
    this.members.add(member)
    this.friendlist.append(member.html)
    this.writeEmptyFriend()
  }
  private writeEmptyFriend(): void {
    if (db.room.friend.length < 1) {
      const empBefore = this.friendlist.querySelector(".empty-card")
      if (!empBefore) {
        const emptyCard = document.createElement("div")
        emptyCard.classList.add("card", "empty-card", "usr")
        emptyCard.innerHTML = `<span class="ita">${lang.FR_EMPTY}</span>`
        this.friendlist.append(emptyCard)
      }
    } else {
      const empBefore = this.friendlist.querySelector(".empty-card")
      if (empBefore) empBefore.remove()
    }
  }
  async updateCrew(user: IUser | string, isDeleting: boolean = false): Promise<void> {
    if (isDeleting) {
      const userId = typeof user === "string" ? user : user.id
      const friend = this.members.getFriend(userId)
      if (friend) friend.updateStatus("INITIAL")
      this.members.removeOne("crew", userId)
      peers.close(userId)
      this.updateStart()
      if (userId === db.job.host) {
        this.aborted()
        return
      }
      return
    }
    if (typeof user === "string") return

    chat.add(user.id, lang.TC_JOINED, true)
    const host = db.job.host === user.id
    const member = new MemberBuilder({
      matchmaking: this,
      user,
      type: "crew",
      host,
      isLocked: () => this.isLocked || chat.formOpened
    })
    this.members.add(member)
    if (host) {
      this.crewlist.prepend(member.html)
    } else {
      this.crewlist.append(member.html)
    }
    this.updateStart()
  }
  private selectInitialCard(): void {
    this.members.getAll.forEach((member) => member.deselect())
    this.selectedIndices.fill(-1)

    const membersInBoard = this.members.getMembersByBoard(this.activeBoardIndex)
    if (membersInBoard.length > 0) {
      audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
      this.selectedIndices[this.activeBoardIndex] = 0
      const memberToSelect = membersInBoard[0]
      memberToSelect.select()

      // @ts-expect-error no default types
      memberToSelect.html.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
    }
  }
  private handleNavigation(e: KeyboardEvent): void {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(e.key)) return
    if (this.isLocked || chat.formOpened) return
    e.preventDefault()

    const currentBoardMembers = this.members.getMembersByBoard(this.activeBoardIndex)
    let currentIndex = this.selectedIndices[this.activeBoardIndex]

    if (currentIndex > -1 && currentBoardMembers[currentIndex]) {
      currentBoardMembers[currentIndex].deselect()
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (currentBoardMembers.length === 0) return

      if (e.key === "ArrowDown") {
        currentIndex = currentIndex >= currentBoardMembers.length - 1 ? 0 : currentIndex + 1
      } else if (e.key === "ArrowUp") {
        currentIndex = currentIndex <= 0 ? currentBoardMembers.length - 1 : currentIndex - 1
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (e.key === "ArrowRight") {
        this.activeBoardIndex = this.activeBoardIndex >= 2 ? 1 : this.activeBoardIndex + 1
      } else if (e.key === "ArrowLeft") {
        this.activeBoardIndex = this.activeBoardIndex <= 1 ? 2 : this.activeBoardIndex - 1
      }
      this.selectInitialCard()
      return
    } else if (e.key === "Enter") {
      if (currentIndex > -1 && currentBoardMembers[currentIndex]) {
        currentBoardMembers[currentIndex].click()
      }
    }

    this.selectedIndices[this.activeBoardIndex] = currentIndex
    if (currentIndex > -1 && currentBoardMembers[currentIndex]) {
      audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: Date.now().toString() } })
      const newSelectedMember = currentBoardMembers[currentIndex]
      newSelectedMember.select()

      // @ts-expect-error no default types
      newSelectedMember.html.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
    }
  }
  private initNavKeyListener(): void {
    this.navKeyListener = this.handleNavigation.bind(this)
    document.addEventListener("keydown", this.navKeyListener)
  }
  private removeNavKeyListener(): void {
    if (this.navKeyListener) {
      document.removeEventListener("keydown", this.navKeyListener)
      this.navKeyListener = undefined
    }
  }
  async kicked(): Promise<void> {
    await modal.abort()
    this.isLocked = true
    await modal.alert(lang.MM_GOT_KICKED)
    db.job.reset()
    peers.closeAll()
    this.isLocked = false
    this.resumeMap()
    this.destroy()
  }
  private resumeMap(): void {
    if (this.game) {
      this.game.pause()
      this.game.resume()
    }
  }
  private btnListener(): void {
    const btnCancel = futor(".btn-cancel", this.el)
    btnCancel.onclick = async () => {
      if (this.isLocked || chat.formOpened) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      const exitMsg = db.job.host === db.me.id ? "MM_NOTIP_DISBAND" : "MM_NOTIP_EXIT"
      const exitConfirm = await modal.confirm(lang[exitMsg])
      if (!exitConfirm) {
        this.isLocked = false
        return
      }
      peers.closeAll()
      db.job.reset()
      socket.send("jobExit")
      this.isLocked = false
      this.resumeMap()
      this.destroy()
    }
    this.esc = new KeyPressListener("escape", () => {
      btnCancel.click()
    })
    this.btnInvType.onclick = async () => {
      if (this.isLocked || chat.formOpened) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      if (db.job.host !== db.me.id) {
        this.isLocked = true
        await modal.alert(lang.MM_NOTIP_HOST_FUNC)
        this.isLocked = false
        return
      }
      this.updateInviteType()
    }
    this.keyE = new KeyPressListener("e", () => {
      this.btnInvType.click()
    })
    this.keyQ = new KeyPressListener("q", () => {
      this.btnInvType.click()
    })

    this.btnStart.onclick = async () => {
      if (this.isLocked || chat.formOpened) return
      audio.emit({ action: "play", type: "ui", src: "menu_select", options: { id: "menu_select" } })
      this.isLocked = true
      if (db.job.host !== db.me.id) {
        await modal.alert(lang.MM_NOTIP_WAITING_HOST)
        this.isLocked = false
        return
      }

      const playerSize = db.job.players!.length

      if (playerSize > this.mission.max || playerSize < this.mission.min) {
        await modal.alert(lang.MM_NOTIP_WAITING_PLAYER)
        this.isLocked = false
        return
      }

      if (playerSize <= 1) {
        const confirmAlone = await modal.confirm(lang.MM_ALONE)
        if (!confirmAlone) {
          this.isLocked = false
          return
        }
      }

      this.startJob()
    }
    this.space = new KeyPressListener("space", () => {
      this.btnStart.click()
    })
  }
  updateStart(): void {
    const playerSize = db.job.players!.length
    if (playerSize <= this.mission.max && playerSize >= this.mission.min) {
      this.btnStart.classList.remove("disabled")
    } else {
      this.btnStart.classList.add("disabled")
    }
  }
  updateQueue(): void {
    const waitKick = db.waiting.get("jobkick")
    const waitExit = db.waiting.get("jobexit")
    const waitjoin = db.waiting.getMany("jobjoin")
    const waitStart = db.waiting.get("jobstart")

    if (waitKick) {
      this.kicked()
      db.waiting.reset()
      return
    }

    if (waitExit) {
      this.updateCrew(waitExit.user, true)
      db.waiting.remove("jobexit")
      return
    }

    if (waitjoin.length >= 1) {
      waitjoin.forEach((usr) => this.updateCrew(usr.user))
      db.waiting.removeMany("jobjoin")
      return
    }

    if (waitStart) {
      db.waiting.remove("jobstart")
      this.isLocked = true
      this.parseData()
      return
    }
  }
  lock(): void {
    this.isLocked = true
  }
  unlock(): void {
    this.isLocked = false
  }
  getLocked(): boolean {
    return this.isLocked
  }
  async startJob(): Promise<void> {
    this.btnStart.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>'

    const job = await xhr.post("/x/job/start")
    if (job.code === 429 || job.msg === "TO_MANY_REQUEST") {
      await waittime(1000)
      return this.startJob()
    }
    if (!job.ok) {
      await modal.alert(lang[job.msg] || lang.ERROR)
      this.btnStart.innerHTML = db.job.host === db.me.id ? '<span class="keyinfo">space</span> ' + lang.TS_START : lang.MM_WAITING
      this.isLocked = false
      return
    }
    this.parseData()
  }
  private async parseData(): Promise<void> {
    this.btnStart.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${lang.DOWNLOADING}`

    const nextAssets = await xhr.get(`/json/assets/st_${this.mission.map}.json?v=${Date.now()}`)
    await new LoadAssets({ skins: nextAssets }).run()

    const nextMap = await xhr.get(`/json/maps/mp_${this.mission.map}.json?v=${Date.now()}`)
    db.job.nextMap = nextMap

    const nextComplete = await xhr.get(`/json/scenes/cs_${this.mission.map}.json?v=${Date.now()}`)

    db.job.finishScenes = nextComplete

    if (this.mission.mode === 2) {
      const MiniGame = await loadMiniGame(this.mission.id)
      db.pmx = new MiniGame.default({ job: db.job, peers, socket, me: db.me.id })
      const STYLE_PATH = `/bundle/${this.mission.id}/main.css`
      const cssId = "css" + this.mission.id

      if (!document.getElementById(cssId)) {
        const cssContent = await fetch(STYLE_PATH)
          .then((res) => res.text())
          .then((res) => res)

        const minigameStyle = kel("style")
        minigameStyle.id = cssId
        minigameStyle.textContent = cssContent

        document.head.appendChild(minigameStyle)
      }
    }

    this.btnStart.innerHTML = `${lang.PRP_WAITING}`
    socket.send("jobDoneLoading")
  }
  async prepare(starttime: number): Promise<void> {
    audio.emit({ action: "stop", type: "ambient", options: { fadeOut: 2000 } })
    backsong.destroy(2000)
    await modal.abort()
    this.isLocked = true
    const prepare = new Prepare({
      startTime: starttime,
      onComplete: this.onComplete,
      game: this.game,
      mission: this.mission
    })
    this.isLocked = false
    this.destroy(prepare)
  }
  async aborted(): Promise<void> {
    if (!this.members.getCrew(db.me.id)) return
    if (this.isAborted) return
    this.isAborted = true
    await modal.abort()
    this.isLocked = true
    await modal.alert(lang.JOB_DISBANDED)
    this.isLocked = false
    db.job.reset()
    peers.closeAll()
    this.resumeMap()
    this.destroy()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    audio.emit({ action: "play", type: "ui", src: "phone_close", options: { id: "phone_close" } })
    if (chat.formOpened) chat.hide()
    this.isLocked = true
    this.el.classList.add("out")
    this.members.reset()
    this.removeNavKeyListener()
    this.esc?.unbind()
    this.keyE?.unbind()
    this.keyQ?.unbind()
    this.space?.unbind()
    await waittime()
    this.game.kulonUI.restore()
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (this.isAborted) next = undefined
    if (!next) {
      chat.clear()
      chat.add(db.me.id, lang.TC_LEFT, true)
      return this.onComplete()
    }
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    audio.emit({ action: "play", type: "ui", src: "phone_open", options: { id: "phone_open" } })
    this.game.pause()
    this.createElement()
    eroot().append(this.el)
    this.setInitialUser()
    this.setupBoards()
    this.initNavKeyListener()
    this.updateInviteType(true)
    this.updateStart()
    this.btnListener()
    this.updateQueue()
  }
}
