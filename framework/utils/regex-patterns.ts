export const isAttr: RegExp = /[a-z]+\s*=$/;
export const strPattern: RegExp = /{{([0-9]+)}}/g;
export const attrPattern: RegExp = /([a-z]+)\s*=\s*{{([0-9]+)}}/g;
export const eventPattern: RegExp = /on([a-z]+)\s*=\s*{{([0-9]+)}}/g;
