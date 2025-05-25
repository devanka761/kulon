import Backpack from "../contents/Backpack.js";
import Friends from "../contents/Friends.js";
import Jobs from "../contents/Jobs.js";
import Mails from "../contents/Mails.js";
import Shop from "../contents/Shop.js";
import TeamSearch from "../contents/TeamSearch.js";
import Trophies from "../contents/Trophies.js";
import ItemData from "./itemData.js";
import Setting from "./Setting.js";
import AdminMailSender from "../contents/AdminMailSender.js";
import AdminTP from "../contents/AdminTP.js";
import AdminMod from "../contents/AdminMod.js";

const phonelist = [
  {
    id: "friends", g: [1,2], n: "PHONE_FRIENDS", ic: "fa-sharp-duotone fa-solid fa-address-book",
    r(config) {new Friends(config).init()}
  }, {
    id: "jobs", g: [1], n: "PHONE_JOBS", ic: "fa-duotone fa-solid fa-briefcase",
    r(config) {new Jobs(config).init()}
  }, {
    id: "team", g: [1], n: "PHONE_TEAM", ic: "fa-duotone fa-solid fa-people-group",
    r(config) {new TeamSearch(config).init()}
  }, {
    id: "shop", g: [1,2], n: "PHONE_SHOP", ic: "fa-sharp-duotone fa-solid fa-shopping-bag",
    cl: { 1: "b-shop-1", 2: "b-shop-2"},
    r(config) {new Shop(config).init()}
  }, {
    id: "trophies", g: [1,2], n: "PHONE_TROPHY", ic: "fa-sharp-duotone fa-solid fa-trophy-star",
    cl: {1: "b-trophies-1", 2: "b-trophies-2"},
    r(config) {new Trophies(config).init()}
  }, {
    id: "backpack", g: [1,2], n: "PHONE_BACKPACK", ic: "fa-sharp-duotone fa-solid fa-backpack",
    r(config) {new Backpack(config).init()}
  }, {
    id: "mails", g: [1,2], n: "PHONE_MAIL", ic: "fa-sharp-duotone fa-solid fa-envelope",
    r(config) {new Mails(config).init()}
  }, {
    id: "leave_job", g: [2], n: "PHONE_LEAVE_JOB", ic: "fa-sharp-duotone fa-solid fa-person-to-door",
    r(config) {new ItemData({...config, passedData:null, _id:"wantToLeaveMission"}).init()}
  }, {
    id: "setting", g: [1,2], n: "PHONE_SETTING", ic: "fa-sharp-duotone fa-solid fa-gear",
    r(config) {new Setting(config).init()}
  }, {
    id: "admintp", g: [761], n: "PHONE_TELEPORT", ic: "fa-sharp-duotone fa-solid fa-location-dot",
    r(config) {new AdminTP(config).init()}
  }, {
    id: "adminmailsender", g: [761], n: "PHONE_MAIL_SENDER", ic: "fa-sharp-duotone fa-solid fa-envelopes-bulk",
    r(config) {new AdminMailSender(config).init()}
  }, {
    id: "adminmoderation", g: [761], n: "PHONE_MODERATION", ic: "fa-sharp-duotone fa-solid fa-user-secret",
    r(config) {new AdminMod(config).init()}
  }
];
export default phonelist;
