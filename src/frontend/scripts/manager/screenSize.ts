import screenfull from "screenfull"
import lang from "../data/language"
import modal from "../lib/modal"

export async function checkScreenSize(): Promise<void> {
  const width = window.innerWidth
  const height = window.innerHeight
  const size = `${width} x ${height}`
  const message = lang.SCREEN_SIZE.replace("{SIZE}", size)

  const urlParams = new URLSearchParams(window.location.search)
  const pwa = urlParams.get("pwa")

  if ((width < 720 || height < 480) && !pwa) {
    await modal.alert({ ic: "mobile-rotate", msg: message, okx: lang.DN_TXT_CONTINUE })

    const docEl = document.documentElement

    if (screenfull.isEnabled) screenfull.request(docEl, { navigationUI: "hide" })
  }

  if (screen.orientation && "lock" in screen.orientation && typeof screen.orientation["lock"] === "function") {
    try {
      await screen.orientation["lock"]("landscape")
    } catch (_err) {
      // console.warn("Gagal rotate:", err)
    }
  }
}
