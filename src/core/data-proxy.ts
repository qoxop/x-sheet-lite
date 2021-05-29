
import StyleManager from './style-manager';
import History from './history'
import { AxisOffset, ScrollBarWidth } from '../constant';
import MyEvent from './event';
import Formula from './formula';

const defV = (v:any, def: any) => v === undefined ? def : v;

const countRowInfo = (rowInfo:FieldOf<ISheetData, 'rowInfo'>, rowLen: number, opt: Required<IOptions>):IRowInfo => {
  const { height: defHeight, minHeight } = opt.defaultSize as Required<FieldOf<Required<IOptions>, 'defaultSize'>>;
  let hr = 0;
  for (let r = 0; r < rowLen; r++) {
    const row = rowInfo[r];
    if (!row) {
      rowInfo[r] = {
        top: hr,
        bottom: hr + defHeight,
        height: defHeight, 
        info: null,
      }
    } else {
      row.height = Math.max(row.height || defHeight, minHeight);
      row.top = hr;
      row.bottom = hr + row.height;
      rowInfo[r] = row;
    }
    hr += rowInfo[r].height;
  }
  return rowInfo as IRowInfo;
}

const countColInfo = (colInfo: FieldOf<ISheetData, 'colInfo'>, colLen: number, opt: Required<IOptions>):IColInfo => {
  const { width: defWidth, minWidth } = opt.defaultSize as Required<FieldOf<Required<IOptions>, 'defaultSize'>>;
  let wr = 0;
  for (let c = 0; c < colLen; c++) {
    const col = colInfo[c];
    if (!col) {
      colInfo[c] = {
        left: wr,
        right: wr + defWidth,
        width: defWidth,
        info: null
      }
    } else {
      col.width = Math.max(col.width || defWidth, minWidth);
      col.left = wr;
      col.right = wr + col.width;
      colInfo[c] = col;
    }
    wr += colInfo[c].width;
  }
  return colInfo as IColInfo;
}

