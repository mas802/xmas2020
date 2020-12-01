import { trainInfo } from "../control/StartControl.js";

class StartView extends HTMLElement {

  constructor() {
    super();
    console.log("start view loaded");

    this.count = 0;
    this.state = "load";
    this.label = this.getAttribute('data-label');
    const html = `<style>
img {
    max-width: 100%;
    display: block;
}

.imgw {
    width: 1000px;
}
</style><img src="/imgs/${this.label}_${this.state}.jpg" class="imgw" id="start" alt="${this.label}" />`;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `${html}`;

    this.buttonStart = this.shadowRoot.getElementById('start');

    this.action = this.action.bind(this);

  }

  connectedCallback() {
    console.log("start view connected callback");
    this.buttonStart.addEventListener('click', this.action);
  }

  action() {
    this.state = "load";
    this.update();

    console.log("perform action");

    trainInfo(this);
  }

  update() {
    this.buttonStart.src=`/imgs/${this.label}_${this.state}.jpg`; 
//    this.spanValue.innerText = this.count;
  }

  callback(result) {
    this.state = result.state;
    this.state = "update";
    this.update();
    if ( result.until > 0 ) {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
// FIXME        this.updateTimer = setTimeout( trainInfo(this), result.until);
    }
  }
}

customElements.define('xmas-start', StartView);
