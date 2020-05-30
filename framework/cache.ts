import { Template } from "./template";
import { Fragment } from "./fragment";

export const TemplateCache: WeakMap<TemplateStringsArray, Template> = new WeakMap();
export const FragmentCache: WeakMap<Template, Fragment> = new WeakMap();
