import { html, render } from "../old/old-framework/template";
import { Component, Property } from "../old/old-framework/component";

@Component("my-greeter")
class MyGreeter {
  @Property name: string = "";

  render() {
    return html`<h1>Hello, ${this.name}!</h1>`;
  }
}

let count = 2;
let name = "Mithun";
let items = ["<b>0</b>", "1", "2"];

const data = {
  onclick(e) {
    count++;
    items.push(count.toString());
    render(template(), document.querySelector("#root"));
  },
  onkeypress(e) {
    if (e.code === "Enter") {
      name = e.target.value;
      e.target.value = "";
      render(template(), document.querySelector("#root"));
    }
  },
};

const template = () => html`
  <h4>Hello, ${name}!</h4>
  <input type="text" onkeypress=${data.onkeypress} />
  <input type="button" value="Click Me!" onclick=${data.onclick} />
  <p>Check the following items:</p>
  <ul>
    ${items.map((item) => html`<li>${item}</li>`)}
  </ul>
`;

render(template(), document.querySelector("#root"));
