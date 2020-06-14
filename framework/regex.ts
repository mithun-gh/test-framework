export const event: RegExp = /\s+on([a-z-]+)\s*=$/i;
export const attribute: RegExp = /\s+([a-z-]+)\s*=$/i;
export const comment: RegExp = /<!--(.|\n)*?-->/g;
export const openTagEnd: RegExp = /\/?>/;
export const stringLiteral: RegExp = /""|".*?[^\\]"|''|'.*?[^\\]'/g;
