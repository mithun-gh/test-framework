import { Template } from "./template";

interface Constructor {
  new (...args: any[]): {};
}

export const Property = (target: any, key: string) => {
  if (target.attributes == null) {
    target.attributes = [key];
  }
  target.attributes.push(key);
};

export const Component = (tagName: string) => <T extends Constructor>(
  constructor: T
) => {
  const component: any = new constructor();

  const element = class extends HTMLElement {
    connectedCallback() {
      // this.render();
    }

    render() {
      this.innerHTML = "";
      const template = component.render?.();
      this.appendChild(template.getTemplateInstance());
    }

    static get observedAttributes() {
      return component.attributes;
    }

    attributeChangedCallback(name, oldValue, newValue) {
      component[name] = newValue;
      // this.render();
    }
  };

  customElements.define(tagName, element);
};
