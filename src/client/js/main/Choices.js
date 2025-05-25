import { klang } from "../helper/lang.js";
import Kaudio from "../manager/Kaudio.js";

export default class Choices {
  constructor({options, text, who, onComplete}) {
    this.onComplete = onComplete;
    this.options = options;
    this.who = who;
    this.text = text;
  }
  createElement() {
    this.element = document.createElement('div');
    this.element.classList.add('TextMessage', 'v2');
    this.element.innerHTML = `
    <div class="choices">
    </div>
    ${this.who?'<div class="who"><p>'+this.who+'</p></div>':''}
    <p class="TextMessage_p">${this.text[klang.currLang]}</p>`;
    this.eChoices = this.element.querySelector('.choices');
  }
  choiceListener() {
    this.options.forEach(opt => {
      const eChoice = document.createElement('div');
      eChoice.classList.add('choice');
      eChoice.role = 'button';
      eChoice.innerHTML = opt.text[klang.currLang];
      this.eChoices.appendChild(eChoice);
      eChoice.onclick = () => {
        Kaudio.play("nfx1", "phone_selected");
        if(opt.cancel) this.destroy(null);
        else this.destroy("LANJUT");
      }
    });
  }
  destroy(condition) {
    this.element.remove();
    this.onComplete(condition);
  }
  run() {
    this.createElement();
    document.querySelector('.app').appendChild(this.element);
    this.choiceListener();
  }
}