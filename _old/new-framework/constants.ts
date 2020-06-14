export const slotId: number = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
export const slotMarker: string = `{${slotId}}`;
export const slotAttribute: string = `data-slot-${slotId}`;
export const slotSelector: string = `[${slotAttribute}]`;
export const slotProperty: string = `slot-${slotId}`;
