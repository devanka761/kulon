import db from "../data/db"
import waittime from "../lib/waittime"
import lang from "../data/language"
import { eroot, kel, qutor } from "../lib/kel"
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

export default class MatchMaking {
  constructor({ onComplete, game, mission }) {
    this.id = "matchmaking"
    this.onComplete = onComplete
    this.game = game
    this.mission = mission
    this.members = new MembersAPI()
    this.boards = []
    this.activeBoardIndex = 1
    this.selectedIndices = [-1, -1, -1]
    this.navKeyListener = null
    this.isAborted = false
  }
  createElement() {
    this.el = kel("div", "Matchmaking")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="nav-title text">${this.mission.name}</div>
        <div class="nav-desc text">${this.mission.desc[LocalList.lang]}</div>
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
    this.friendlist = qutor(".friend-list", this.el)
    this.crewlist = qutor(".player-list", this.el)
    this.btnInvType = qutor(".btn-inv-type", this.el)
    this.btnInvLabel = qutor(".btn-inv-type .btn-text", this.el)
    this.txtInvType = qutor(".txt-inv-type", this.el)
    this.btnStart = qutor(".btn-start", this.el)
    this.btnCancel = qutor(".btn-cancel", this.el)
  }
  setupBoards() {
    this.boards = Array.from(qutor(".con", this.el).querySelectorAll(".board-content"))
    this.selectInitialCard()
  }
  updateInviteType(isUpdated = false) {
    db.job.invite += isUpdated ? 0 : 1
    if (db.job.invite > 3) db.job.invite = 1
    if (!isUpdated) socket.send("jobInviteType", { invite: db.job.invite })

    this.btnInvLabel.innerHTML = lang["MM_INV_" + db.job.invite.toString() + "_TITLE"]
    this.txtInvType.innerHTML = lang["MM_INV_" + db.job.invite.toString() + "_DESC"].replace("{TEAM_CODE}", db.job.code)
  }
  setInitialUser() {
    const friends = db.room.friend
    friends.forEach((friend) => {
      this.updateFriends(friend)
    })
    this.updateCrew(db.me)
    this.writeEmptyFriend()
  }
  updateFriends(user, isDeleting = false) {
    if (isDeleting) {
      this.members.removeOne("friend", user.id)
      return
    }
    if (this.members.getFriend(user.id)) return
    const member = new MemberBuilder({
      user,
      matchmaking: this,
      type: "friend",
      host: db.job.host === user.id
    })
    this.members.add(member)
    this.friendlist.append(member.html)
    this.writeEmptyFriend()
  }
  writeEmptyFriend() {
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
  async updateCrew(user, isDeleting = false) {
    if (isDeleting) {
      const userId = user.id || user
      const friend = this.members.getFriend(userId)
      if (friend) friend.updateStatus("INITIAL")
      this.members.removeOne("crew", userId)
      peers.remove(userId)
      if (userId === db.job.host) {
        this.aborted()
        return
      }
      return
    }
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
  }
  selectInitialCard() {
    this.members.getAll.forEach((member) => member.deselect())
    this.selectedIndices.fill(-1)

    const membersInBoard = this.members.getMembersByBoard(this.activeBoardIndex)
    if (membersInBoard.length > 0) {
      audio.emit({ action: "play", type: "ui", src: "phone_menu_move", options: { id: Date.now().toString() } })
      this.selectedIndices[this.activeBoardIndex] = 0
      const memberToSelect = membersInBoard[0]
      memberToSelect.select()
      memberToSelect.html.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
    }
  }
  handleNavigation(e) {
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
      newSelectedMember.html.scrollIntoView({ behavior: "smooth", block: "center", container: "nearest" })
    }
  }
  initNavKeyListener() {
    this.navKeyListener = this.handleNavigation.bind(this)
    document.addEventListener("keydown", this.navKeyListener)
  }
  removeNavKeyListener() {
    if (this.navKeyListener) {
      document.removeEventListener("keydown", this.navKeyListener)
      this.navKeyListener = null
    }
  }
  async kicked() {
    await modal.abort()
    this.isLocked = true
    await modal.alert(lang.MM_GOT_KICKED)
    db.job.reset()
    peers.closeAll()
    this.isLocked = false
    this.resumeMap()
    this.destroy()
  }
  resumeMap() {
    if (this.game) {
      this.game.pause()
      this.game.resume()
    }
  }
  btnListener() {
    this.btnCancel.onclick = async () => {
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
      socket.send("jobExit")
      this.isLocked = false
      this.resumeMap()
      this.destroy()
    }
    this.esc = new KeyPressListener("escape", () => {
      this.btnCancel.click()
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
      const playerSize = db.job.players.length
      if (playerSize <= 1) {
        const confirmAlone = await modal.confirm(lang.MM_ALONE)
        if (!confirmAlone) {
          this.isLocked = false
          return
        }
      }
      if (playerSize > this.mission.max || playerSize < this.mission.min) {
        await modal.alert(lang.MM_NOTIP_WAITING_PLAYER)
        this.isLocked = false
        return
      }

      this.startJob()
    }
    this.space = new KeyPressListener("space", () => {
      this.btnStart.click()
    })
  }
  updateStart() {
    const playerSize = db.job.players.length
    if (playerSize <= this.mission.max && playerSize >= this.mission.min) {
      this.btnStart.classList.remove("disabled")
    } else {
      this.btnStart.classList.add("disabled")
    }
  }
  updateQueue() {
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
  lock() {
    this.isLocked = true
  }
  unlock() {
    this.isLocked = false
  }
  getLocked() {
    return this.isLocked
  }
  async startJob() {
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
  async parseData() {
    this.btnStart.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${lang.DOWNLOADING}`

    const nextAssets = await xhr.get(`/json/assets/st_${this.mission.map}.json`)
    await new LoadAssets({ skins: nextAssets }).run()

    const nextMap = await xhr.get(`/json/maps/mp_${this.mission.map}.json`)
    db.job.nextMap = nextMap

    const nextComplete = await xhr.get(`/json/scenes/cs_${this.mission.map}.json`)
    db.job.finishScenes = nextComplete
    this.btnStart.innerHTML = `${lang.PRP_WAITING}`
    socket.send("jobDoneLoading")
  }
  async prepare(starttime) {
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
  async aborted() {
    if (!this.members.getCrew(db.me.id)) return
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
  async destroy(next) {
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
    this.el.remove()
    this.isLocked = false
    db.pmc = null
    if (this.isAborted) next = null
    if (!next) {
      chat.clear()
      chat.add(db.me.id, lang.TC_LEFT, true)
      return this.onComplete()
    }
    if (typeof next !== "string") return next.init()
  }
  init() {
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
