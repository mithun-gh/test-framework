export const event: RegExp = /\s+on([a-z-0-9]+)\s*=$/i;
export const attribute: RegExp = /\s+([a-z-0-9]+)\s*=$/i;
export const comment: RegExp = /<!--(.|\n)*?-->/g;
export const openTagEnd: RegExp = /\/?>/;
export const stringLiteral: RegExp = /""|".*?[^\\]"|''|'.*?[^\\]'/g;
