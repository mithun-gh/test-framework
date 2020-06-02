import { Sentinel } from "./sentinel";
import { Metadata, MetadataType } from "./metadata";
import { isOpenTagEnd } from "./utils";
import { attribute, event } from "./regex";

class Template {
  strings: TemplateStringsArray;
  values: unknown[];

  private sentinel: Sentinel;

  constructor(strings: TemplateStringsArray, values: unknown[]) {
    this.strings = strings;
    this.values = values;
    this.sentinel = new Sentinel();
  }

  private getMetadata(): Metadata[] {
    return this.values.map((value, i) => {
      let key: string;
      let str: string = this.strings.raw[i];
      const nextStr: string = this.strings.raw[i + 1];
      const isLastAttr = isOpenTagEnd(nextStr) ?? true;

      if ((key = str.match(event)?.[1])) {
        return new Metadata(MetadataType.Event, [key, isLastAttr]);
      }

      if ((key = str.match(attribute)?.[1])) {
        return new Metadata(MetadataType.Attribute, [key, isLastAttr]);
      }

      if (value instanceof Template) {
        return new Metadata(MetadataType.Template);
      }

      if (Array.isArray(value)) {
        return new Metadata(MetadataType.Template, [i]);
      }

      return new Metadata(MetadataType.Text);
    });
  }

  getHtml(): string {
    let slotIndex: number = -1;
    const sentinel = this.sentinel;
    const metadata = this.getMetadata();

    return this.strings.raw.join(sentinel.marker).replace(sentinel.regex, () => {
      const meta = metadata[++slotIndex];
      if (meta.type === MetadataType.Attribute || meta.type === MetadataType.Event) {
        return meta.value[1] ? `${sentinel.attribute}="${slotIndex}"` : "";
      }
      return `<template ${sentinel.attribute}="${slotIndex}"></template>`;
    });
  }
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Template {
  return new Template(strings, values);
}

export function render(template: Template, container: HTMLElement) {
  if (container == null) {
    throw new Error("Invalid container.");
  }
  console.log(template.getHtml());
}
