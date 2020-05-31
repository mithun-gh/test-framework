import { TemplateCache } from "./cache";
import { Template } from "./template";

export function html(strings: TemplateStringsArray, ...values: unknown[]): Template {
  if (TemplateCache.has(strings)) {
    return TemplateCache.get(strings).updateValues(values);
  }

  const template = new Template(strings, values);
  TemplateCache.set(strings, template);

  return template;
}
