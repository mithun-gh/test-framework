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
