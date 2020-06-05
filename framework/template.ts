import { Metadata, MetadataType } from "./metadata";
import { Sentinel } from "./sentinel";
import { isOpenTagEnd } from "./utils";
import { attribute, event } from "./regex";

export class Template {
  readonly strings: TemplateStringsArray;
  values: unknown[];

  #sentinel: Sentinel;
  #metadata: Metadata[] = [];

  constructor(strings: TemplateStringsArray, values: unknown[]) {
    this.strings = strings;
    this.values = values;
  }

  get sentinel() {
    return this.#sentinel;
  }

  get metadata() {
    return [...this.#metadata];
  }

  createElement(): DocumentFragment {
    const template = document.createElement("template");
    template.innerHTML = this.getHtml();
    return template.content.cloneNode(true) as DocumentFragment;
  }

  private getMetadata(index: number): Metadata {
    let meta = this.#metadata[index];

    if (meta !== undefined) {
      return meta;
    }

    let key: string;
    const value = this.values[index];
    const string = this.strings.raw[index];
    const nextStr: string = this.strings.raw[index + 1];
    const isLastAttr = isOpenTagEnd(nextStr) ?? true;

    if ((key = string.match(event)?.[1])) {
      meta = new Metadata(MetadataType.Event, [key, isLastAttr]);
    } else if ((key = string.match(attribute)?.[1])) {
      meta = new Metadata(MetadataType.Attribute, [key, isLastAttr]);
    } else if (value instanceof Template) {
      meta = new Metadata(MetadataType.Template);
    } else if (Array.isArray(value)) {
      meta = new Metadata(MetadataType.Iterable);
    } else {
      meta = new Metadata(MetadataType.Text);
    }

    this.#metadata.push(meta);
    return meta;
  }

  private getHtml(): string {
    let slotIndex: number = -1;
    this.#sentinel = new Sentinel();

    return this.strings.join(this.#sentinel.marker).replace(this.#sentinel.regex, () => {
      const meta = this.getMetadata(++slotIndex);
      if (meta.type === MetadataType.Attribute || meta.type === MetadataType.Event) {
        return meta.value[1] ? `${this.#sentinel.attribute}="${slotIndex}"` : "";
      }
      return `<template ${this.#sentinel.attribute}="${slotIndex}"></template>`;
    });
  }
}
