import { Metadata } from "./metadata";
import { Sentinel } from "./sentinel";

export class Template {
  readonly string: string;
  readonly values: readonly unknown[];
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

  createElement(): DocumentFragment {
    const template = document.createElement("template");
    template.innerHTML = this.string;
    return template.content.cloneNode(true) as DocumentFragment;
  }
}
