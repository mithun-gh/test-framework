export class Sentinel {
  readonly id: number;

  constructor() {
    this.id = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  get marker() {
    return `{${this.id}}`;
  }

  get attribute() {
    return `data-slot-${this.id}`;
  }

  get selector() {
    return `[${this.attribute}]`;
  }

  get regex() {
    return new RegExp(`[a-z]+=\\${this.marker}|\\${this.marker}`, "gi");
  }

  get property() {
    return `slot-${this.id}`;
  }
}
