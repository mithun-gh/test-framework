import { Slot, SlotType } from "./slot";
import { Template } from "./template";
import { Metadata, MetadataType } from "./metadata";

export class Fragment {
  readonly template: Template;

  private container: HTMLElement;
  private slots: Slot[] = [];

  constructor(template: Template) {
    this.template = template;
  }

  attachTo(container: HTMLElement) {
    while (container.firstChild) {
      container.firstChild.remove();
    }
    this.appendInto(container);
  }

  appendInto(container: HTMLElement) {
    if (this.container !== undefined) {
      return;
    }
    this.container = container;
    const node = this.template.createElement();
    this.container.appendChild(node);
    this.applyValues();
  }

  private applyValues() {
    let valueIndex = 0;
    const selector = this.template.sentinel.selector;
    const property = this.template.sentinel.property;
    this.container.querySelectorAll(selector).forEach((element: HTMLElement) => {
      const limit = Number(element.dataset[property]);
      while (valueIndex <= limit) {
        const value = this.template.values[valueIndex];
        const meta = this.template.metadata[valueIndex];
        this.slots.push(this.createSlot(value, meta, element));
        valueIndex++;
      }
    });
  }

  private createSlot(value: unknown, metadata: Metadata, element: HTMLElement): Slot {
    if (metadata.type === MetadataType.Text) {
      const text: Text = document.createTextNode("");
      element.replaceWith(text);
      text.data = value as string;
      return new Slot(text, SlotType.Text, value);
    }

    if (metadata.type === MetadataType.Attribute) {
      const [key] = metadata.value;
      element[this.preprocessKey(key)] = value;
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Attribute, value);
    }

    if (metadata.type === MetadataType.Event) {
      const [key] = metadata.value;
      element.addEventListener(key, value as EventListenerOrEventListenerObject);
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Event, value);
    }

    if (metadata.type === MetadataType.Template) {
      const templates = (Array.isArray(value) ? value : [value]) as Template[];
      templates.forEach((template: Template) => {
        new Fragment(template).appendInto(element.parentNode as HTMLElement);
      });
      element.remove();
    }
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
  }
}
