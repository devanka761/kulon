import { eroot, kel } from "../lib/kel"

export default class ForceClose {
  constructor(s) {
    this.msg_1 = s.msg_1
    this.msg_2 = s.msg_2
    this.action_text = s.action_text || null
    this.action_url = s.action_url || null
    this.init()
  }
  createElement() {
    this.el = kel("div", "ForceClose")
    const ebox = kel("div", "box")
    ebox.innerHTML = `<div class="msg msg-1">${this.msg_1}</div><div class="msg msg-2">${this.msg_2}</div>`
    if (this.action_text && this.action_url) {
      const msg_3 = kel("div", "msg msg-3")
      msg_3.innerHTML = `<p><a href="${this.action_url}">${this.action_text}</a></p>`
      ebox.append(msg_3)
    }
    this.el.append(ebox)
  }
  destroyAll() {
    const appel = eroot()
    while (appel.lastChild) appel.lastChild.remove()
    appel.append(this.el)
  }
  async init() {
    this.createElement()
    this.destroyAll()
  }
}
