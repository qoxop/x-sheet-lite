let defaultStyle:IStyle;
let styleSet: {[k:string]: IStyle} = {};

let keyIndex = 1;
const keyMaker = ():string => {
  keyIndex++;
  return `#sheet-style-${keyIndex}`
}

function isEqual(s1:Partial<IStyle>, s2: Partial<IStyle>):boolean {
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

function NewStyle(style:Partial<IStyle>):IStyle {
  return Object.freeze(
    Object.assign(
      Object.create(defaultStyle),
      style,
    ),
  )
}

export default {
  init(defStyle: IStyle, styles: {[k:string]: Partial<IStyle>}):void {
    // reset
    defaultStyle = defStyle;
    styleSet = {};
    // setting
    Object.keys(styles).forEach((k) => {
      styleSet[k] = NewStyle(styles[k]);
    });
  },
  getStyle(key?:string):IStyle {
    if (key === undefined || !styleSet[key]) {
      return Object.create(defaultStyle);
    }
    return styleSet[key];
  },
  addStyle(key:string, style:Partial<IStyle>):void {
    styleSet[key] = NewStyle(style);
  },
  updateStyle(style: Partial<IStyle>, origin:IStyle | string | undefined): {key: string, style:IStyle} {
    if (typeof origin === 'string') {
      origin = styleSet[origin];
    }
    const newStyle = Object.assign({}, origin || {}, style);
    const key = Object.keys(styleSet).find((k) => isEqual(newStyle, styleSet[k]));
    if (key) {
      return { key, style: styleSet[key] }
    }
    const newKey = keyMaker();
    styleSet[newKey] = NewStyle(newStyle);
    return { key: newKey, style: styleSet[newKey] }
  },
}
