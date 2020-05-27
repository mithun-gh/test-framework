import { html, render } from "../new-framework/template";

const state = {
  name: "Mithun",
  count: 2,
  items: [0, 1, 2],
};

function onclick(e) {
  state.count++;
  state.items.push(state.count);
}

function onkeypress(e) {
  if (e.code === "Enter") {
    state.name = e.target.value;
    e.target.value = "";
  }
}

function App() {
  return html`
    <h2>Count: ${state.count}</h2>
    <h4>Hello, ${state.name}!</h4>
    <input type="text" onkeypress=${onkeypress} onkeyup=${() => null} />
    <input type="button" value="Click Me!" onclick=${onclick} />
    <p>Check the following items:</p>
    <ul>
      ${state.items.map((item) => html`<li>${item}</li>`)}
    </ul>
  `;
}

// function App2() {
//   return html`
//     <h2>Count: ${state.count}</h2>
//     <h4>Hello, ${state.name}!</h4>
//     <input type="text" width=${250} height=${50} />
//     <input type="button" value="Click Me!" onclick=${onclick} />
//     <p>Check the following items:</p>
//     <ul>
//       ${state.items.map((item) => html`<li>${item}</li>`)}
//     </ul>
//   `;
// }

render(App(), document.querySelector("#root-new"));
// render(App2(), document.querySelector("#root-new"));
