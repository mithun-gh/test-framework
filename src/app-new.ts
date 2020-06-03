import { html, render } from "../framework/new";

const state = {
  name: "Mithun",
  count: 3,
  items: [0, 1, 2],
};

function onclick(e) {
  state.items.push(state.count);
  state.count += 1;
  render(App(), document.querySelector("#root-new"));
}

function onkeypress(e) {
  if (e.code === "Enter") {
    state.name = e.target.value;
    e.target.value = "";
    render(App(), document.querySelector("#root-new"));
  }
}

// const test1 = [html`<h6>ONE</h6>`, html`<h6>TWO</h6>`, html`<h6>THREE</h6>`];
// const test2 = ["Sample text", 123007, html`<h1>Sample HTML</h1>`, true];

function GetCount(count) {
  return html`<h2>Count: ${state.count}</h2>`;
}

function App() {
  return html`
    <h4>Hello, ${state.name}!</h4>
    <input type="text" onkeypress=${onkeypress} />
    <h2>Count: ${state.count}</h2>
    <button onclick=${onclick}>Increment</button>
  `;
}

render(App(), document.querySelector("#root-new"));
