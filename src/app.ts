import { html, render } from "../framework/template";
import { Component, Property } from "../framework/component";

@Component("my-greeter")
class MyGreeter {
  @Property name: string = "";

  render() {
    return html`<h1>Hello, ${this.name}!</h1>`;
  }
}

const data = {
  name: "Mithun",
  onclick: (e) => {
    console.log(e);
  },
  items: ["<b>One</b>", "Two", "Three"],
};

const template = html`
  <h4>Hello, ${data.name}!</h4>
  <input type="text" />
  <input type="button" value="Click Me!" onclick=${data.onclick} />
  <p>
    Check the following items:
    <ul>
      ${data.items.map((item) => html`<li>${item}</li>`)}
    </ul>
  </p>
`;

render(template, "#root");
