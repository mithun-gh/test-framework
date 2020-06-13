import { Template } from "./template";
import { Slot, SlotType } from "./slot";
import { containers } from "./cache";
import { Metadata, MetadataType } from "./metadata";

export class Fragment {
  readonly template: Template;

  private slots: Slot[] = [];

  constructor(template: Template) {
    this.template = template;
  }

  updateSlot(slot: Slot, newValue: unknown, oldValue: unknown, index: number) {
    if (slot === undefined) {
      if (newValue instanceof Template) {
        const parentSlot = this.slots[index];
        const container = containers.get(parentSlot);
        const fragment = new Fragment(newValue);
        fragment.appendInto(container);
        (parentSlot.value as Slot[]).push(new Slot(fragment, SlotType.Fragment));
      }
      (this.template.values[index] as Template[]).push(newValue as Template);
      return;
    }

    if (slot.type === SlotType.Text && newValue !== oldValue) {
      const node = slot.value as Text;
      node.data = String(newValue);
    }

    if (slot.type === SlotType.Attribute && newValue !== oldValue) {
      const meta = this.template.metadata[index];
      const [key] = meta.value;
      const element = slot.value as HTMLElement;
      element[this.preprocessKey(key)] = newValue;
    }

    if (slot.type === SlotType.Fragment) {
      const template = newValue as Template;
      const fragment = slot.value as Fragment;
      fragment.update(template.values);
    }

    if (slot.type === SlotType.Iterable) {
      const slots = slot.value as Slot[];
      const newValues = newValue as unknown[];
      const oldValues = oldValue as unknown[];
      newValues.forEach((newValue, i) => {
        const slot = slots[i];
        const oldValue = oldValues[i];
        this.updateSlot(slot, newValue, oldValue, index);
      });
    }
  }

  update(newValues: unknown[]) {
    newValues.forEach((newValue, i) => {
      const slot = this.slots[i];
      const oldValue = this.template.values[i];
      this.updateSlot(slot, newValue, oldValue, i);
    });
    this.template.values = newValues;
  }

  attachTo(container: HTMLElement) {
    if (container == null) {
      throw new Error("Invalid container.");
    }
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

  prependTo(element: HTMLElement) {
    const node = this.template.createElement();
    this.applyValues(node);
    element.parentNode.insertBefore(node, element);
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
      const [index, prevIndex] = element.dataset[property].split(":");
      const limit = Number(index);
      const prevLimit = Number(prevIndex) + 1;

      while (valueIndex < prevLimit) {
        const meta = new Metadata(MetadataType.Comment);
        this.slots.push(this.createSlot(null, meta, null));
        valueIndex++;
      }

      while (valueIndex <= limit) {
        const value = this.template.values[valueIndex];
        const meta = this.template.metadata[valueIndex];
        this.slots.push(this.createSlot(value, meta, element));
        valueIndex++;
      }
    });
  }

  private createSlot(value: unknown, metadata: Metadata, element: HTMLElement): Slot {
    if (metadata.type === MetadataType.Comment) {
      return new Slot(null, SlotType.Inactive);
    }

    if (metadata.type === MetadataType.Text) {
      const text: Text = document.createTextNode("");
      element.replaceWith(text);
      text.data = value as string;
      return new Slot(text, SlotType.Text);
    }

    if (metadata.type === MetadataType.Attribute) {
      const [key] = metadata.value;
      element[this.preprocessKey(key)] = value;
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Attribute);
    }

    if (metadata.type === MetadataType.Event) {
      const [key] = metadata.value;
      element.addEventListener(key, value as EventListenerOrEventListenerObject);
      element.removeAttribute(this.template.sentinel.attribute);
      return new Slot(element, SlotType.Event);
    }

    if (metadata.type === MetadataType.Template) {
      const fragment = new Fragment(value as Template);
      fragment.replace(element);
      return new Slot(fragment, SlotType.Fragment);
    }

    if (metadata.type === MetadataType.Iterable) {
      const items = value as unknown[];
      const slots: Slot[] = [];

      items.forEach((item) => {
        if (item instanceof Template) {
          const fragment = new Fragment(item);
          fragment.prependTo(element as HTMLElement);
          slots.push(new Slot(fragment, SlotType.Fragment));
        } else {
          const text: Text = document.createTextNode("");
          text.data = item as string;
          element.parentNode.insertBefore(text, element);
          return new Slot(text, SlotType.Text);
        }
      });

      const slot = new Slot(slots, SlotType.Iterable);
      containers.set(slot, element.parentNode as HTMLElement);
      element.remove();
      return slot;
    }
  }

  private preprocessKey(key: string): string {
    if (key === "class") {
      return "className";
    }
    return key;
  }
}
