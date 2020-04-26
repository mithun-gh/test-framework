export function render(template: TemplateResult, selector: string) {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`Invalid selector: ${selector}`);
  }
  element.insertAdjacentHTML("afterbegin", template.html);
}

class TemplateResult {
  html: string;
  constructor(html: string) {
    this.html = html;
  }
}

export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return `<style>${strings.join()}</style>`;
}

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): TemplateResult {
  let result = "";

  strings.forEach((s: unknown, i: number) => {
    const v = values[i];
    result += s + transform(v);
  });

  return new TemplateResult(result);
}

function transform(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => transform(v)).join("");
  }

  if (value instanceof TemplateResult) {
    return value.html;
  }

  if (typeof value === "function") {
    const fn = value.toString().replace(/"/g, "'");
    return `"(${fn})(event)"`;
  }

  if (value != null) {
    return escape(value.toString());
  }

  return "";
}

function escape(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
