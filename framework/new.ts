import { Sentinel } from "./sentinel";
import { Metadata, MetadataType } from "./metadata";
import { isOpenTagEnd } from "./utils";
import { attribute, event } from "./regex";
import { Slot } from "./slot";

export const FragmentCache: WeakMap<TemplateStringsArray, Fragment> = new WeakMap();

export class Fragment {
  readonly template: Template;

  private slots: Slot[] = [];

  constructor(template: Template) {
    this.template = template;
  }

  attach(container: HTMLElement) {
    if (container == null) {
      throw new Error("Invalid container.");
    }
  }

  update(values: readonly unknown[]) {
    this.template.values = values;
  }
}

class Template {
  values: readonly unknown[];
  metadata: readonly Metadata[];

  readonly strings: TemplateStringsArray;

  private sentinel: Sentinel;

  constructor(strings: TemplateStringsArray, values: unknown[]) {
    this.strings = strings;
    this.values = values;
  }

  createElement(): DocumentFragment {
    const template = document.createElement("template");
    template.innerHTML = this.getHtml();
    return template.content.cloneNode(true) as DocumentFragment;
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
        return new Metadata(MetadataType.Iterator);
      }

      return new Metadata(MetadataType.Text);
    });
  }

  private getHtml(): string {
    let slotIndex: number = -1;
    this.sentinel = new Sentinel();
    this.metadata = this.getMetadata();

    return this.strings.join(this.sentinel.marker).replace(this.sentinel.regex, () => {
      const meta = this.metadata[++slotIndex];
      if (meta.type === MetadataType.Attribute || meta.type === MetadataType.Event) {
        return meta.value[1] ? `${this.sentinel.attribute}="${slotIndex}"` : "";
      }
      return `<template ${this.sentinel.attribute}="${slotIndex}"></template>`;
    });
  }
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Template {
  return new Template(strings, values);
}

export function render(template: Template, container: HTMLElement) {
  let fragment = FragmentCache.get(template.strings);

  if (fragment === undefined) {
    fragment = new Fragment(template);
    FragmentCache.set(template.strings, fragment);
    fragment.attach(container);
  }

  fragment.update(template.values);
}
