export default class KeyPressListener {
  constructor(keyCode, callback) {
    let keySafe = true;
    this.keydownFunction = function(event) {
      if (event.key?.toLocaleLowerCase() === keyCode) {
         if (keySafe) {
            keySafe = false;
            callback();
         }  
      }
   };
   this.keyupFunction = function(event) {
      if (event.key?.toLocaleLowerCase() === keyCode) {
         keySafe = true;
      }
   };
   window.addEventListener("keydown", this.keydownFunction);
   window.addEventListener("keyup", this.keyupFunction);
  }

  unbind() { 
    window.removeEventListener("keydown", this.keydownFunction);
    window.removeEventListener("keyup", this.keyupFunction);
  }


}