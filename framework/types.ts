// FragmentCache.get(template.strings);
// FragmentCache.set(template.strings, new Fragment(container));
export const FragmentCache: WeakMap<readonly string[], Fragment> = new WeakMap();

const markerId: number = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
const marker: string = `{${markerId}}`;

const event: RegExp = /\s+on([a-z]+)\s*=$/;
const attribute: RegExp = /\s+([a-z]+)\s*=$/;
const markedStrings = new RegExp(`[a-z]+=\\${marker}|\\${marker}`, "gi");

export enum ValueType {
  Attribute = "attribute",
  Event = "event",
  Template = "template",
  Text = "text",
}

export type ValueData = [string, unknown, number] | Template | Template[] | string;

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

export function html(strings: readonly string[], ...values: readonly unknown[]): Template {
  let annotatedString: string;
  let annotatedValues: Value[] = [];

  values.forEach((value, i) => {
    let key: string;
    let val: any;
    let str: string = strings[i];

    if ((key = str.match(event)?.[1])) {
      val = new Value(ValueType.Event, [key, value, i]);
    } else if ((key = str.match(attribute)?.[1])) {
      val = new Value(ValueType.Attribute, [key, value, i]);
    } else if (value instanceof Template || value?.[0] instanceof Template) {
      val = new Value(ValueType.Template, value as Template[]);
    } else {
      val = new Value(ValueType.Text, String(value));
    }

    annotatedValues.push(val);
  });

  let markerIndex: number = -1;
  annotatedString = strings.join(marker).replace(markedStrings, () => {
    markerIndex += 1;
    const val = annotatedValues[markerIndex];

    if (val.type === ValueType.Text || val.type === ValueType.Template) {
      return `<slot data-x${markerId}="${markerIndex}"></slot>`;
    }

    return `data-x${markerId}="${markerIndex}"`;
  });

  return new Template(annotatedString, annotatedValues);
}

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }

  let templateElement = document.createElement("template");
  templateElement.innerHTML = template.string;

  let fragment = templateElement.content.cloneNode(true) as DocumentFragment;
  let slots = Array.from(fragment.querySelectorAll(`[data-x${markerId}]`));

  slots.forEach((slot: HTMLElement, i) => {
    const min = Number(slot.dataset[`x${markerId}`]);
    const max = Number((slots[i + 1] as HTMLElement)?.dataset?.[`x${markerId}`] ?? min + 1);
    const count = max - min;
    console.log(slot, count);
  });

  console.log(template.values);
}