export default class DataProxy {
  options: Required<IOptions>;
  event: MyEvent;
  formula: Formula;
  /** 选中的表格范围 */
  selectedRange: IRange | null = {ri: 1, ci: 4, eri: 1, eci: 4};
  /** 拷贝表格范围 */
  copiedRange: IRange | null = null;
  /** 滚动相对位置X */
  offsetX:number = 0;
  /** 滚动相对位置Y */
  offsetY:number = 0;
  /** 表格实际大小 */
  tabelSize: ISize = { width: 0, height: 0 };
  /** 画布(视口)大小 */
  viewport: ISize =  { width: 0, height: 0 };
  /** 可视表格范围(实际上是freeze后的可滚动范围) */
  viewRange: IRange = { ri: 0, ci: 0, eci: 0, eri: 0 };
  /** 冻结的位置(相对于画布) */
  freezeRect: IRect = {x: 0, y: 0, width: 0, height: 0};
  /** 是否编辑状态 */
  onEditing: boolean = false;
  /** 历史 */
  history: History = new History();
  // data fields 
  name:string = '';
  grid:ICell[][] = [];
  rowLen: number = 0;
  rowInfo: IRowInfo = {};
  colLen: number = 0;
  colInfo: IColInfo = {};
  freeze: ICellPoint = {r: 0, c: 0};
  constructor(data: ISheetData, options: Required<IOptions>, event:MyEvent) {
    this.options = options;
    this.event = event;
    this.name = data.name;
    this.grid = data.grid;
    this.rowLen = data.rowLen;
    this.rowInfo = countRowInfo(data.rowInfo, data.rowLen, options);
    this.colLen = data.colLen;
    this.colInfo = countColInfo(data.colInfo, data.colLen, options);
    this.freeze = data.freeze;
    this.formula = new Formula(data.formulaChains || []);
    this.formula.exec(this.updateCM, this.grid);
    this.resize(true);
  }
  /** 更换数据源 */
  reload(data: ISheetData, options: Required<IOptions>) {
    this.options = options;
    this.name = data.name;
    this.grid = data.grid;
    this.rowLen = data.rowLen;
    this.rowInfo = countRowInfo(data.rowInfo, data.rowLen, this.options);
    this.colLen = data.colLen;
    this.colInfo = countColInfo(data.colInfo, data.colLen, this.options);
    this.freeze = data.freeze;
    // this.formula = new Formula(data.formulaChains || []);
    this.offsetX = 0;
    this.offsetY = 0;
    // this.formula.exec(this.updateCM, this.grid);
    this.resize(true);
  }
  /**
   * 计算并更新渲染时需要用到的位置信息
   */
  resize(rerender?:boolean) {
    // 表格大小
    this.tabelSize = {
      width: this.colInfo[this.colLen - 1].right, 
      height: this.rowInfo[this.rowLen - 1].bottom
    };
    if (rerender) {
      this.viewport = this.options.getViewport();
    }
    // 冻结的位置信息
    const x = this.colInfo[this.freeze.c].left;
    const y = this.rowInfo[this.freeze.r].top;
    this.freezeRect = {
      x, y,
      width: this.viewport.width - x,
      height: this.viewport.height - y
    }
    // 重置offset
    if (this.tabelSize.width <= this.viewport.width) {
      this.offsetX = 0;
    } else {
      this.offsetX = Math.min(this.tabelSize.width -  this.viewport.width, this.offsetX);
    }
    if (this.tabelSize.height <= this.viewport.height) {
      this.offsetY = 0;
    } else {
      this.offsetY = Math.min(this.tabelSize.height -  this.viewport.height, this.offsetY);
    }
    // 发出超出滚动事件
    const overflowY = this.tabelSize.height > this.viewport.height - AxisOffset.y;
    const overflowX = this.tabelSize.width > this.viewport.width - AxisOffset.x;
    if (overflowY || overflowX) {
      this.event.emit('overflow', {
        overflowX,
        overflowY,
        rateX: (this.viewport.width - AxisOffset.x - ScrollBarWidth) / this.tabelSize.width,
        rateY: (this.viewport.height - AxisOffset.y - ScrollBarWidth) / this.tabelSize.height,
      });
    }
    // 更新可视范围
    this.updateViewRange();
  }
  /** 更新可视范围 */
  updateViewRange() {
    const { offsetX, offsetY, freezeRect, colLen, rowLen, viewport: { width, height } } = this;
    const x = offsetX + freezeRect.x;
    const y = offsetY + freezeRect.y;
    const { ri, ci } = this.cellSearch(x, y);
    const { ri: eri, ci: eci } = this.cellSearch(offsetX + width, offsetY + height);
    this.viewRange = { ri: Math.max(ri, 0), ci: Math.max(ci, 0), eri: Math.min(eri + 1, rowLen - 1), eci: Math.min(eci + 1, colLen - 1) };
  }
  /** 设置偏移量，用于滚动场景 */
  setOffset(offset: {x?: number, y?: number}) {
    const { tabelSize, viewport } = this;
    const fx = (this.options.showAxisNum ? AxisOffset.x : 0) + (offset.x ? ScrollBarWidth : 0);
    const fy = (this.options.showAxisNum ? AxisOffset.y : 0) + (offset.y ? ScrollBarWidth : 0);
    if (offset.x !== undefined) {
      this.offsetX = Math.max(Math.min(offset.x, tabelSize.width - (viewport.width - fx)), 0);
    }
    if (offset.y !== undefined) {
      this.offsetY = Math.max(Math.min(offset.y, tabelSize.height - (viewport.height - fy)), 0);
    }
    this.updateViewRange();
  }
  // ----- 选区操作 -----------------------------------------------------------------------------------
  /** 设置选区，选区不分割合并的单元格 */
  setSelectedRange(range:IRange) {
    const { grid } = this;
    let { ri, ci, eri, eci } = range;
    let cell_lt = grid[ri][ci];
    if (cell_lt.mc) {
      ri = cell_lt.mc.rs;
      ci = cell_lt.mc.cs;
    }
    let cell_rb = grid[eri][eci];
    if (cell_rb.mc) {
      eri = cell_rb.mc.re;
      eci = cell_rb.mc.ce;
    }
    let cell_rt = grid[ri][eci];
    let cell_lb = grid[eri][ci];
    ri = Math.min(defV(cell_lt.mc?.rs, ri), defV(cell_rt.mc?.rs, ri));
    ci = Math.min(defV(cell_lt.mc?.cs, ci), defV(cell_lb.mc?.cs, ci));
    eri = Math.max(defV(cell_lb.mc?.re, eri), defV(cell_rb.mc?.re, eri));
    eci = Math.max(defV(cell_rt.mc?.ce, eci), defV(cell_rb.mc?.ce, eci));
    this.selectedRange = { ri, ci, eri, eci }
  }
  /** 移除选区 */
  clearSelectedRange() {
    this.selectedRange = null;
  }
  /** 复制选区 */
  copy() {
    if (this.selectedRange) {
      this.copiedRange = { ...this.selectedRange };
    }
  }
  /** 清空复制区 */
  clearCopiedRange() {
    this.copiedRange = null;
  }
  /** 粘贴 */
  paste() {
    const { selectedRange: selectorRange, copiedRange, onEditing, grid } = this;
    if (
      selectorRange &&
      copiedRange &&
      onEditing === false && 
      (selectorRange.ri !== copiedRange.ri || selectorRange.ci !== copiedRange.ci)
    ) { // begin copy
      const { ri, ci, eri, eci } = copiedRange;
      const diffRi = selectorRange.ri - ri;
      const diffCi = selectorRange.ci - ci;
      this.beforeChange();
      // 更新
      for (let r = ri; r <= eri; r++) {
        for (let c = 0; c <= eci; c++) {
          const cell = grid[ri + diffRi][ci + diffCi];
          if (!cell.disableEdit) {
            cell.v = this.grid[r][c].v
          }
        }
      }
    }
  }
  /** 删除选区 */
  deleteRange(range?: IRange) {
    range = range ? range : this.selectedRange as IRange;
    if (range) {
      const { ri, ci, eri, eci } = range;
      this.beforeChange();
      // 更新
      for (let r = ri; r <= eri; r++) {
        for (let c = ci; c <= eci; c++) {
          const cell = this.grid[r][c];
          if (!cell.disableEdit) {
            cell.v = null;
          }
        }
      }
    }
  }

