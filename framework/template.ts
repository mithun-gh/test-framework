export function render(template: Template, selector: string) {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`Invalid selector: ${selector}`);
  }
  element.appendChild(template.getTemplateInstance());
}

class Template {
  private eventHandlers: Array<EventListener>;

  private readonly eventNamePattern: RegExp = /on([a-z]+)\s*=$/;
  private readonly strings: TemplateStringsArray;
  private readonly values: readonly unknown[];

  constructor(strings: TemplateStringsArray, values: readonly unknown[]) {
    this.strings = strings;
    this.values = values;
    this.eventHandlers = [];
  }

  getTemplateInstance(): Node {
    const template = this.getTemplateElement();
    const instance = document.importNode(template.content, true);

    instance
      .querySelectorAll("[___event___]")
      .forEach((element: HTMLElement) => {
        element.removeAttribute("___event___");
        Object.entries(element.dataset).forEach((entry) => {
          const [event, id] = entry;
          element.removeAttribute(`data-${event}`);
          element.addEventListener(event, this.eventHandlers[id]);
        });
      });

    return instance;
  }

  private getTemplateElement(): HTMLTemplateElement {
    const template = document.createElement("template");
    template.innerHTML = this.getHtml();
    return template;
  }

  private getHtml(): string {
    let html = "";

    this.strings.forEach((s: string, i: number) => {
      const v = this.values[i];
      html += this.transform(v, s);
    });

    return html;
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

  private transform(value: unknown, substring: string): string {
    if (Array.isArray(value)) {
      return substring + value.map((v) => this.transform(v, "")).join("");
    }

    if (value instanceof Template) {
      return substring + value.getHtml();
    }

    if (typeof value === "function") {
      const result = substring.match(this.eventNamePattern);
      const attr = result?.[0];
      const type = result?.[1];
      const id = this.eventHandlers.length;
      this.eventHandlers.push(value as EventListener);
      return substring.replace(attr, "") + `___event___ data-${type}="${id}"`;
    }

    if (value != null) {
      return substring + this.escape(value.toString());
    }

    return substring;
  }
}

export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new Template(strings, values);
