// FragmentCache.get(template.strings);
// FragmentCache.set(template.strings, new Fragment(container));
export const FragmentCache: WeakMap<readonly string[], Fragment> = new WeakMap();

export class Template {
  readonly strings: readonly string[];
  readonly values: readonly unknown[];
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
