import { html, render } from "../framework";

const state = {
  name: "Mithun",
  count: 3,
  items: [1, 2, 3],
  disabled: false,
};

function onclick(e) {
  state.count += 1;
  state.items.push(state.count);
  state.disabled = !state.disabled;
  // state.items = state.items.map((item) => item * state.count);
  render(App(), document.querySelector("#root-new"));
}

function onkeyup(e) {
  state.name = e.target.value;
  render(App(), document.querySelector("#root-new"));
}

const test1 = [html`<h6>ONE</h6>`, html`<h6>TWO</h6>`, html`<h6>THREE</h6>`];
const test2 = ["One", 2, "Three", false, "Five", {}, null, undefined, "Nine", Symbol()];

function Greet(name) {
  return html`<h1>Hello, ${name}!</h1>`;
}

function App() {
  return html`
    ${Greet(state.name)}
    <!-- test -->
    <p>${test2}</p>
    <input type="text" onkeyup=${onkeyup} disabled=${state.disabled} />
    <h2>Count: ${state.count}</h2>
    <button onclick=${onclick}>Increment</button>
    <ul>
      ${state.items.map((item) => html`<li>${item}</li>`)}
    </ul>
    <h5>~~~~~~THE END~~~~~~</h5>
  `;
}

render(App(), document.querySelector("#root-new"));

/*
<li>
  <b>${item}</b>
    <div>
      ${state.items.map((item) => html`<span>${item}</span>`)}
    </div>
</li>
*/
