interface IPoint {
  x:number,
  y:number
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
  v?: number|string|((r:number, c: number) => number|string)|null,
  /** 单元格的合并信息 */
  mc?: { re: number, ce: number } | {rs: number, cs: number},
  /** 样式 */
  style?: number,
  /** 单元格元树，用于自定义内容渲染，数据校验等 */
  meta?: any,
  /** 自定义单元格渲染函数 */
  render?: string|((ctx:  CanvasRenderingContext2D, rect: IRect, cell: ICell) => void),
}

/** 行信息数据类型 */
interface IRow {
  cells: {[index: number]: ICell},
  info?: any,
  style?: number,
  height?: number,
}

/**
 * 列信息数据结构
 */
interface IColumn {
  width: number,
  info?: any,
  style?:number,
}

/** 表格数据 */
interface ISheetData {
  name: string,
  rowLen: number,
  colLen: number,
  styles?: any[],
  freeze?: {r: number} | {c: number} | {r: number, c: number},
  rows?: {[index: number]: IRow},
  columns?: {[index: number]: IColumn}
}

interface ITextStyle {
  color:string,
  font: {
    italic?:boolean, // 是否斜体
    bold?:boolean,   // 是否加粗
    size: number,    // 字体大小
    name: string,    // 字体名
  },
  lh: number, // 行高
  align: 0|1|2;
  valign: 0|1|2;
}

interface ICellStyle extends Partial<ITextStyle> {
  textWrap:boolean,
  bgcolor:string,
  padding:number,
}

type FieldOf<T, K extends keyof T> = T[K];