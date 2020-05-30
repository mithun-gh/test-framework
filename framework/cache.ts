import { Template } from "./template";

export const TemplateCache: WeakMap<TemplateStringsArray, Template> = new WeakMap();
