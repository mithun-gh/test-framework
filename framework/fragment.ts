import { Slot, SlotType } from "./slot";
import { Template } from "./template";
import { Metadata, MetadataType } from "./metadata";

export class Fragment {
  readonly template: Template;

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
    const node = this.template.createElement();
    this.applyValues(node);
    container.appendChild(node);
  }

  replace(element: HTMLElement) {
    const node = this.template.createElement();
    this.applyValues(node);
    element.replaceWith(node);
  }

  private applyValues(docFragment: DocumentFragment) {
    let valueIndex = 0;
    const selector = this.template.sentinel.selector;
    const property = this.template.sentinel.property;
    docFragment.querySelectorAll(selector).forEach((element: HTMLElement) => {
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
      if (!Array.isArray(value)) {
        const fragment = new Fragment(value as Template);
        fragment.replace(element);
        return new Slot(null, SlotType.Fragment, fragment);
      }
      const fragments: Fragment[] = [];
      const templates = value as Template[];
      templates.forEach((template: Template) => {
        const fragment = new Fragment(template);
        fragment.appendInto(element.parentNode as HTMLElement);
        fragments.push(fragment);
      });
      element.remove();
      return new Slot(null, SlotType.Fragment, fragments);
    }
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
  }
}
