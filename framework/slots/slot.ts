import { Fragment } from "../fragment";

export type SlotValue = Node | Fragment | Slot[];

interface Slot {
  value: SlotValue;
  update(value: SlotValue);
}
