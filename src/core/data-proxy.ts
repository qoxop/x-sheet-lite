
// /** 矩形定位 */
// interface IRect {
//   x: number,
//   y: number,
//   width: number,
//   height: number
// }

// /** 单元格数据类型 */
// interface ICell {
//   // 行列坐标
//   r: number, c: number,
//   /** 数据源，对于要么是数字要么是字符串 */
//   v?: number|string|null,
//   /** 单元格，合并信息 */
//   mc?: { re: number, ce: number } | {rs: number, cs: number},
//   /** 样式 */
//   style?: number,
//   /** 单元格元树，用于自定义内容渲染，数据校验等 */
//   meta?: any,
//   /** 自定义单元格渲染函数 */
//   render?: string|((ctx:  CanvasRenderingContext2D, rect: IRect, cell: ICell) => void),
// }

// /** 行信息数据类型 */
// interface IRow {
//   cells: ICell[]
// }
// /**  */
// interface ISheetData {
//   rowLen: number,
//   colLen: number,
//   rows: IRow[],
//   columns: []
// }
