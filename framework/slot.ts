import { Fragment } from "./fragment";

export type SlotValue = Node | Fragment | Slot[];

export enum SlotType {
  Attribute = "attribute",
  Event = "event",
  Fragment = "fragment",
  Inactive = "inactive",
  Iterable = "iterable",
  Text = "text",
}

export class Slot {
  readonly value: SlotValue;
  readonly type: SlotType;

  constructor(value: SlotValue, type: SlotType) {
    this.value = value;
    this.type = type;
  }
}
