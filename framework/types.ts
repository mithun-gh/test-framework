// FragmentCache.get(template.strings);
// FragmentCache.set(template.strings, new Fragment(container));
export const FragmentCache: WeakMap<readonly string[], Fragment> = new WeakMap();

const slotId: number = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
const slotMarker: string = `{${slotId}}`;
const slotAttribute: string = `data-slot-${slotId}`;
const slotSelector: string = `[${slotAttribute}]`;
const slotProperty: string = `slot-${slotId}`;

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
  #type: ValueType;
  #data: ValueData;

  constructor(type: ValueType, data: ValueData) {
    this.#type = type;
    this.#data = data;
  }

  get type(): ValueType {
    return this.#type;
  }

  get data(): ValueData {
    return this.#data;
  }
}

export class Template {
  #string: string;
  #values: readonly Value[];

  constructor(string: string, values: readonly Value[]) {
    this.#string = string;
    this.#values = values;
  }

  get string(): string {
    return this.#string;
  }

  get values(): readonly Value[] {
    return this.#values;
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

  constructor(node: Node, type: SlotType, value: unknown) {
    this.#node = node;
    this.#type = type;
    this.#value = value;

    if (type === SlotType.Text) {
      (this.#node as Text).data = value as string;
    }

    if (type === SlotType.Attribute) {
      const [key, val] = value as [string, any];
      this.#node[key] = val;
    }

    if (type === SlotType.Event) {
      const [key, val] = value as [string, EventListenerOrEventListenerObject];
      this.#node.addEventListener(key, val);
    }
  }

  get type(): SlotType {
    return this.#type;
  }

  get value(): unknown {
    return this.#value;
  }
}

export class Fragment {
  #container: Node;
  #slots: Slot[] = [];
  #node: DocumentFragment;

  constructor(template: Template, container: Node) {
    // add parent container
    this.#container = container;

    // create document fragment
    const templateElement = document.createElement("template");
    templateElement.innerHTML = template.string;
    this.#node = templateElement.content.cloneNode(true) as DocumentFragment;

    // assign slots
    let valueIndex = 0;
    this.#node.querySelectorAll(slotSelector).forEach((element: HTMLElement) => {
      const limit = Number(element.dataset[slotProperty]);
      while (valueIndex <= limit) {
        const value = template.values[valueIndex];
        if (value.type !== ValueType.Template) {
          this.#slots.push(this.createSlot(value, element));
        } else {
          const templates = (Array.isArray(value.data) ? value.data : [value.data]) as Template[];
          templates.forEach((template: Template) => {
            new Fragment(template, element.parentNode).append();
          });
          element.remove();
        }
        valueIndex++;
      }
      element.removeAttribute(slotAttribute);
    });
  }

  get container(): Node {
    return this.#container;
  }

  get slots(): Slot[] {
    return [...this.#slots];
  }

  get node(): DocumentFragment {
    return this.#node;
  }

  attach(): void {
    while (this.#container.firstChild) {
      this.#container.firstChild.remove();
    }
    this.#container.appendChild(this.#node);
  }

  append(): void {
    this.#container.appendChild(this.#node);
  }

  private createSlot(value: Value, element: HTMLElement): Slot {
    if (value.type === ValueType.Text) {
      const text = document.createTextNode("");
      element.replaceWith(text);
      return new Slot(text, SlotType.Text, value.data);
    }

    if (value.type === ValueType.Attribute) {
      const [key, val] = value.data as [string, unknown];
      return new Slot(element, SlotType.Attribute, [this.preprocessKey(key), val]);
    }

    if (value.type === ValueType.Event) {
      const [key, val] = value.data as [string, unknown];
      return new Slot(element, SlotType.Event, [key, val]);
    }
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
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

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }
  const fragment = new Fragment(template, container);
  fragment.attach();
  console.log(template.string, template.values);
}
