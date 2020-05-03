export function render(template: Template, queryOrElem: string | Element) {
  if (queryOrElem instanceof Element) {
    queryOrElem.appendChild(template.getTemplateInstance());
  } else {
    const element = document.querySelector(queryOrElem);
    if (element === null) {
      throw new Error(`Invalid selector: ${queryOrElem}`);
    }
    element.innerHTML = "";
    element.appendChild(template.getTemplateInstance());
  }
}

export class Template {
  private data: any = {};

  private readonly isAttr: RegExp = /[a-z]+\s*=$/;
  private readonly strPattern: RegExp = /___\$\$mfr\(([0-9]+)\)/g;
  private readonly attrPattern: RegExp = /([a-z]+)\s*=\s*___\$\$mfr\(([0-9]+)\)/g;
  private readonly eventPattern: RegExp = /on([a-z]+)\s*=\s*___\$\$mfr\(([0-9]+)\)/g;

  readonly strings: TemplateStringsArray;
  readonly values: readonly unknown[];

  constructor(strings: TemplateStringsArray, values: readonly unknown[]) {
    this.strings = strings;
    this.values = values;
  }

  getTemplateInstance(): Node {
    const template = this.getTemplateElement();
    const instance = document.importNode(template.content, true);

    this.execReplacer(instance, "___event___", "event", (elem, key, id) => {
      elem.addEventListener(key, this.data[id]);
    });

    this.execReplacer(instance, "___attr___", "attr", (elem, key, id) => {
      elem[this.preprocessKey(key)] = this.data[id];
    });

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
    // ___event___ marker is needed because, without it, querying
    // all the elements that have event bindings will be impossible/difficult.
    // For example, if elements just had attributes like data-click="event:<id>",
    // then we need to query those elements multiple times with multiple queries
    // like [data-click], [data-mouseover] etc
    html = html.replace(this.eventPattern, (_, event, id) => {
      return `___event___ data-${event}="event:${id}"`;
    });

    // process attributes
    // ___attr___ marker is required for the same reason as ___event___
    html = html.replace(this.attrPattern, (_, attr, id) => {
      return `___attr___ data-${attr}="attr:${id}"`;
    });

    // process strings
    // escape the strings, they might have illegal HTML
    html = html.replace(this.strPattern, (marker, id) => {
      const value = this.data[id];
      return this.escape(value?.toString() ?? marker);
    });

    return html;
  }

  // recursively flatten the nested strings and values
  private getHtml(str: TemplateStringsArray, val: readonly unknown[]): string {
    if (str === null) {
      return val.reduce((h, v) => h + this.transform(v, false), "") as string;
    } else {
      return str.reduce(
        (h, s, i) => h + s + this.transform(val[i], this.isAttr.test(s)),
        ""
      );
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
      return this.getHtml(null, val);
    }

    if (val != null) {
      const id = this.getId();
      this.data[id] = val;
      return `___$$mfr(${id})`;
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
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
}

export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new Template(strings, values);
