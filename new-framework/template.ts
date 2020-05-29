import { isOpenTagEnd } from "./utils";
import { attribute, event } from "./regex-patterns";

const TemplateCache: WeakMap<TemplateStringsArray, Template> = new WeakMap();

export enum MetadataType {
  Attribute = "attribute",
  Event = "event",
  Template = "template",
  Text = "text",
}

export class Metadata {
  readonly type: MetadataType;
  readonly value: readonly any[];

  constructor(type: MetadataType, value?: readonly any[]) {
    this.type = type;
    this.value = value;
  }
}

export class Template {
  readonly string: string;
  readonly values: readonly unknown[];
  readonly metadata: readonly Metadata[];
  readonly sentinel: Sentinel;

  constructor(
    string: string,
    values: readonly unknown[],
    metadata: readonly Metadata[],
    sentinel: Sentinel
  ) {
    this.string = string;
    this.values = values;
    this.metadata = metadata;
    this.sentinel = sentinel;
  }

  duplicate(values: readonly unknown[]): Template {
    return new Template(this.string, values, this.metadata, this.sentinel);
  }

  createElement(): DocumentFragment {
    const template = document.createElement("template");
    template.innerHTML = this.string;
    return template.content.cloneNode(true) as DocumentFragment;
  }
}

class Sentinel {
  readonly id: number;

  constructor() {
    this.id = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  get simple() {
    return `{${this.id}}`;
  }

  get attribute() {
    return `data-slot-${this.id}`;
  }

  get selector() {
    return `[${this.attribute}]`;
  }

  get regex() {
    return new RegExp(`[a-z]+=\\${this.simple}|\\${this.simple}`, "gi");
  }

  get property() {
    return `slot-${this.id}`;
  }
}

export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): Template {
  if (TemplateCache.has(strings)) {
    return TemplateCache.get(strings).duplicate(values);
  }

  const rawStrings: readonly string[] = strings.raw;
  let metadata: Metadata[] = values.map((value, i) => {
    let key: string;
    let str: string = strings[i];
    const isLastAttr = isOpenTagEnd(rawStrings[i + 1]) ?? true;

    if ((key = str.match(event)?.[1])) {
      return new Metadata(MetadataType.Event, [key, isLastAttr]);
    } else if ((key = str.match(attribute)?.[1])) {
      return new Metadata(MetadataType.Attribute, [key, isLastAttr]);
    } else if (value instanceof Template || value?.[0] instanceof Template) {
      return new Metadata(MetadataType.Template);
    } else {
      return new Metadata(MetadataType.Text);
    }
  });

  let slotIndex: number = -1;
  const sentinel = new Sentinel();
  let string = strings.join(sentinel.simple).replace(sentinel.regex, () => {
    const meta = metadata[++slotIndex];
    if (meta.type === MetadataType.Text || meta.type === MetadataType.Template) {
      return `<template ${sentinel.attribute}="${slotIndex}"></template>`;
    } else {
      return meta.value[1] ? `${sentinel.attribute}="${slotIndex}"` : "";
    }
  });

  const template = new Template(string, values, metadata, sentinel);
  TemplateCache.set(strings, template);

  return template;
}

export enum SlotType {
  Attribute = "attribute",
  Event = "event",
  Fragment = "fragment",
  Text = "text",
}

export class Slot {
  readonly node: Node;
  readonly type: SlotType;
  readonly value: unknown;

  constructor(node: Node, type: SlotType, value: unknown) {
    this.node = node;
    this.type = type;
    this.value = value;
  }
}

export class Fragment {
  readonly template: Template;

  private container: Element;
  private slots: Slot[] = [];

  constructor(template: Template) {
    this.template = template;
  }

  attach(container: Element) {
    if (this.container !== undefined) {
      return;
    }

    this.container = container;
    while (this.container.firstChild) {
      this.container.firstChild.remove();
    }

    const node = this.template.createElement();
    this.container.appendChild(node);
    this.applyValues();
  }

  private applyValues() {
    let valueIndex = 0;
    const selector = this.template.sentinel.selector;
    const property = this.template.sentinel.property;
    this.container.querySelectorAll(selector).forEach((element: HTMLElement) => {
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
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
  }
}

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }

  new Fragment(template).attach(container);

  console.log(template.string);
}
