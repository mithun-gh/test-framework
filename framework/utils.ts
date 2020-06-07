import { openTagEnd, stringLiteral } from "./regex";

// str should be String.raw
export function isOpenTagEnd(str: string): boolean {
  return str ? openTagEnd.test(str.replace(stringLiteral, "")) : null;
}

export function isEvent(name: string): boolean {
  return document[`on${name}`] !== undefined || name[0] === name[0].toUpperCase();
}
