import "../stylesheets/home.scss"
import nav from "./lib/nav"

nav()

function removeHistory(): void {
  window.addEventListener(
    "scroll",
    () => {
      window.history.replaceState({}, "", window.location.pathname)
    },
    { once: true }
  )
}

let pwaInstaller: BeforeInstallPromptEvent | null = null
let PWA_READY: boolean = false

const btnInstall = document.getElementById("btn-install") as HTMLAnchorElement | null

function showInstallButton(): void {
  if (btnInstall) btnInstall.classList.remove("hide")
}
function hideInstallButton(): void {
  if (btnInstall) btnInstall.classList.add("hide")
}

function setPWA(): void {
  if (btnInstall)
    btnInstall.onclick = async (e) => {
      e.preventDefault()
      if (window.matchMedia("(display-node: fullScreen)").matches) {
        window.location.href = "/app?pwa=69"
      }

      if (PWA_READY) {
        window.location.href = "/app?pwa=60"
        return
      }

      if (pwaInstaller) {
        const confirm_install = await pwaInstaller.prompt()
        if (confirm_install.outcome === "accepted") {
          PWA_READY = true
        }
      }
    }

  window.addEventListener("appinstalled", () => {
    hideInstallButton()
  })

  window.addEventListener("beforeinstallprompt", (event: BeforeInstallPromptEvent) => {
    event.preventDefault()
    pwaInstaller = event

    if (window.matchMedia("(display-node: fullScreen)").matches) {
      PWA_READY = true
    }

    showInstallButton()
  })
}

function setOnResize(): void {
  window.addEventListener("resize", () => {
    if (PWA_READY) {
      hideInstallButton()
      window.location.href = "/app?pwa=69"
    }
  })
}

const canvas = document.querySelector(".icon") as HTMLCanvasElement
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
ctx.imageSmoothingEnabled = false
const size = 112
const grid = 96
const frames = [
  [0, 0],
  [1, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [0, 0],
  [1, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
  [4, 1],
  [5, 1],
  [6, 1],
  [7, 1],
  [2, 1],
  [3, 1],
  [4, 1],
  [5, 1],
  [6, 1],
  [7, 1],
  [1, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [0, 0],
  [1, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [0, 2],
  [1, 2],
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 2],
  [6, 2],
  [7, 2],
  [8, 2],
  [7, 2],
  [2, 2],
  [3, 2],
  [4, 2],
  [5, 2],
  [6, 2],
  [7, 2],
  [8, 2],
  [9, 2],
  [0, 0],
  [1, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [0, 0],
  [1, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0]
]

let currframe: number = 0
function spriteImage(): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = "/images/Kulon_Icons.png"
  })
}
function draw(img: HTMLImageElement): void {
  const [x, y] = frames[currframe]
  currframe++
  if (currframe >= frames.length) currframe = 0
  ctx.clearRect(0, 0, size, size)
  ctx.drawImage(img, grid * x, grid * y, grid, grid, 0, 0, size, size)
}
async function renderImage(): Promise<void> {
  const img = await spriteImage()
  setInterval(() => {
    draw(img)
  }, 100)
}

const paralax = document.querySelector(".para") as HTMLDivElement
window.addEventListener("scroll", () => {
  const scrollHeight = window.scrollY
  const paralaxTop = paralax.offsetTop

  const clientHeight = paralaxTop + paralax.offsetHeight
  const clientTop = paralaxTop - window.innerHeight
  const offset = scrollHeight - paralaxTop

  if (scrollHeight >= clientTop && scrollHeight < clientHeight) {
    paralax.style.backgroundPositionY = offset * 0.6 + "px"
  }
})
window.onload = () => {
  removeHistory()
  setPWA()
  setOnResize()
  renderImage()
}
