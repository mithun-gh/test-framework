import { Metadata, MetadataType } from "./metadata";
import { Sentinel } from "./sentinel";
import { isOpenTagEnd, squash } from "./utils";
import { attribute, event } from "./regex";
import { html } from "./html";

export class Template {
  strings: TemplateStringsArray;
  values: unknown[] = [];

  readonly metadata: readonly Metadata[];
  readonly sentinel: Sentinel;

  constructor(strings: TemplateStringsArray, values: unknown[]) {
    this.strings = strings;
    this.sentinel = new Sentinel();
    this.metadata = this.getMetadata(values);
    this.values = this.transformValues(values);
  }

  update(strings: TemplateStringsArray, values: unknown[]) {
    this.values = this.transformValues(values);
    this.strings = squash(this.strings.raw, strings);
  }

  createElement(): DocumentFragment {
    const template = document.createElement("template");
    template.innerHTML = this.getHtml();
    return template.content.cloneNode(true) as DocumentFragment;
  }

  transformValues(values: unknown[]): unknown[] {
    const newValues = [...this.values, ...values];

    this.metadata
      .filter((meta) => meta.type === MetadataType.Template && meta.value.length > 0)
      .forEach((meta) => {
        let subStrings: TemplateStringsArray = { raw: [], ...[] };
        let subValues = [];

        const templateIndex = meta.value[0];
        const templateArray = newValues[templateIndex] as unknown[];

        let subString = "";
        templateArray.forEach((value) => {
          if (value instanceof Template) {
            if (subString.length > 0) {
              subStrings = squash([...subStrings.raw, subString], value.strings.raw);
              subString = "";
            } else {
              subStrings = squash(subStrings.raw, value.strings.raw);
            }
            subValues = value.values;
          } else if (value != null) {
            subString += String(value);
          }
        });

        if (subString.length > 0) {
          subStrings = squash(subStrings.raw, [subString]);
        }

        const template = html(subStrings, ...subValues);
        newValues.splice(templateIndex, 1, template);
      });

    return newValues;
  }

  getMetadata(values: unknown[]): Metadata[] {
    return values.map((value, i) => {
      let key: string;
      let str: string = this.strings.raw[i];
      const nextStr: string = this.strings.raw[i + 1];
      const isLastAttr = isOpenTagEnd(nextStr) ?? true;
      if ((key = str.match(event)?.[1])) {
        return new Metadata(MetadataType.Event, [key, isLastAttr]);
      } else if ((key = str.match(attribute)?.[1])) {
        return new Metadata(MetadataType.Attribute, [key, isLastAttr]);
      } else if (value instanceof Template) {
        return new Metadata(MetadataType.Template);
      } else if (Array.isArray(value)) {
        return new Metadata(MetadataType.Template, [i]);
      } else {
        return new Metadata(MetadataType.Text);
      }
    });
  }

  getHtml(): string {
    let slotIndex: number = -1;
    const sentinel = this.sentinel;
    return this.strings.raw.join(sentinel.marker).replace(sentinel.regex, () => {
      const meta = this.metadata[++slotIndex];
      if (meta.type === MetadataType.Attribute || meta.type === MetadataType.Event) {
        return meta.value[1] ? `${sentinel.attribute}="${slotIndex}"` : "";
      } else {
        return `<template ${sentinel.attribute}="${slotIndex}"></template>`;
      }
    });
  }
}
