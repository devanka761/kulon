import cloud_items from "../../../../public/json/items/cloud_items.json"
import db from "../data/db"
import lang from "../data/language"
import LocalList from "../data/LocalList"
import { eroot, futor, kel } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import xhr from "../lib/xhr"
import { IPMC, IPMCConfig } from "../types/db.types"
import { ISival, SSKelement } from "../types/lib.types"

function createOption(item_id: string, item_label: string): HTMLOptionElement {
  const opt = kel("option")
  opt.value = item_id
  opt.innerHTML = item_label
  return opt
}
function createReward(): HTMLDivElement {
  const rw_key = "r" + Date.now().toString(36)
  const field = kel("div", "field rw-field")
  field.innerHTML = `<input list="rewards" name="reward-${rw_key}" id="reward-${rw_key}" placeholder="perisma 12" required /><div class="btn btn-rem-reward"><i class="fa-solid fa-x fa-fw"></i></div>`
  const btnRemove = futor(".btn-rem-reward", field)
  btnRemove.onclick = () => field.remove()
  return field
}

interface IMailSenderConfig extends IPMCConfig {
  onComplete: () => void
  classBefore: IPMC
}

export default class MailSender implements IPMC {
  id: string = "mailsender"
  isLocked: boolean = false
  onComplete: () => void
  classBefore: IPMC

  private el!: HTMLDivElement
  private datalist!: SSKelement
  private form!: HTMLFormElement

  constructor(config: IMailSenderConfig) {
    this.onComplete = config.onComplete
    this.classBefore = config.classBefore
  }
  private createElement(): void {
    this.el = kel("div", "fuwi mailsender")
    this.el.innerHTML = `
    <div class="box">
      <div class="nav">
        <div class="left">
          <div class="title"><i class="fa-solid fa-envelopes-bulk"></i> ${lang.PHONE_MAIL_SENDER}</div>
        </div>
        <div class="right">
          <div class="btn btn-close"><i class="fa-solid fa-circle-x"></i></div>
        </div>
      </div>
      <div class="con">
        <form action="/x/mod/sendmail" method="post" class="form">
          <div class="field">
            <label for="userId">User ID</label>
            <input type="text" name="userId" id="userId" placeholder="761761" required />
          </div>
          <div class="field">
            <label for="title">Title - <small>separate language with \\ (id\\en)</small></label>
            <input type="text" name="title" id="title" placeholder="ex: Selamat \\ Congrats" required />
          </div>
          <div class="field">
            <label for="sub">Sub - <small>separate language with \\ (id\\en)</small></label>
            <input type="text" name="sub" id="sub" placeholder="ex: Sistem \\ System" required />
          </div>
          <div class="field">
            <label for="text">Message - <small>separate language with \\ (id\\en)</small></label>
            <textarea name="text" id="text" placeholder="ex: Kamu Menang \\ You Won" required ></textarea>
          </div>
          <div class="rewards-field">
            <div class="txt">Rewards - <small>ex: &lt;id&gt; &lt;amount&gt;</small></div>
            <datalist id="rewards"></datalist>
            <div class="field rw-field"><input list="rewards" name="reward-r01" id="reward-r01" placeholder="perisma 12" required /></div>
          </div>
          <div class="field">
            <div class="actions">
              <div class="btn btn-add-rw"><i class="fa-solid fa-plus fa-fw"></i> Add Reward</div>
            </div>
          </div>
          <div class="field">
            <div class="actions">
              <button class="btn btn-submit">SEND</button>
            </div>
          </div>
        </form>
      </div>
    </div>`
    this.datalist = futor("#rewards", this.el)
    this.form = futor(".form", this.el) as HTMLFormElement
  }
  private writeDatalist(): void {
    const items = cloud_items.filter((itm) => itm.group === "1")
    items.forEach((itm) => {
      const option = createOption(itm.id, itm.name[LocalList.lang!])
      this.datalist.append(option)
    })
  }
  private btnListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => this.destroy(this.classBefore)
    const erewards = futor(".rewards-field", this.el)
    const btnAddReward = futor(".btn-add-rw", this.el)
    btnAddReward.onclick = () => erewards.append(createReward())
  }
  private formListener(): void {
    this.form.onsubmit = async (e) => {
      e.preventDefault()
      if (this.isLocked) return
      this.isLocked = true
      const hasEmpty = []
      const formData = new FormData(this.form)
      const data: { [key: string]: ISival } = {}
      formData.forEach((val, key) => {
        if (!val) hasEmpty.push(key)
        val = val.toString()
        if (val.length < 1) hasEmpty.push(key)
        if (key.includes("reward-")) {
          if (!data.rewards) data.rewards = {}
          data.rewards[key] = val.trim()
        } else {
          data[key] = val.trim()
        }
      })
      if (hasEmpty.length >= 1) {
        await modal.alert("Ada input yang belum diisi")
        this.isLocked = false
        return
      }
      const sendMail = await modal.loading(xhr.post("/x/mod/sendmail", data))
      if (!sendMail.ok) {
        await modal.alert(lang[sendMail.msg] || sendMail.msg || lang.ERROR)
        this.isLocked = false
        return
      }
      await modal.alert(`Berhasil mengirim surat ke ${data.userId}`)
      this.cleanForm()
      this.isLocked = false
    }
  }
  private cleanForm(): void {
    const inputs = this.form.querySelectorAll("[name][id]") as NodeListOf<HTMLInputElement>
    inputs.forEach((inp) => {
      inp.value = ""
    })
  }
  async destroy(next?: IPMC) {
    if (this.isLocked) return
    this.isLocked = true
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    this.isLocked = false
    db.pmc = undefined
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    this.createElement()
    eroot().append(this.el)
    this.writeDatalist()
    this.formListener()
    this.btnListener()
  }
}
