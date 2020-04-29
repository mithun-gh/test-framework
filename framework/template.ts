export function render(template: Template, selector: string) {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`Invalid selector: ${selector}`);
  }
  element.appendChild(template.getTemplateInstance());
}

export class Template {
  private flatValues: unknown[] = [];

  private readonly strPattern: RegExp = /___\$\$mfr\(([0-9])+\)/g;
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

    /* instance
      .querySelectorAll("[___event___]")
      .forEach((element: HTMLElement) => {
        element.removeAttribute("___event___");
        Object.entries(element.dataset).forEach((entry) => {
          const [event, id] = entry;
          element.removeAttribute(`data-${event}`);
          element.addEventListener(event, this.eventHandlers[id]);
        });
      }); */

    return instance;
  }

  private getTemplateElement(): HTMLTemplateElement {
    const template = document.createElement("template");
    template.innerHTML = this.getHtml();
    return template;
  }

  private getHtml(): string {
    let html = this.getProcessedHtml(this.strings, this.values);

    // process event handlers
    html = html.replace(this.eventPattern, (_, event, id) => {
      return `___event___ data-${event}="event:${id}"`;
    });

    // process attributes
    html = html.replace(this.attrPattern, (_, attr, id) => {
      return `___attr___ data-${attr}="attr:${id}"`;
    });

    // process strings
    html = html.replace(this.strPattern, (_, id) => {
      return this.escape(this.flatValues[id].toString());
    });

    return html;
  }

  private getProcessedHtml(
    str: TemplateStringsArray,
    val: readonly unknown[]
  ): string {
    if (str === null) {
      return val.reduce((h, v) => h + this.transform(v), "") as string;
    } else {
      return str.reduce((h, s, i) => h + s + this.transform(val[i]), "");
    }
  }

  private transform(val: unknown): string {
    if (val instanceof Template) {
      return this.getProcessedHtml(val.strings, val.values);
    }

    if (Array.isArray(val)) {
      return this.getProcessedHtml(null, val);
    }

    if (val != null) {
      this.flatValues.push(val);
      return `___$$mfr(${this.flatValues.length - 1})`;
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
}

export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new Template(strings, values);
