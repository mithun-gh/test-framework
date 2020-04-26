import { html, render } from "../framework/template";
import { Component, Property } from "../framework/component";

/*
@Component("my-greeter")
class GreeterComponent {
  @Property name: string;

  render() {
    return html`<h2>Hello, ${this.name}!</h2>`;
  }
}
*/

@Component("test-greeter")
class TestGreeter {
  @Property name: string;
  @Property age: number;

  render() {
    return html`<h1>Hello, ${this.name}!</h1>`;
  }
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

  return html`
    <test-greeter name="Mithun"></test-greeter>
    <h3>TODO</h3>
    <form onsubmit=${handleSubmit}>
      <label for="new-todo">What needs to be done?</label>
      <input id="new-todo" onchange=${handleChange} value=${text} />
      <button>Add #${items.length + 1}</button>
    </form>
    ${TodoList(items)}
  `;
}

function TodoList(items: string[]) {
  return html`
    <ul>
      ${items.map((item) => html`<li>${item}</li>`)}
    </ul>
  `;
}

render(TodoApp(), "#root");
