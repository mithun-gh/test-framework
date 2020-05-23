import { slotMarker } from "./constants";

export const event: RegExp = /\s+on([a-z]+)\s*=$/i;
export const attribute: RegExp = /\s+([a-z]+)\s*=$/i;
export const openTagEnd: RegExp = /\/?>/;
export const stringLiteral: RegExp = /""|".*?[^\\]"|''|'.*?[^\\]'/g;
export const markedStrings = new RegExp(`[a-z]+=\\${slotMarker}|\\${slotMarker}`, "gi");
