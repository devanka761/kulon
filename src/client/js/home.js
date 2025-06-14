import "../sass/home.scss";
import nav from "./helper/nav.js";

nav();
const icon_placeholder = document.querySelector(".icon-wait");
const canvas = document.querySelector(".icon");
const ctx = canvas.getContext("2d");
const grid = 96;
const frames = [
  [0,0],[1,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  [0,0],[1,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
  [2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
  [1,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  [0,0],[1,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],
  [7,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],
  [0,0],[1,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  [0,0],[1,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
]
let currframe = 0;

function spriteImage() {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = "/images/Kulon_Icons.png";
  });
}
function draw(img) {
  const [x, y] = frames[currframe];
  currframe++;
  if(currframe >= frames.length) currframe = 0;
  ctx.clearRect(0,0, grid, grid);
  ctx.drawImage(img,
    x * grid, y * grid,
    96, 96,
    0, 0,
    96, 96
  );
}
async function renderImage() {
  const sprite = await spriteImage();
  await new Promise(resolve => setTimeout(resolve, 1000));
  icon_placeholder.style.display = "none";
  canvas.style.display = "block";
  draw(sprite);
  icon_placeholder.remove();
  setInterval(() => {
    draw(sprite);
  }, 100);
}
let installPWA = null;
let readyPWA = false;

const btnInstall = document.getElementById("btn-install");
btnInstall.onclick = async(e) => {
  e.preventDefault();
  if(window.matchMedia("(display-mode: fullscreen)").matches) {
    window.location.href = "/app";
  }
  if(readyPWA) {
    window.location.href = "/app";
    return;
  }
  if(installPWA) {
    const installChosen = await installPWA.prompt();
    if(installChosen.outcome === "accepted") {
      readyPWA = true;
      // btnInstall.classList.add("hide");
    }
  }
}
window.addEventListener("appinstalled", () => {
  btnInstall.classList.add("hide");
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPWA = e;

  if(window.matchMedia("(display-mode: fullscreen)").matches) {
    readyPWA = true;
  }

  btnInstall.classList.remove("hide");
});

window.onload = () => renderImage();