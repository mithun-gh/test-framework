// FragmentCache.get(template.strings);
// FragmentCache.set(template.strings, new Fragment(container));
export const FragmentCache: WeakMap<readonly string[], Fragment> = new WeakMap();

const event: RegExp = /\s+on([a-z]+)\s*=$/;
const attribute: RegExp = /\s+([a-z]+)\s*=$/;

export enum ValueType {
  Attribute = "attribute",
  Event = "event",
  Template = "template",
  Text = "text",
}

export type ValueData = [string, unknown] | Template | Template[] | string;

export class Value {
  readonly type: ValueType;
  readonly data: ValueData;

  constructor(type: ValueType, data: ValueData) {
    this.type = type;
    this.data = data;
  }
}

export class Template {
  readonly strings: readonly string[];
  readonly values: readonly Value[];

  constructor(string: readonly string[], values: readonly Value[]) {
    this.strings = string;
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
  let annotatedValues: Value[] = [];

  values.forEach((value, i) => {
    let key: string;
    let val: any;
    let str: string = strings[i];

    if ((key = str.match(event)?.[1])) {
      val = new Value(ValueType.Event, [key, value]);
    } else if ((key = str.match(attribute)?.[1])) {
      val = new Value(ValueType.Attribute, [key, value]);
    } else if (value instanceof Template || value?.[0] instanceof Template) {
      val = new Value(ValueType.Template, value as Template[]);
    } else {
      val = new Value(ValueType.Text, String(value));
    }

    annotatedValues.push(val);
  });

  return new Template(strings, annotatedValues);
}

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }
  console.log(template);
}
