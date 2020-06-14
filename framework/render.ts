import { Template } from "./template";
import { Fragment } from "./fragment";
import { fragments } from "./cache";

export function render(template: Template, container: HTMLElement) {
  let fragment = fragments.get(template.strings);
  if (fragment !== undefined) {
    fragment.update(template.values);
  } else {
    fragment = new Fragment(template);
    fragment.attachTo(container);
    fragments.set(template.strings, fragment);
  }
}
