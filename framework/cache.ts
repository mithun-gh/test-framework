import { Fragment } from "./fragment";
import { Slot } from "./slot";

export const containers: WeakMap<Slot, HTMLElement> = new WeakMap();
export const fragments: WeakMap<TemplateStringsArray, Fragment> = new WeakMap();
