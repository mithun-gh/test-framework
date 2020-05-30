import { openTagEnd, stringLiteral } from "./regex";

// str should be String.raw
export function isOpenTagEnd(str: string): boolean {
  return str ? openTagEnd.test(str.replace(stringLiteral, "")) : null;
}
