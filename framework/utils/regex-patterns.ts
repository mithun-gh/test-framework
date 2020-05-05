export const isAttr: RegExp = /[a-z]+\s*=$/;
export const strPattern: RegExp = /___\$\$mfr\(([0-9]+)\)/g;
export const attrPattern: RegExp = /([a-z]+)\s*=\s*___\$\$mfr\(([0-9]+)\)/g;
export const eventPattern: RegExp = /on([a-z]+)\s*=\s*___\$\$mfr\(([0-9]+)\)/g;
