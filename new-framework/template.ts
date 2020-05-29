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
  readonly value: string;

  constructor(type: MetadataType, value?: string) {
    this.type = type;
    this.value = value;
  }
}

export class Template {
  readonly string: string;
  readonly values: readonly unknown[];
  readonly metadata: readonly Metadata[];

  constructor(string: string, values: readonly unknown[], metadata: readonly Metadata[]) {
    this.string = string;
    this.values = values;
    this.metadata = metadata;
  }

  duplicate(values: readonly unknown[]): Template {
    return new Template(this.string, values, this.metadata);
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
      return new Metadata(MetadataType.Event, key);
    } else if ((key = str.match(attribute)?.[1])) {
      return new Metadata(MetadataType.Attribute, key);
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

  const template = new Template(string, values, metadata);
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
}

export class Fragment {
  readonly template: Template;
  readonly slots: readonly Slot[];

  private container: Element;

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

    this.template.values.forEach((value) => {});
  }
}

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }

  new Fragment(template).attach(container);

  console.log(template.values, template.metadata);
}
