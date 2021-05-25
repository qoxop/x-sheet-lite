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

/** 单元格数据类型 */
interface ICell {
  // 行列坐标
  r: number, c: number,
  /** 数据源，对于要么是数字要么是字符串, 或者是一个函数 */
  v?: number|string|((r:number, c: number, grid: ICell[][]) => number|string)|null,
  /** 单元格的合并信息 */
  mc?: { re: number, ce: number, rs: number, cs: number, main?: boolean},
  /** 样式 */
  style?: number,
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
    info: any
  }
}
interface IColInfo {
  [index: number]: {
    left: number;
    right: number;
    width: number;
    info: any;
  }
}

/** 表格数据以及配置 */
interface ISheetOptions {
  name: string,
  rowLen: number,
  colLen: number,
  styles?: Partial<IStyle>[],
  freeze: {r: number, c: number},
  grid: ICell[][];
  rowInfo: IRowInfo;
  colInfo: IColInfo;
  getViewPort: () => {width: number, height: number}
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

interface IConfig {
  gridStyle: {
    width: number,
    color: string,
  },
  defaultStyle: IStyle,
  sizes: {
    minWidth: number,
    defWidth: number,
    minHeight: number,
    defHeight: number
  },
  sliceStrategy: (rows: number, cols: number) => number
}

type FieldOf<T, K extends keyof T> = T[K];