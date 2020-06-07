export enum MetadataType {
  Attribute = "attribute",
  Comment = "comment",
  Event = "event",
  Iterable = "iterable",
  Template = "template",
  Text = "text",
}

export class Metadata {
  readonly type: MetadataType;
  readonly value: readonly any[];

  constructor(type: MetadataType, value?: readonly any[]) {
    this.type = type;
    this.value = value;
  }
}
