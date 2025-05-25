import { klang, lang } from "../helper/lang.js";
import modal from "../helper/modal.js";
import notip from "../helper/notip.js";
import db from "./db.js";
import kchat from "./KChat.js";
import playerState from "./PlayerState.js";

export default class PeerConn {
  constructor({id, cloud, peer}) {
    this.cloud = cloud;
    this.id = id;
    this.peer = peer;
  }
  im_online(s) {
    if(playerState.pmc?.id === "matchmaking") {
      playerState.pmc.updateFriendStatus(s.from, 5, this.peer);
    }
  }
  job_invite(s) {
    this.cloud.asend("hb", s);
  }
  job_ignore(s) {
    if(playerState.pmc?.id === "matchmaking") {
      playerState.pmc.updateFriendStatus(s.from, 3);
    }
  }
  job_accept(s) {
    this.cloud.asend("hb", s);
  }
  job_type_invite(s) {
    if(playerState.pmc?.id === "matchmaking" && db.job.id === s.data.job_id) {
      if(typeof s.data.invite_type !== "number" || s.data.invite_type < 1 || s.data.invite_type > 3) return;
      db.job.ivt = s.data.invite_type;
      playerState.pmc.updateInviteType();
    }
  }
  job_start(s) {
    this.cloud.asend("hb", s);
  }
  job_kick(s) {
    this.cloud.asend("hb", s);
  }
  prepare_ready(s) {
    this.cloud.asend("hb", s);
  }
  prepare_launch(s) {
    this.cloud.asend("prepare_launch", {job_id: db.job.id})
  }
  teleport(s) {
    if(!playerState.journey) return;
    db.lastmove[s.from] = "teleport";
    playerState.journey.setTeleport(s.from, s.data);
  }
  moving(s) {
    if(!playerState.journey) return;
    db.lastmove[s.from] = "moving";
    playerState.journey.setPlayerMovement(s.from, s.data);
  }
  changeMap(s) {
    db.lastmove[s.from] = "changemap";
    if(!playerState.journey) return;
    playerState.journey.setChangeMap(s.from, s.data);
  }
  use_phone(s) {
    if(!playerState.journey) return;
    db.lastmove[s.from] = "usephone";
    playerState.journey.setUsePhone(s.from, s.data);
  }
  cloudflags(s) {
    this.cloud.asend("hb", s);
    if(s.data?.text) {
      kchat.add(s.from, s.data.text[klang.currLang], true);
    }
  }
  delcloudflags(s) {
    this.cloud.asend("hb", s);
  }
  additem(s) {
    this.cloud.asend("hb", s);
  }
  missionComplete(s) {
    this.cloud.asend("hb", s);
  }
  kchat(s) {
    kchat.add(s.from, s.data?.msg || "");
  }
  left_team_chat(s) {
    const crew = db.crew.find(peerid => Object.values(db.job.players).find(usr => usr.id === s.from).peer === peerid);
    kchat.add(s.from, lang.TC_LEFT, 1);
    db.crew = db.crew.filter(peerid => peerid !== crew);
  }
  async run(s) {
    if(this.id === "id" || !this[this.id]) return;
    this[this.id](s);
  }
}