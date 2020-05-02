import { html, render } from "../framework/template";
import { Component, Property } from "../framework/component";

@Component("my-greeter")
class MyGreeter {
  @Property name: string = "";

  render() {
    return html`<h1>Hello, ${this.name}!</h1>`;
  }
}

const p = {
  alt: "logo",
  width: 150,
  class: "main-logo",
  src: "https://resources.whatwg.org/logo.svg",
};

const test = html`<img
  alt=${p.alt}
  width=${p.width}
  class=${p.class}
  src=${p.src}
/>`;

render(test, "#root");
