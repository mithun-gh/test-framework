import { openTagEnd, stringLiteral } from "./regex";

// str should be String.raw
export function isOpenTagEnd(str: string): boolean {
  return str ? openTagEnd.test(str.replace(stringLiteral, "")) : null;
}

export function squash(a: readonly string[], b: readonly string[]): TemplateStringsArray {
  const string = (a[a.length - 1] ?? "") + (b[0] ?? "");
  let result = a.slice(0, a.length - 1).concat(string, b.slice(1, b.length));
  return { raw: result, ...result };
}
