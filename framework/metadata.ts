export enum MetadataType {
  Attribute = "attribute",
  Event = "event",
  Template = "template",
  TemplateArray = "template-array",
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
