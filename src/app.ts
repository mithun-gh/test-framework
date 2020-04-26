import { html, render } from "../framework/template";

const Greeter = (name: string) => html`Hello, <b>${name}</b>!`;

function NameItem(name: string) {
  return html`<li>${Greeter(name)}</li>`;
}

function NameList(names: string[]) {
  const listItems = names.map((name) => NameItem(name));
  const testFn = (e) => console.log(">>>", e);
  return html`
    <b>Greetings:</b>
    <ul>
      ${listItems}
    </ul>
    <button type="button" onclick=${testFn}>Click Me!</button>
    <button type="button" onclick=${(e) => console.log(e)}>Click Me!!</button>
  `;
}

render(NameList(["Adam", "Ben", "Charles"]), "#root");
