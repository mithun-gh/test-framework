import { html, render } from "../framework/template";
import { Component, Property } from "../framework/component";

@Component("my-greeter")
class MyGreeter {
  @Property name: string = "";
  @Property age: number = 31;

  render() {
    return html`<h1>Hello, ${this.name}!</h1>`;
  }
}

/* render(html` <my-greeter name="Mithun"></my-greeter> `, "#root"); */

/*
@Component("todo-list")
class TodoList {
  @Property items: string[] = [];

  render() {
    return html`
      <ul>
        ${this.items.map((item) => html`<li>${item}</li>`)}
      </ul>
    `;
  }
}
*/

function Greeter(name: string) {
  return html`<h1>Hello, ${name}!</h1>`;
}

function TodoList(items: string[]) {
  return html`
    <ul>
      ${items.map((item) => html`<li>${item}</li>`)}
    </ul>
  `;
}

function TodoApp() {
  let text: string = "";
  let items: string[] = [];

  const handleChange = (e: Event) => {
    text = (e.target as any).value;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (text.length === 0) {
      return;
    }

    // TODO: Add Observable support
    items.push(text);
    text = "";
  };

  const nums = ["One", "Two", "Three", "Four"];

  const dummy = () => html`<p>DUMMY</p>`;

  /* return html`
    <h2>HELLO</h2>
    ${dummy()}
    <ul>
      ${nums.map((n) => html`<li>${n}</li>`)}
    </ul>
  `; */

  return html`
    <my-greeter name="huh"></my-greeter>
    ${Greeter("Mithun")}
    <h3>TODO</h3>
    <form onsubmit=${handleSubmit}>
      <label for="new-todo">What needs to be done?</label>
      <input id="new-todo" onchange=${handleChange} value=${text} />
      <button>Add #${items.length + 1}</button>
    </form>
    ${TodoList(items)}
  `;
}

render(TodoApp(), "#root");
