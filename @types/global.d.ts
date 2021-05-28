interface ICellPoint {
  r:number,
  c:number
}
interface IPxPoint {
  x:number,
  y:number
}

interface ISize {
  width:number;
  height:number;
}

/** 矩形定位 */
type IRects = [x: number,  y: number, width: number, height: number];
interface IRect {
  x: number,
  y: number,
  width: number,
  height: number
}

/**
 * 表格展示值，支持多样式字符串
 */
type ICellM = string | number | {s: string, t: string, wrap?: boolean}[];

/** 单元格数据类型 */
interface ICell {
  // 行列坐标
  r: number, c: number,
  /** 数据源 */
  v?: number|string|null,
  m?: ICellM,
  /** 单元格的合并信息 */
  mc?: { re: number, ce: number, rs: number, cs: number, start?: boolean},
  /** 样式 */
  style?: string,
  /** 单元格元树，用于自定义内容渲染，数据校验等 */
  meta?: any,
  disableEdit?: boolean,
  /** 自定义单元格渲染函数 */
  render?: string|((ctx:  CanvasRenderingContext2D, rect: IRect, cell: ICell) => void),
}
interface IRowInfo {
  [index: number]: {
    top: number;
    bottom: number;
    height: number, 
    info?: any
  }
}
interface IColInfo {
  [index: number]: {
    left: number;
    right: number;
    width: number;
    info?: any;
  }
}

/** 表格数据以及配置 */
interface ISheetData {
  name: string,
  rowLen: number,
  colLen: number,
  freeze: {r: number, c: number},
  grid: ICell[][];
  rowInfo: {[index:number]: {height: number, info?: any, [k:string]:any }};
  colInfo: {[index:number]: {width: number, info?:any, [k:string]:any }};
}

interface IRange {
  ri: number,
  ci: number,
  eri: number,
  eci: number,
}

interface IStyle {
  color:string,    // 字体颜色
  bgcolor:string,  // 单元格背景颜色
  fontSize:number, // 字体大小
  fontName:string, // 字体名字
  bold:boolean,    // 加粗
  italic:boolean,  // 斜体
  lh: number,      // 行高
  align: 0|1|2,    // 水平对齐，0: 左对齐  1: 右对齐   2: 居中对齐
  valign: 0|1|2,   // 垂直对齐，0: 顶对齐  1: 底对齐   2: 居中对齐
  textWrap:boolean,   // 是否自动换行
  padding:number,     // 单元格内边距
  [k:string]:any,
}


interface IOptions {
  showAxisNum?: boolean,
  lineWidth?: number,
  lineColor?: string,
  bgcolor?:string,
  freezeStyle?: {
    x?: string | 'shadow',
    y?: string | 'shadow',
  },
  styleSet?: {[key:string]: Partial<IStyle>},
  defaultStyle?: Partial<IStyle>,
  defaultSize?: {
    height?: number,
    width?: number,
    minHeight?: number,
    minWidth?: number,
  },
  getViewport?: () => {width: number, height: number},
  [key:string]:any
}


interface IFormula {
  name:string,
  calc: (r: number, c: number,grid: ICell[][], paramsStr:string) => ICellM;
  recount: (range: IRange, r: number, c: number, paramsStr:string) => boolean;
}

type FieldOf<T, K extends keyof T> = T[K];