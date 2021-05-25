import * as config from '../config';


export default class StyleManager {
  private protoStyle:IStyle;
  private styles: IStyle[] = [];
  constructor(style: Partial<IStyle> = {}) {
    this.protoStyle = Object.freeze({...config.get().defaultStyle, ...style })
  }
  getStyle(index?:number):IStyle {
    if (index === undefined || !this.styles[index]) {
      return Object.create(this.protoStyle);
    }
    return this.styles[index];
  }
  addStyle(style: Partial<IStyle>) {
    this.styles.push(
      Object.freeze(Object.assign(
        Object.create(this.protoStyle),
        style
      ))
    )
  }
  updateStyle(style: Partial<IStyle>, origin:IStyle | number | undefined) {
    if (typeof origin === 'number') {
      origin = this.getStyle(origin)
    }
    const newStyle = Object.assign({}, origin || {}, style) as IStyle;
    const eIndex = this.styles.findIndex((v) => this.isEqual(v, newStyle));
    if (eIndex > -1) {
      return {
        index: eIndex,
        obj: this.styles[eIndex]
      }
    }
    const styleObj = Object.freeze(
      Object.assign(
        Object.create(this.protoStyle),
        newStyle
      )
    )
    this.styles.push(styleObj);
    return {
      index: this.styles.length - 1,
      obj: this.styles[this.styles.length - 1]
    }
  }
  private isEqual(s1:IStyle, s2: IStyle) {
    const k1 = Object.keys(s1);
    const k2 = Object.keys(s2);
    if (
      k1.length !== k2.length ||
      k1.sort().join('') !== k1.sort().join('') ||
      k1.some((k) => s1[k] !== s2[k])
    ) {
      return false;
    }
    return true;
  }
}