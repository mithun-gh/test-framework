import { Template } from "./template";
import { Fragment } from "./fragment";

export function render(template: Template, container: HTMLElement) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }

  new Fragment(template).attachTo(container);

  console.log(template.values);
}