  // ----- 单元格操作 -----------------------------------------------------------------------------------
  /** 更新单元格 */
  updateCell(ri: number, ci: number, mcell: {v?: any, meta?: any, render?: any}) {
    // 更新
    const cell = this.grid[ri][ci];
    if (!cell.disableEdit) {
      this.beforeChange();
      if (mcell.v !== undefined) {
        cell.v = mcell.v;
      }
      if (mcell.meta !== undefined) {
        cell.meta = mcell.meta;
      }
      if (mcell.render !== undefined) {
        cell.render = mcell.render;
      }
    }
  }
  /** 更新单元格样式 */
  updateCellStyle(ri: number, ci: number, mstyle: Partial<IStyle>) {
    // 更新
    this.beforeChange();
    const cell = this.grid[ri][ci];
    const { key } = StyleManager.updateStyle(mstyle, cell.style);
    cell.style = key;
  }
  // ----- 表格操作 -----------------------------------------------------------------------------------
  /** 设置行高 */
  setRowHeight(ri: number, height: number) {
    const { minHeight } = this.options.defaultSize;
    // 更新
    this.beforeChange();
    this.rowInfo[ri].height = Math.max(minHeight as number, height);
    this.rowInfo = countRowInfo(this.rowInfo, this.rowLen, this.options);
    this.resize();
  }
  /** 设置列宽 */
  setColWidth(ci: number, width: number) {
    const { minWidth } = this.options.defaultSize;
    // 更新
    this.beforeChange();
    this.colInfo[ci].width = Math.max(minWidth as number, width);
    this.colInfo = countColInfo(this.colInfo, this.colLen, this.options);
    this.resize();
  }
  
