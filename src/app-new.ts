import { Component } from "../new-framework/newest";

const { html, state } = Component("my-greeting", {
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

const Greet = html`
  <h4>Hello, ${state.name}!</h4>
  <input type="text" onkeypress=${onkeypress} />
  <input type="button" value="Click Me!" onclick=${onclick} />
  <p>Check the following items:</p>
  <ul>
    ${state.items.map((item) => html`<li>${item}</li>`)}
  </ul>
`;
