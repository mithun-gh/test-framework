export class Sentinel {
  readonly id: number;

  constructor() {
    this.id = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  get marker() {
    return `{${this.id}}`;
  }

  get property() {
    return `slot_${this.id}`;
  }

  get attribute() {
    return `data-${this.property}`;
  }

  get selector() {
    return `[${this.attribute}]`;
  }

  get regex() {
    return new RegExp(`[a-z-0-9]+=\\${this.marker}|\\${this.marker}`, "gi");
  }
}
