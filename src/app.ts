import { html, render } from "../framework/html-template";

const Greeter = (name: string) => html`Hello, <b>${name}</b>!`;

function NameItem(name: string) {
  return html`<li>${Greeter(name)}</li>`;
}

function NameList(names: string[]) {
  const listItems = names.map((name) => NameItem(name));
  return html`
    <p>Greetings:</p>
    <ul>
      ${listItems}
    </ul>
  `;
}

render(NameList(["Adam", "Ben", "Charles"]), "#root");
