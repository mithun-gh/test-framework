import { Sentinel } from "./sentinel";
import { Metadata, MetadataType } from "./metadata";
import { isOpenTagEnd } from "./utils";
import { attribute, event } from "./regex";

export const containers: WeakMap<Slot, HTMLElement> = new WeakMap();
export const fragments: WeakMap<TemplateStringsArray, Fragment> = new WeakMap();

export class Fragment {
  readonly template: Template;

  private slots: Slot[] = [];

  constructor(template: Template) {
    this.template = template;
  }

  updateSlot(slot: Slot, newValue: unknown, oldValue: unknown, index: number) {
    if (slot === undefined) {
      if (newValue instanceof Template) {
        const container = containers.get(this.slots[index]);
        const fragment = new Fragment(newValue);
        fragment.appendInto(container);
        this.slots.push(new Slot(fragment, SlotType.Fragment));
      }
      this.template.values.push(newValue);
      return;
    }

    if (slot.type === SlotType.Text && newValue !== oldValue) {
      const node = slot.value as Text;
      node.data = String(newValue);
    }

    if (slot.type === SlotType.Fragment) {
      const template = newValue as Template;
      const fragment = slot.value as Fragment;
      fragment.update(template.values);
    }

    if (slot.type === SlotType.Iterable) {
      const slots = slot.value as Slot[];
      const newValues = newValue as unknown[];
      const oldValues = oldValue as unknown[];
      newValues.forEach((newValue, i) => {
        const slot = slots[i];
        const oldValue = oldValues[i];
        this.updateSlot(slot, newValue, oldValue, index);
      });
    }
  }

  update(newValues: unknown[]) {
    newValues.forEach((newValue, i) => {
      const slot = this.slots[i];
      const oldValue = this.template.values[i];
      this.updateSlot(slot, newValue, oldValue, i);
    });
    this.template.values = newValues;
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
      return new Slot(text, SlotType.Text);
    }

    if (metadata.type === MetadataType.Attribute) {
      const [key] = metadata.value;
      element[this.preprocessKey(key)] = value;
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Attribute);
    }

    if (metadata.type === MetadataType.Event) {
      const [key] = metadata.value;
      element.addEventListener(key, value as EventListenerOrEventListenerObject);
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Event);
    }

    if (metadata.type === MetadataType.Template) {
      const fragment = new Fragment(value as Template);
      fragment.replace(element);
      return new Slot(fragment, SlotType.Fragment);
    }

    if (metadata.type === MetadataType.Iterable) {
      const items = value as unknown[];
      const slots: Slot[] = [];

      items.forEach((item) => {
        if (item instanceof Template) {
          const fragment = new Fragment(item);
          fragment.appendInto(element.parentNode as HTMLElement);
          slots.push(new Slot(fragment, SlotType.Fragment));
        }
      });

      const slot = new Slot(slots, SlotType.Iterable);
      containers.set(slot, element.parentNode as HTMLElement);
      element.remove();
      return slot;
    }
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
  }
}

export type SlotValue = Node | Fragment | Slot[];

export enum SlotType {
  Attribute = "attribute",
  Event = "event",
  Fragment = "fragment",
  Iterable = "iterable",
  Text = "text",
}

export class Slot {
  readonly value: SlotValue;
  readonly type: SlotType;

  constructor(value: SlotValue, type: SlotType) {
    this.value = value;
    this.type = type;
  }
}

class Template {
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
