import { isOpenTagEnd } from "./utils";
import { attribute, event } from "./regex-patterns";

const TemplateCache: WeakMap<TemplateStringsArray, Template> = new WeakMap();

export enum ValueType {
  Attribute = "attribute",
  Event = "event",
  Template = "template",
  Text = "text",
}

export type ValueData = [string, unknown, boolean] | Template | Template[] | string;

export class Value {
  type: ValueType;
  data: ValueData;

  constructor(type: ValueType, data: ValueData) {
    this.type = type;
    this.data = data;
  }
}

export class Template {
  readonly string: string;
  readonly values: readonly Value[];

  constructor(string: string, values: readonly Value[]) {
    this.string = string;
    this.values = values;
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
    return TemplateCache.get(strings);
  }

  let annotatedString: string;
  let annotatedValues: Value[] = [];
  const rawStrings: readonly string[] = strings.raw;

  values.forEach((value, i) => {
    let key: string;
    let val: any;
    let str: string = strings[i];
    const isLastAttr = isOpenTagEnd(rawStrings[i + 1]) ?? true;

    if ((key = str.match(event)?.[1])) {
      val = new Value(ValueType.Event, [key, value, isLastAttr]);
    } else if ((key = str.match(attribute)?.[1])) {
      val = new Value(ValueType.Attribute, [key, value, isLastAttr]);
    } else if (value instanceof Template || value?.[0] instanceof Template) {
      val = new Value(ValueType.Template, value as Template[]);
    } else {
      val = new Value(ValueType.Text, String(value));
    }

    annotatedValues.push(val);
  });

  let slotIndex: number = -1;
  const sentinel = new Sentinel();
  annotatedString = strings.join(sentinel.simple).replace(sentinel.regex, () => {
    const val = annotatedValues[++slotIndex];
    if (val.type === ValueType.Text || val.type === ValueType.Template) {
      return `<template ${sentinel.attribute}="${slotIndex}"></template>`;
    } else {
      return val.data[2] ? `${sentinel.attribute}="${slotIndex}"` : "";
    }
  });

  const template = new Template(annotatedString, annotatedValues);
  TemplateCache.set(strings, template);

  return template;
}

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }

  console.log(template.string, template.values);
}