  // ----- 表格操作 -----------------------------------------------------------------------------------
  // undo() {
  //   this.history.undo(this.data, (data) => {
  //     this.data = data;
  //     this.resize();
  //   });
  // }
  // redo() {
  //   this.history.redo(this.data, (data) => {
  //     this.data = data;
  //     this.resize();
  //   });
  // }
  /** 修改前保留记录 */
  beforeChange() {
    // this.history.add(this.data);
  }
  /**
   * 获取单元的先对像素位置
   * @param cell 
   * @returns 
   */
  cellRects(cell:ICell):IRects {
    let {r, c} = cell;
    if (!cell.mc) {
      const x = this.colInfo[c].left;
      const y = this.rowInfo[r].top;
      const width = this.colInfo[c].width;
      const height = this.rowInfo[c].height
      return [x, y, width, height]
    } else {
      const {re, rs, ce, cs} = cell.mc;
      const x = this.colInfo[cs].left;
      const y = this.rowInfo[rs].top;
      const width = this.colInfo[ce].right - x;
      const height =this.rowInfo[re].bottom - y;
      return [x, y, width, height]
    }
  }
  /**
   * 一个点所在的单元格，这个点相对于 tableSize
   * @param x 
   * @param y 
   * @returns 
   */
  cellSearch(x: number, y: number) {
    let ri = 0;
    let ci = 0;
    const { rowInfo, colInfo, rowLen, colLen } = this;
    for (let start = 0, end = colLen - 1; end - start > 1;) {
      const center = Math.ceil((start + end) / 2)
      const col = colInfo[center];
      if (x > col.right) {
        start = center;
      } else if (x < col.left) {
        end = center;
      } else {
        ci = center;
        break;
      }
      if (end - start === 1) {
        ci = start;
        break;
      }
    }
    for (let start = 0, end = rowLen - 1; end - start > 1;) {
      const center = Math.ceil((start + end) / 2)
      const row = rowInfo[center]
      if (y > row.bottom) {
        start = center;
      } else if (y < row.top) {
        end = center;
      } else {
        ri = center;
        break;
      }
      if (end - start === 1) {
        ri = start;
        break;
      }
    }
    return { ri, ci }
  };
  /**
   * 一个点所在的单元格，这个点相对于 viewport 
   * @param x 
   * @param y 
   * @returns 
   */
  cellOffsetSearch(x: number, y: number) {
    const {freezeRect, offsetX, offsetY} = this;
    if (x >= freezeRect.x) {
      x += offsetX;
    }
    if (y >= freezeRect.y) {
      y += offsetY;
    }
    return this.cellSearch(x, y);
  }
  /**
   * 一条直线所穿过的选区范围，直线位置相对于 viewport
   * @param x 
   * @param y 
   * @param xe 
   * @param ye 
   * @returns 
   */
  rangeSearch(x:number, y: number, xe: number, ye: number):IRange {
    const { ri: r1, ci: c1 } = this.cellOffsetSearch(x, y);
    const { ri: r2, ci: c2 } = this.cellOffsetSearch(xe, ye);
    // 确保 ri、ci 在左上方。  eri、eci在右下方
    return {
      ri: r1 < r2 ? r1 : r2,
      ci: c1 < c2 ? c1 : c2,
      eri: r1 >= r2 ? r1 : r2,
      eci: c1 >= c2 ? c1 : c2
    }
  }
  /**
   * 选区的位置信息
   * @param range
   * @returns 
   */
  rangeRects(range?:IRange):IRects|null {
    if (!range) {
      range = this.selectedRange as IRange;
    }
    const { freeze, freezeRect, offsetX, offsetY } = this;
    if (range) {
      // 这里不会去考虑单元格合并的情况，选区操作不会允许将合并的单元格分割开来
      const { ri, ci, eri, eci } = range;
      let top = this.rowInfo[ri].top;
      let bottom = this.rowInfo[eri].bottom;

      let left = this.colInfo[ci].left;
      let right = this.colInfo[eci].right;
      if (ri >= freeze.r) {
        top = Math.max(top - offsetY, freezeRect.y);
      }
      if (ci >= freeze.c) {
        left = Math.max(left - offsetX, freezeRect.x);
      }
      if (eri >= freeze.r) {
        bottom = Math.max(bottom - offsetY, freezeRect.y);
      }
      if (eci >= freeze.c) {
        right = Math.max(right - offsetX, freezeRect.x);
      }
      return [
        left,
        top,
        right - left,
        bottom - top,
      ]
    }
    return null;
  }
  
  private updateCM = (cm: {r: number, c: number, m: ICellM}) => {
    this.grid[cm.r][cm.c].m = cm.m;
  }
}