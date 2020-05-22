// FragmentCache.get(template.strings);
// FragmentCache.set(template.strings, new Fragment(container));
export const FragmentCache: WeakMap<readonly string[], Fragment> = new WeakMap();

const slotId: number = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
const slotMarker: string = `{${slotId}}`;

const event: RegExp = /\s+on([a-z]+)\s*=$/i;
const attribute: RegExp = /\s+([a-z]+)\s*=$/i;
const openTagEnd: RegExp = /\/?>/;
const stringLiteral: RegExp = /""|".*?[^\\]"|''|'.*?[^\\]'/g;
const markedStrings = new RegExp(`[a-z]+=\\${slotMarker}|\\${slotMarker}`, "gi");

// str should be String.raw
function isOpenTagEnd(str: string): boolean {
  return str ? openTagEnd.test(str.replace(stringLiteral, "")) : null;
}

export enum ValueType {
  Attribute = "attribute",
  Event = "event",
  Template = "template",
  Text = "text",
}

export type ValueData = [string, unknown, boolean] | Template | Template[] | string;

export class Value {
  readonly type: ValueType;
  readonly data: ValueData;

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

export enum SlotType {
  Attribute = "attribute",
  Event = "event",
  Text = "text",
}

export class Slot {
  #node: Node;
  #type: SlotType;
  #value: unknown;

  constructor(value: unknown) {
    this.#value = value;
  }

  get type(): SlotType {
    return this.#type;
  }

  set type(value: SlotType) {
    this.#type = value;
  }

  get value(): unknown {
    return this.#value;
  }

  set value(value: unknown) {
    this.#value = value;
    if (this.#type === SlotType.Text) {
      const node = this.#node as Text;
      node.data = value as string;
    }
  }
}

export class Fragment {
  #parent: Node;
  #slots: Slot[];
  #node: HTMLTemplateElement;

  constructor(parent: Node) {
    this.#parent = parent;
  }

  get slots(): Slot[] {
    return [...this.#slots];
  }

  addSlot(value: unknown) {
    this.#slots.push(new Slot(value));
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
    slotIndex += 1;
    const val = annotatedValues[slotIndex];

    if (val.type === ValueType.Text || val.type === ValueType.Template) {
      return `<template data-slot-${slotId}="${slotIndex}"></template>`;
    }

    return val.data[2] ? `data-slot-${slotId}="${slotIndex}"` : "";
  });

  console.log(annotatedString, annotatedValues);

  return new Template(annotatedString, annotatedValues);
}

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }

  let templateElement = document.createElement("template");
  templateElement.innerHTML = template.string;

  let fragment = templateElement.content.cloneNode(true) as DocumentFragment;
  let slots = Array.from(fragment.querySelectorAll(`[data-x${slotId}]`));

  slots.forEach((slot: HTMLElement, i) => {
    const min = Number(slot.dataset[`x${slotId}`]);
    const max = Number((slots[i + 1] as HTMLElement)?.dataset?.[`x${slotId}`] ?? min + 1);
    const count = max - min;
    console.log(slot, count);
  });

  console.log(template.values);
}
