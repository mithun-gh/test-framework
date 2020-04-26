export function render(template: Template, selector: string) {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`Invalid selector: ${selector}`);
  }
  element.insertAdjacentHTML("afterbegin", template.getHtml());
}

class Template {
  private readonly strings: TemplateStringsArray;
  private readonly values: readonly unknown[];

  constructor(strings: TemplateStringsArray, values: readonly unknown[]) {
    this.strings = strings;
    this.values = values;
  }

  getHtml(): string {
    let html = "";

    this.strings.forEach((s: unknown, i: number) => {
      const v = this.values[i];
      html += s + this.transform(v);
    });

    return html;
  }

  private escape(html: string): string {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private transform(value: unknown): string {
    if (Array.isArray(value)) {
      return value.map((v) => this.transform(v)).join("");
    }

    if (value instanceof Template) {
      return value.getHtml();
    }

    if (typeof value === "function") {
      const fn = value.toString().replace(/"/g, "'");
      return `"(${fn})(event)"`;
    }

    if (value != null) {
      return this.escape(value.toString());
    }

    return "";
  }
}

export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new Template(strings, values);
