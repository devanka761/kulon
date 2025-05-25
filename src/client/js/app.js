import "../sass/app.scss";
import Intros from "./pages/Intros.js";

/**
 * import Overworld from "./main/Overworld.js";
 * const overworld = new Overworld({
 *   element: document.querySelector(".app")
 * });
 * overworld.init();
 */

const intros = new Intros();
window.onload = () => intros.init();