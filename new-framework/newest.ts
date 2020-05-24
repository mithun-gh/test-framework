import { slotMarker, slotId } from "./constants";
import { isOpenTagEnd } from "./utils";
import { attribute, markedStrings, event } from "./regex-patterns";

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
}

export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): Template {
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
  annotatedString = strings.join(slotMarker).replace(markedStrings, () => {
    const val = annotatedValues[++slotIndex];
    if (val.type === ValueType.Text || val.type === ValueType.Template) {
      return `<template data-slot-${slotId}="${slotIndex}"></template>`;
    } else {
      return val.data[2] ? `data-slot-${slotId}="${slotIndex}"` : "";
    }
  });

  return new Template(annotatedString, annotatedValues);
}

let template: Template;
let container: Element;
export function render(t: Template, c: Element) {
  template = template ?? t;
  container = container ?? c;
  console.log(template);
}

interface ComponentResult<T> {
  state: T;
  render: (template: Template, container: Element) => void;
}

export function Component<T extends Object>(name: string, initialState: T): ComponentResult<T> {
  let state = new Proxy(initialState, {
    get(target, key, receiver) {
      console.log("GET", key);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value) {
      console.log("SET", key);
      render(template, container);
      return Reflect.set(target, key, value);
    },
  });

  return { state, render };
}
