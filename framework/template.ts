import { eventPattern, attrPattern, strPattern, isAttr } from "./utils/regex-patterns";

enum SlotType {
  Attribute = "attribute",
  Event = "event",
  Text = "text",
}

interface Slot {
  node: Node;
  parent: Node;
  type: SlotType;
  value: unknown;
}

export function render(template: Template, container: Element) {
  if (container === null) {
    throw new Error(`Container cannot be null.`);
  }
  // Clear the container
  while (container.firstChild) {
    container.firstChild.remove();
  }
  container.appendChild(template.getTemplateInstance());
}

export class Template {
  private slots: Partial<Slot>[] = [];
  private strings: readonly string[];
  private values: readonly unknown[];

  constructor(strings: readonly string[], values: readonly unknown[]) {
    this.strings = strings;
    this.values = values;
  }

  getTemplateInstance(): Node {
    const parents: Node[] = [];
    const template = this.getTemplateElement();
    const instance = template.content.cloneNode(true) as DocumentFragment;

    instance.querySelectorAll("[parent-marker]").forEach((parent) => {
      parents.push(parent);
    });

    this.execReplacer(instance, "event-marker", "event", (elem, key, id) => {
      const slot = this.slots[id];
      slot.node = elem;
      slot.type = SlotType.Event;
      slot.parent = parents.find((p) => p.parentNode.contains(elem))?.parentNode;
      elem.addEventListener(key, slot.value);
    });

    this.execReplacer(instance, "attr-marker", "attr", (elem, key, id) => {
      const slot = this.slots[id];
      slot.node = elem;
      slot.type = SlotType.Attribute;
      slot.parent = parents.find((p) => p.parentNode.contains(elem))?.parentNode;
      elem[this.preprocessKey(key)] = slot.value;
    });

    this.execReplacer(instance, "text-marker", "text", (elem, _, id) => {
      const slot = this.slots[id];
      const text = document.createTextNode(slot.value as string);
      slot.node = text;
      slot.type = SlotType.Text;
      slot.parent = parents.find((p) => p.parentNode.contains(elem))?.parentNode;
      elem.replaceWith(text);
    });

    parents.forEach((p) => p.parentNode.removeChild(p));

    return instance;
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
  }

  private execReplacer(
    instance: DocumentFragment,
    marker: string,
    replacerType: string,
    cb: Function
  ) {
    instance.querySelectorAll(`[${marker}]`).forEach((element: HTMLElement) => {
      if (replacerType === "text") {
        cb(element, null, element.dataset.text);
        return;
      }

      element.removeAttribute(marker);
      Object.entries(element.dataset).forEach((entry) => {
        const [key, value] = entry;
        const [type, id] = value.split(":");
        if (type === replacerType) {
          element.removeAttribute(`data-${key}`);
          cb(element, key, id);
        }
      });
    });
  }

  private getTemplateElement(): HTMLTemplateElement {
    const template = document.createElement("template");
    template.innerHTML = this.getProcessedHtml();
    return template;
  }

  private getProcessedHtml(): string {
    let html = this.getHtml(this.strings, this.values);

    // process event handlers
    // event-marker is needed because, without it, querying
    // all the elements that have event bindings will be impossible/difficult.
    // For example, if elements just had attributes like data-click="event:<id>",
    // then we need to query those elements multiple times with multiple queries
    // like [data-click], [data-mouseover] etc
    html = html.replace(eventPattern, (_, event, id) => {
      return `event-marker data-${event}="event:${id}"`;
    });

    // process attributes
    // attr-marker is required for the same reason as event-marker
    html = html.replace(attrPattern, (_, attr, id) => {
      return `attr-marker data-${attr}="attr:${id}"`;
    });

    // process strings
    // escape the strings, they might have illegal HTML
    html = html.replace(strPattern, (marker, id) => {
      const value = this.slots[id].value;
      return value ? `<template text-marker data-text="${id}"></template>` : marker;
    });

    return html;
  }

  // recursively flatten the nested strings and values
  private getHtml(str: readonly string[], val: readonly unknown[]): string {
    if (str === null) {
      return val.reduce((h, v) => h + this.transform(v, false), "") as string;
    } else {
      return str.reduce((h, s, i) => h + s + this.transform(val[i], isAttr.test(s)), "");
    }
  }

  private transform(val: unknown, isAttr: boolean): string {
    if (val instanceof Template) {
      return this.getHtml(val.strings, val.values);
    }

    // if an array has isAttr flag set, then
    // it should be treated as a data.
    // or else, recursively flatten out the array
    if (Array.isArray(val) && !isAttr) {
      return "<template parent-marker></template>" + this.getHtml(null, val);
    }

    if (val != null) {
      this.slots.push({ value: val });
      // TODO: add a random prefix using getId() to
      // avoid collusion with the user-supplied text
      return `{{${this.slots.length - 1}}}`;
    }

    return "";
  }

  private escape(html: string): string {
    if (html === "") {
      return `""`;
    }

    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private getId(): number {
    return Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
  }
}

export const html = (strings: readonly string[], ...values: readonly unknown[]) =>
  new Template(strings, values);
