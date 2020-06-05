import { Template } from "./template";

export function html(strings: TemplateStringsArray, ...values: unknown[]): Template {
  return new Template(strings, values);
}
