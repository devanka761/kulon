import RevealingText from "./RevealingText.js";
import KeyPressListener from "./KeyPressListener.js";
import { klang } from "../helper/lang.js";

export default class TextMessage {
  constructor({ text, who, onComplete }) {
    this.text = text;
    this.who = who;
    this.onComplete = onComplete;
    this.element = null;
  }

  createElement() {
    //Create the element
    this.element = document.createElement("div");
    this.element.classList.add("TextMessage");

    this.element.innerHTML = (`
      ${this.who?'<div class="who"><p>'+this.who+'</p></div>':''}
        <p class="TextMessage_p"></p>
      <button class="TextMessage_button">Next</button>
    `);

    //Init the typewriter effect
    this.revealingText = new RevealingText({
      element: this.element.querySelector(".TextMessage_p"),
      text: this.text[klang.currLang]
    })

    this.element.querySelector("button").addEventListener("click", () => {
      //Close the text message
      this.done();
    });

    this.actionListener = new KeyPressListener("enter", () => {
      this.done();
    })

  }

  done() {

    if (this.revealingText.isDone) {
      this.element.remove();
      this.actionListener.unbind();
      this.onComplete();
    } else {
      this.revealingText.warpToDone();
    }
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);
    this.revealingText.init();
  }

}