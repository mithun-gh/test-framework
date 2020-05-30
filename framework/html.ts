import { TemplateCache } from "./cache";
import { Metadata, MetadataType } from "./metadata";
import { isOpenTagEnd } from "./utils";
import { event, attribute } from "./regex";
import { Template } from "./template";
import { Sentinel } from "./sentinel";

export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): Template {
  if (TemplateCache.has(strings)) {
    return TemplateCache.get(strings).duplicate(values);
  }

  let metadata: Metadata[] = values.map((value, i) => {
    let key: string;
    let str: string = strings[i];
    const rawStrings: readonly string[] = strings.raw;
    const isLastAttr = isOpenTagEnd(rawStrings[i + 1]) ?? true;
    if ((key = str.match(event)?.[1])) {
      return new Metadata(MetadataType.Event, [key, isLastAttr]);
    } else if ((key = str.match(attribute)?.[1])) {
      return new Metadata(MetadataType.Attribute, [key, isLastAttr]);
    } else if (value instanceof Template) {
      return new Metadata(MetadataType.Template);
    } else if (Array.isArray(value)) {
      return new Metadata(MetadataType.TemplateArray);
    } else {
      return new Metadata(MetadataType.Text);
    }
  });

  let slotIndex: number = -1;
  const sentinel = new Sentinel();
  let string = strings.join(sentinel.simple).replace(sentinel.regex, () => {
    const meta = metadata[++slotIndex];
    if (meta.type === MetadataType.Attribute || meta.type === MetadataType.Event) {
      return meta.value[1] ? `${sentinel.attribute}="${slotIndex}"` : "";
    } else {
      return `<template ${sentinel.attribute}="${slotIndex}"></template>`;
    }
  });

  const template = new Template(string, values, metadata, sentinel);
  TemplateCache.set(strings, template);

  return template;
}
