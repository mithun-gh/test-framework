import { TemplateCache } from "./cache";
import { Metadata, MetadataType } from "./metadata";
import { isOpenTagEnd } from "./utils";
import { event, attribute } from "./regex";
import { Template } from "./template";
import { Sentinel } from "./sentinel";

export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): Template {
  if (TemplateCache.has(strings)) {
    const template = TemplateCache.get(strings);
    const newValues = transformValues(values, template.metadata);
    return TemplateCache.get(strings).updateValues(newValues);
  }

  let metadata: Metadata[] = values.map((value, i) => {
    let key: string;
    let str: string = strings.raw[i];
    const nextStr: string = strings.raw[i + 1];
    const isLastAttr = isOpenTagEnd(nextStr) ?? true;
    if ((key = str.match(event)?.[1])) {
      return new Metadata(MetadataType.Event, [key, isLastAttr]);
    } else if ((key = str.match(attribute)?.[1])) {
      return new Metadata(MetadataType.Attribute, [key, isLastAttr]);
    } else if (value instanceof Template) {
      return new Metadata(MetadataType.Template);
    } else if (Array.isArray(value)) {
      return new Metadata(MetadataType.Template, [i]);
    } else {
      return new Metadata(MetadataType.Text);
    }
  });

  let slotIndex: number = -1;
  const sentinel = new Sentinel();
  let string = strings.raw.join(sentinel.simple).replace(sentinel.regex, () => {
    const meta = metadata[++slotIndex];
    if (meta.type === MetadataType.Attribute || meta.type === MetadataType.Event) {
      return meta.value[1] ? `${sentinel.attribute}="${slotIndex}"` : "";
    } else {
      return `<template ${sentinel.attribute}="${slotIndex}"></template>`;
    }
  });

  const newValues = transformValues(values, metadata);
  const template = new Template(string, newValues, metadata, sentinel);

  TemplateCache.set(strings, template);

  return template;
}

function transformValues(values: readonly unknown[], metadata: readonly Metadata[]): unknown[] {
  const newValues = [...values];
  metadata
    .filter((meta) => meta.type === MetadataType.Template && meta.value.length > 0)
    .forEach((meta) => {
      let subString = "";
      const subMeta = [];
      const subValues = [];
      const subSentinel = new Sentinel();
      const templateIndex = meta.value[0];
      const templateArray = newValues[templateIndex] as unknown[];

      templateArray.forEach((value) => {
        if (value instanceof Template) {
          subString += value.string.replace(value.sentinel.attribute, subSentinel.attribute);
          subValues.push(...value.values);
          subMeta.push(...value.metadata);
        } else {
          subString += String(value);
        }
      });
      newValues.splice(templateIndex, 1, new Template(subString, subValues, subMeta, subSentinel));
    });
  return newValues;
}
