import { trainInfo,trainToggle } from "../control/StartControl.js";

const sleep = m => new Promise(r => setTimeout(r, m))

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

    this.ele = this;
  }


  update() {
    this.buttonStart.src=`/imgs/${this.label}_${this.state}.jpg`; 
  }

  async infoCallback() {
    var result = [];
    result = await trainInfo(this.label);
    console.log(Date.now() + " info " + result)
    this.state = result.state;
    this.update();

    if ( result.state === "load" && result.until > 0 ) {
        await sleep(result.until);
        await this.infoCallback();
    }
  }

  async action() {
    this.state = "load";
    this.update();

    var result = [];
    console.log("perform action");
    result = await trainToggle(this.label);

    this.state = result.state;
    this.update();

    if ( result.until > 0 ) {
        await sleep(result.until);
        await this.infoCallback();
    }
  }

  connectedCallback() {
    console.log(Date.now() + " toggelt")
    console.log("start view connected callback");
    this.buttonStart.addEventListener('click', this.action);
    this.infoCallback();
  }

}

customElements.define('xmas-start', StartView);
