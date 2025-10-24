import lang from "../data/language"
import { KeyPressListener } from "../main/KeyPressListener"
import { IRepB, ISival } from "../types/lib.types"
import { IModalAlertConfig, IModalConfirmConfig, IModalPromptConfig, IModalSelectConfig } from "../types/modal.types"
import audio from "./AudioHandler"
import { eroot, kel, qutor } from "./kel"
import waittime from "./waittime"

const modal = {
  async loading(newfunc: ISival, msg = "LOADING"): Promise<ISival> {
    audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
    const el = kel("div", "loading", {
      e: kel("div", "box", {
        e: [kel("div", "spinner", { e: kel("i", "fa-solid fa-circle-notch fa-spin") }), kel("div", "msg", { e: kel("p", null, { e: msg }) })]
      })
    })
    eroot().append(el)

    await waittime()

    return await newfunc
      .then(async (res: IRepB) => {
        el.classList.add("out")
        await waittime(300, 5)
        el.remove()
        return res
      })
      .catch(async (err: IRepB) => {
        el.classList.add("out")
        await waittime(300, 5)
        el.remove()
        return err
      })
  },
  async smloading(newfunc: ISival, msg = "LOADING"): Promise<ISival> {
    audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
    const el = kel("div", "sm-loading")
    el.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${msg}</span>`
    eroot().append(el)

    await waittime()

    return await newfunc
      .then((res: IRepB) => {
        el.remove()
        return res
      })
      .catch((err: IRepB) => {
        el.remove()
        return err
      })
  },
  element() {
    audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
    return kel("div", "modal")
  },
  alert(options: Partial<IModalAlertConfig> | string): Promise<boolean> {
    return new Promise((resolve) => {
      const definedMsg = typeof options === "string" ? options : null

      const s: IModalAlertConfig = Object.assign(
        {},
        {
          ic: "circle-exclamation",
          msg: definedMsg ? definedMsg : "",
          okx: lang.OK
        },
        typeof options === "string" ? {} : options
      )

      const el = this.element()
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic : "circle-exclamation"}"></i></p>
        </div>
        <div class="inf">
          <p>${typeof s === "string" ? s || "" : s.msg || ""}</p>
        </div>
        <div class="acts act">
          <div class="btn-outer">
            <span class="keysinfo">
              <span class="keyinfo">Esc</span>
              <span>/</span>
              <span class="keyinfo">Enter</span>
            </span>
            <button class="btn btn-cancel btn-ok">${lang.OK || "OK"}</button>
          </div>
        </div>
      </div>`

      const btn = qutor(".acts .btn-ok", el)
      if (btn) btn.innerText = s.okx

      eroot().append(el)

      let keyEnter: KeyPressListener | null = null
      let keyEscape: KeyPressListener | null = null

      if (btn) {
        btn.onclick = async () => {
          el.classList.add("out")
          keyEnter?.unbind()
          keyEscape?.unbind()
          audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
          await waittime()
          el.remove()
          resolve(false)
          if (s.ok) s.ok()
          return
        }
        setTimeout(() => {
          keyEnter = new KeyPressListener("enter", () => {
            btn.click()
          })
          keyEscape = new KeyPressListener("escape", () => {
            btn.click()
          })
        }, 100)
      }
    })
  },
  confirm(options: Partial<IModalConfirmConfig> | string): Promise<boolean> {
    return new Promise((resolve) => {
      const definedMsg = typeof options === "string" ? options : null

      const s: IModalConfirmConfig = Object.assign(
        {},
        {
          ic: "circle-exclamation",
          msg: definedMsg ? definedMsg : "",
          okx: lang.OK,
          cancelx: lang.CANCEL
        },
        typeof options === "string" ? {} : options
      )

      const el = this.element()
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic : "circle-exclamation"}"></i></p>
        </div>
        <div class="inf">
          <p>${typeof s === "string" ? s || "" : s.msg || ""}</p>
        </div>
        <div class="acts">
          <div class="btn-outer">
            <span class="keyinfo">Esc</span>
            <button class="btn btn-cancel">${lang.CANCEL || "CANCEL"}</button>
          </div>
          <div class="btn-outer">
            <span class="keyinfo">Enter</span>
            <button class="btn btn-ok">${lang.OK || "OK"}</button>
          </div>
        </div>
      </div>`

      const btnOk = qutor(".acts .btn-ok", el)
      if (btnOk) btnOk.innerText = s.okx
      const btnCancel = qutor(".acts .btn-cancel", el)
      if (btnCancel) btnCancel.innerText = s.cancelx

      eroot().append(el)

      let keyEnter: KeyPressListener | null = null
      let keyEscape: KeyPressListener | null = null

      if (btnOk) {
        btnOk.onclick = async () => {
          el.classList.add("out")
          keyEnter?.unbind()
          keyEscape?.unbind()
          audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
          await waittime()
          el.remove()
          resolve(true)
          if (s.ok) s.ok()
        }
        setTimeout(() => {
          keyEnter = new KeyPressListener("enter", () => {
            btnOk.click()
          })
        }, 100)
      }
      if (btnCancel) {
        btnCancel.onclick = async () => {
          el.classList.add("out")
          keyEnter?.unbind()
          keyEscape?.unbind()
          audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
          await waittime()
          el.remove()
          resolve(false)
          if (s.cancel) s.cancel()
        }

        setTimeout(() => {
          keyEscape = new KeyPressListener("escape", () => {
            btnCancel.click()
          })
        }, 100)
      }
    })
  },
  prompt(options: Partial<IModalPromptConfig> | string): Promise<string | null> {
    return new Promise((resolve) => {
      const definedMsg = typeof options === "string" ? options : null

      const s: IModalPromptConfig = Object.assign(
        {},
        {
          ic: "circle-exclamation",
          msg: definedMsg ? definedMsg : "",
          okx: lang.OK,
          cancelx: lang.CANCEL,
          tarea: false
        },
        options
      )

      const el = this.element()
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic : "circle-exclamation"}"></i></p>
        </div>
        <div class="inf">
          <p><label for="prompt-field">${typeof s === "string" ? s || "" : s.msg || ""}</label></p>
        </div>
        <div class="acts">
          <div class="btn-outer">
            <span class="keyinfo">Esc</span>
            <button class="btn btn-cancel">${lang.CANCEL || "CANCEL"}</button>
          </div>
          <div class="btn-outer">
            <span class="keyinfo">Enter</span>
            <button class="btn btn-ok">${lang.OK || "OK"}</button>
          </div>
        </div>
      </div>`

      const btnOk = qutor(".acts .btn-ok", el)
      if (btnOk) btnOk.innerText = s.okx
      const btnCancel = qutor(".acts .btn-cancel", el)
      if (btnCancel) btnCancel.innerText = s.cancelx

      const einf = qutor(".inf", el)
      let inp = null
      if (s.tarea) {
        inp = kel("textarea")
        inp.maxLength = s.max ? s.max : 300
      } else {
        inp = kel("input")
        inp.type = "text"
        inp.maxLength = s.max ? s.max : 100
        inp.autocomplete = "off"
      }

      inp.name = "prompt-field"
      inp.id = "prompt-field"
      inp.placeholder = s.pholder || lang.TYPE_HERE || "Type Here"

      if (s.iregex) {
        const tpRegex = s.iregex
        inp.oninput = () => (inp.value = inp.value.replace(tpRegex, ""))
      }

      einf?.append(inp)
      eroot().append(el)
      inp.focus()
      if (s.val) inp.value = s.val

      let keyEnter: KeyPressListener | null = null
      let keyEscape: KeyPressListener | null = null

      if (btnOk) {
        btnOk.onclick = async () => {
          el.classList.add("out")
          keyEnter?.unbind()
          keyEscape?.unbind()
          audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
          await waittime()
          el.remove()
          resolve(inp.value)
          if (s.ok) s.ok()
        }
        setTimeout(() => {
          keyEnter = new KeyPressListener("enter", () => {
            btnOk.click()
          })
        }, 100)
      }
      if (btnCancel) {
        btnCancel.onclick = async () => {
          el.classList.add("out")
          keyEnter?.unbind()
          keyEscape?.unbind()
          audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
          await waittime()
          el.remove()
          resolve(null)
          if (s.cancel) s.cancel()
        }
        setTimeout(() => {
          keyEscape = new KeyPressListener("escape", () => {
            btnCancel.click()
          })
        }, 100)
      }
    })
  },
  select(options: Partial<IModalSelectConfig>): Promise<string | null> {
    return new Promise((resolve) => {
      const s = Object.assign(
        {},
        {
          ic: "circle-exclamation",
          msg: "",
          okx: lang.OK,
          cancelx: lang.CANCEL,
          items: [
            { id: "not_a", label: "Please Add Option 1", activated: false },
            { id: "not_a", label: "Please Add Option 2", activated: false }
          ]
        },
        options
      )

      const el = this.element()
      el.innerHTML = `
      <div class="box">
        <div class="ic">
          <p><i class="fa-duotone fa-${s.ic ? s.ic : "circle-exclamation"}"></i></p>
        </div>
        <div class="inf">
          <p><label for="prompt-field">${typeof s === "string" ? s || "" : s.msg || ""}</label></p>
          <form class="modal-radio-form" id="modal-radio-form"></form>
        </div>
        <div class="acts">
          <div class="btn-outer">
            <span class="keyinfo">Esc</span>
            <button class="btn btn-cancel">${lang.CANCEL || "CANCEL"}</button>
          </div>
          <div class="btn-outer">
            <span class="keyinfo">Enter</span>
            <button class="btn btn-ok">${lang.OK || "OK"}</button>
          </div>
        </div>
      </div>`

      const form = qutor(".box .inf #modal-radio-form", el) as HTMLFormElement
      const optionId = Date.now().toString(36)
      const radioInputs: HTMLDivElement[] = []
      s.items.forEach((itm) => {
        const radioInp = kel("input", null, {
          a: {
            type: "radio",
            name: optionId,
            id: `${optionId}-${itm.id}`,
            value: itm.id,
            required: "true",
            checked: itm.activated ? "true" : false
          }
        })
        const radioLabel = kel("label", null, {
          a: { for: `${optionId}-${itm.id}` },
          e: [radioInp, `<p>${itm.label}</p>`]
        })

        const radio = kel("div", "radio", { e: radioLabel })
        radioInputs.push(radio)
        form.append(radio)
      })

      const btnOk = qutor(".acts .btn-ok", el)
      if (s.okx && btnOk) btnOk.innerText = s.okx
      const btnCancel = qutor(".acts .btn-cancel", el)
      if (s.cancelx && btnCancel) btnCancel.innerText = s.cancelx

      eroot().append(el)

      let keyEnter: KeyPressListener | null = null
      let keyEscape: KeyPressListener | null = null
      let keyArrowHandler = null

      const arrowNavigationHandler = (e: KeyboardEvent) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
        e.preventDefault()

        const currentIndex = radioInputs.findIndex((radio) => radio.querySelector("input")?.checked || false)

        let nextIndex

        if (e.key === "ArrowDown") {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % radioInputs.length
        } else {
          nextIndex = currentIndex <= 0 ? radioInputs.length - 1 : currentIndex - 1
        }

        if (radioInputs[nextIndex]) {
          audio.emit({ action: "play", type: "ui", src: "phone_menu_enter", options: { id: "phone_menu_enter" } })
          radioInputs[nextIndex].querySelector("input")?.click()
        }
      }
      document.addEventListener("keydown", arrowNavigationHandler)
      keyArrowHandler = () => document.removeEventListener("keydown", arrowNavigationHandler)

      if (btnOk) {
        btnOk.onclick = async () => {
          let data = null
          const formData = new FormData(form)
          formData.forEach((val) => (data = val.toString()))
          el.classList.add("out")
          keyEnter?.unbind()
          keyEscape?.unbind()
          keyArrowHandler?.()
          audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
          await waittime()
          el.remove()
          resolve(data)
          if (s.ok) s.ok()
        }
        setTimeout(() => {
          keyEnter = new KeyPressListener("enter", () => {
            btnOk.click()
          })
        }, 100)
      }
      if (btnCancel) {
        btnCancel.onclick = async () => {
          el.classList.add("out")
          keyEnter?.unbind()
          keyEscape?.unbind()
          keyArrowHandler?.()
          audio.emit({ action: "play", type: "ui", src: "dialogue_process", options: { id: "dialogue_process" } })
          await waittime()
          el.remove()
          resolve(null)
          if (s.cancel) s.cancel()
        }
        setTimeout(() => {
          keyEscape = new KeyPressListener("escape", () => {
            btnCancel.click()
          })
        }, 100)
      }
    })
  },
  async abort(): Promise<void> {
    const btnCancel = qutor(".modal .acts .btn-cancel")
    if (btnCancel) {
      btnCancel.click()
      await waittime()
    }
    await waittime(100)
  }
}
export default modal
