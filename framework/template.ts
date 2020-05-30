import { Metadata } from "./metadata";
import { Sentinel } from "./sentinel";

export class Template {
  values: readonly unknown[];

  readonly string: string;
  readonly metadata: readonly Metadata[];
  readonly sentinel: Sentinel;

  constructor(
    string: string,
    values: readonly unknown[],
    metadata: readonly Metadata[],
    sentinel: Sentinel
  ) {
    this.string = string;
    this.values = values;
    this.metadata = metadata;
    this.sentinel = sentinel;
  }

  duplicate(values: readonly unknown[]): Template {
    return new Template(this.string, values, this.metadata, this.sentinel);
  }

  updateValues(newValues: readonly unknown[]): Template {
    this.values = newValues;
    return this;
  }

  createElement(): DocumentFragment {
    const template = document.createElement("template");
    template.innerHTML = this.string;
    return template.content.cloneNode(true) as DocumentFragment;
  }
}
