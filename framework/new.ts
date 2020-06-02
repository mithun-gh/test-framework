import { Sentinel } from "./sentinel";
import { Metadata, MetadataType } from "./metadata";
import { isOpenTagEnd } from "./utils";
import { attribute, event } from "./regex";
import { Slot, SlotType } from "./slot";

export const fragments: WeakMap<TemplateStringsArray, Fragment> = new WeakMap();

export class Fragment {
  readonly template: Template;

  private slots: Slot[] = [];

  constructor(template: Template) {
    this.template = template;
  }

  update(values: readonly unknown[]) {
    this.template.values = values;
  }

  attachTo(container: HTMLElement) {
    if (container == null) {
      throw new Error("Invalid container.");
    }
    while (container.firstChild) {
      container.firstChild.remove();
    }
    this.appendInto(container);
  }

  appendInto(container: HTMLElement) {
    const node = this.template.createElement();
    this.applyValues(node);
    container.appendChild(node);
  }

  prependTo(element: HTMLElement) {
    const node = this.template.createElement();
    this.applyValues(node);
    element.parentNode.insertBefore(node, element);
  }

  replace(element: HTMLElement) {
    const node = this.template.createElement();
    this.applyValues(node);
    element.replaceWith(node);
  }

  private applyValues(docFragment: DocumentFragment) {
    let valueIndex = 0;
    const selector = this.template.sentinel.selector;
    const property = this.template.sentinel.property;
    docFragment.querySelectorAll(selector).forEach((element: HTMLElement) => {
      const limit = Number(element.dataset[property]);
      while (valueIndex <= limit) {
        const value = this.template.values[valueIndex];
        const meta = this.template.metadata[valueIndex];
        this.slots.push(this.createSlot(value, meta, element));
        valueIndex++;
      }
    });
  }

  private createSlot(value: unknown, metadata: Metadata, element: HTMLElement): Slot {
    if (metadata.type === MetadataType.Text) {
      const text: Text = document.createTextNode("");
      element.replaceWith(text);
      text.data = value as string;
      return new Slot(text, SlotType.Text, value);
    }

    if (metadata.type === MetadataType.Attribute) {
      const [key] = metadata.value;
      element[this.preprocessKey(key)] = value;
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Attribute, value);
    }

    if (metadata.type === MetadataType.Event) {
      const [key] = metadata.value;
      element.addEventListener(key, value as EventListenerOrEventListenerObject);
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Event, value);
    }

    if (metadata.type === MetadataType.Template) {
      const fragment = new Fragment(value as Template);
      fragment.replace(element);
      return new Slot(null, SlotType.Fragment, fragment);
    }
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
  }
}

class Template {
  values: readonly unknown[];
  metadata: readonly Metadata[];
  readonly strings: TemplateStringsArray;

  sentinel: Sentinel;

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
  let fragment = fragments.get(template.strings);
  if (fragment !== undefined) {
    fragment.update(template.values);
  } else {
    fragment = new Fragment(template);
    fragments.set(template.strings, fragment);
    fragment.attachTo(container);
  }
}
