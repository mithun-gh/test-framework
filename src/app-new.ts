import { Component, html } from "../new-framework/newest";

const { state, render } = Component("my-greeting", {
  name: "Mithun",
  count: 0,
  items: [],
});

function onclick(e) {
  state.count++;
  state.items.push(state.count.toString());
}

function onkeypress(e) {
  if (e.code === "Enter") {
    state.name = e.target.value;
    e.target.value = "";
  }
}

// setInterval(() => {
//   state.count += 1;
// }, 5000);

render(
  html`
    <h2>Count: ${state.count}</h2>
    <h4>Hello, ${state.name}!</h4>
    <input type="text" onkeypress=${onkeypress} />
    <input type="button" value="Click Me!" onclick=${onclick} />
    <p>Check the following items:</p>
    <ul>
      ${state.items.map((item) => html`<li>${item}</li>`)}
    </ul>
  `,
  document.querySelector("#root-new")
);
