/**
 * 代理dom元素
 */
class Element {
  el:HTMLElement;
  data: {[k:string]:any} = {}
  constructor(tag:string|HTMLElement, className = '') {
    if (typeof tag === 'string') {
      this.el = document.createElement(tag);
      this.el.className = className;
    } else {
      this.el = tag;
    }
  }
  update(key: string, d: any) {
    let hasChange = false;
    if (this.data[key] !== d) {
      this.data[key] = d;
      hasChange = true;
    }
    return hasChange;
  }
  get(key:string) {
    return this.data[key]
  }
  on(eventName:string, handler:(evt: Event & any, elem: Element) => void, stop?:boolean) {
    if (eventName === 'mousewheel' && /Firefox/i.test(window.navigator.userAgent)) {
      eventName = 'DOMMouseScroll';
    }
    this.el.addEventListener(eventName, (evt) => {
      handler(evt, this);
      if (stop) {
        evt.stopPropagation();
      }
    });
    return this;
  }
  onDrag(events: {
    start: (evt: MouseEvent) => void,
    dragging: (evt: MouseEvent) => void,
    end: (evt: MouseEvent) => void,
  }) {
    this.el.addEventListener('mousedown', (evt) => {
      evt.stopPropagation();
      events.start(evt);
      document.addEventListener('mousemove', events.dragging);
    });
    document.addEventListener('mouseup', (evt: MouseEvent) => {
      evt.stopPropagation();
      events.end(evt);
      document.removeEventListener('mousemove', events.dragging);
    })
  }

  offset() {
    const {
      offsetTop, offsetLeft, offsetHeight, offsetWidth
    } = this.el;
    return {
      top: offsetTop,
      left: offsetLeft,
      height: offsetHeight,
      width: offsetWidth,
    };
  }

  scroll(v?: {left?: number, top?: number}) {
    const { el } = this;
    if (v !== undefined) {
      if (v.left !== undefined) {
        el.scrollLeft = v.left;
      }
      if (v.top !== undefined) {
        el.scrollTop = v.top;
      }
    }
    return { left: el.scrollLeft, top: el.scrollTop };
  }

  box() {
    return this.el.getBoundingClientRect();
  }

  parent() {
    return new Element(this.el.parentElement as HTMLElement);
  }

  children(...eles:(string|Element|HTMLElement)[]):Element| NodeListOf<ChildNode> {
    if (!eles.length) {
      return this.el.childNodes;
    }
    eles.forEach(ele => this.child(ele));
    return this;
  }

  removeChild(el:Node) {
    this.el.removeChild(el);
  }

  child(arg:string|Element|HTMLElement) {
    let c: Node = arg as HTMLElement;
    if (typeof arg === 'string') {
      c = document.createTextNode(arg);
    } else if (arg instanceof Element) {
      c = arg.el;
    }
    this.el.appendChild(c);
    return this;
  }

  contains(ele:Node) {
    return this.el.contains(ele);
  }

  className(v?:string) {
    if (v !== undefined) {
      this.el.className = v;
      return this;
    }
    return this.el.className;
  }

  addClass(name:string) {
    this.el.classList.add(name);
    return this;
  }

  hasClass(name:string) {
    return this.el.classList.contains(name);
  }

  removeClass(name:string) {
    this.el.classList.remove(name);
    return this;
  }

  toggle(cls = 'active') {
    return this.toggleClass(cls);
  }

  toggleClass(name:string) {
    return this.el.classList.toggle(name);
  }

  active(flag = true, cls = 'active') {
    if (flag) this.addClass(cls);
    else this.removeClass(cls);
    return this;
  }

  checked(flag = true) {
    this.active(flag, 'checked');
    return this;
  }

  disabled(flag = true) {
    if (flag) this.addClass('disabled');
    else this.removeClass('disabled');
    return this;
  }

  attr(key:string|{[k:string]:any}, value?:any) {
    if (value !== undefined && typeof key === 'string') {
      this.el.setAttribute(key, value);
    } else {
      if (typeof key === 'string') {
        return this.el.getAttribute(key);
      }
      Object.keys(key).forEach((k) => {
        this.el.setAttribute(k, key[k]);
      });
    }
    return this;
  }

  removeAttr(key:string) {
    this.el.removeAttribute(key);
    return this;
  }

  html(content:string) {
    if (content !== undefined) {
      this.el.innerHTML = content;
      return this;
    }
    return this.el.innerHTML;
  }

  val(v:any) {
    if (v !== undefined) {
      (this.el as HTMLTextAreaElement).value = v;
      return this;
    }
    return (this.el as HTMLTextAreaElement).value;
  }

  focus() {
    this.el.focus();
  }

  cssRemoveKeys(...keys:string[]) {
    keys.forEach(k => this.el.style.removeProperty(k));
    return this;
  }

  // css( propertyName )
  // css( propertyName, value )
  // css( properties )
  css(name:string|Partial<CSSStyleDeclaration>, value?:any) {
    if (value === undefined && typeof name !== 'string') {
      Object.keys(name).forEach((k:string) => {
        // @ts-ignore
        this.el.style[k] = name[k];
      });
      return this;
    }
    if (value !== undefined && typeof name === 'string') {
      // @ts-ignore
      this.el.style[name] = value;
      return this;
    }
    // @ts-ignore
    return this.el.style[name];
  }

  computedStyle() {
    return window.getComputedStyle(this.el, null);
  }

  show() {
    this.css('display', 'block');
    return this;
  }

  hide() {
    this.css('display', 'none');
    return this;
  }
}

const h = (tag:string, className = '') => new Element(tag, className);

export {
  Element,
  h,
};
