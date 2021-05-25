
import StyleManager from './style-manager';
import History from './history'
import { get } from '../config';

interface GridPosition {
  rp: {[ri: number]: number},
  cp: {[ci: number]: number}
}
const windowViewport = () => ({width: window.innerWidth, height: window.innerHeight});

const countRowInfo = (rowInfo:IRowInfo, rowLen: number) => {
  const { defHeight, minHeight } = get().sizes;
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
  return rowInfo;
}

const countColInfo = (colInfo: IColInfo, colLen: number) => {
  const { defWidth, minWidth } = get().sizes;
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
  return colInfo;
}
export default class DataProxy {
  
  /** 选中的表格范围 */
  selectedRange: IRange | null = null;
  /** 拷贝表格范围 */
  copiedRange: IRange | null = null;
  /** 滚动相对位置X */
  offsetX:number = 0;
  /** 滚动相对位置Y */
  offsetY:number = 0;
  /** 表格实际大小 */
  tabelSize: ISize = { width: 0, height: 0 };
  /** 画布(视口)大小 */
  viewPort: ISize =  { width: 0, height: 0 };
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
  style: StyleManager;
  getViewPort: () => ISize = windowViewport;
  constructor(data: ISheetOptions, defaultStyle?: Partial<IStyle>) {
    this.name = data.name;
    this.grid = data.grid;
    this.rowLen = data.rowLen;
    this.rowInfo = countRowInfo(data.rowInfo, data.rowLen);
    this.colLen = data.colLen;
    this.colInfo = countColInfo(data.colInfo, data.colLen);
    this.style = new StyleManager(defaultStyle);
    this.freeze = data.freeze;
    this.getViewPort = data.getViewPort ? data.getViewPort : windowViewport;
    this.resize();
  }
  /** 更换数据源 */
  reload(data: ISheetOptions) {
    this.name = data.name;
    this.grid = data.grid;
    this.rowLen = data.rowLen;
    this.rowInfo = countRowInfo(data.rowInfo, data.rowLen);
    this.colLen = data.colLen;
    this.colInfo = countColInfo(data.colInfo, data.colLen);
    this.freeze = data.freeze;
    this.getViewPort = data.getViewPort ? data.getViewPort : windowViewport;
    this.resize();
  }
  /**
   * 计算并更新渲染时需要用到的位置信息
   */
  resize() {
    // 视口大小
    this.viewPort = this.getViewPort();
    const x = this.colInfo[this.freeze.c].left;
    const y = this.rowInfo[this.freeze.r].top;
    this.freezeRect = {
      x, y,
      width: this.viewPort.width - x,
      height: this.viewPort.height - y
    }
    // 表格大小
    this.tabelSize = {
      width: this.colInfo[this.colLen - 1].right, 
      height: this.rowInfo[this.rowLen - 1].bottom
    };
    this.updateViewRange();
  }
 
  updateViewRange() {
    const { offsetX, offsetY, freezeRect, viewPort: { width, height } } = this;
    const x = offsetX + freezeRect.x;
    const y = offsetY + freezeRect.y;
    const { ri, ci } = this.cellSearch(x, y);
    const { ri: eri, ci: eci } = this.cellSearch(offsetX + width, offsetY + height);
    this.viewRange = { ri, ci, eri: eri + 2, eci:  eci + 2 };
  }
  /** 设置偏移量，用于滚动场景 */
  setOffset(offset: {x?: number, y?: number}) {
    const { tabelSize, viewPort } = this;
    if (offset.x !== undefined) {
      this.offsetX = Math.max(Math.min(offset.x, tabelSize.width - viewPort.width), 0);
    }
    if (offset.y !== undefined) {
      this.offsetY = Math.max(Math.min(offset.y, tabelSize.height - viewPort.height), 0);
    }
    this.updateViewRange();
  }
  // ----- 选区操作 -----------------------------------------------------------------------------------
  /** 选则选区 */
  setSelectorRange(pointRange: {
    startPoint?: IPxPoint, endPoint?: IPxPoint
  }) {
    const {offsetX, offsetY, freezeRect} = this;
    const { startPoint, endPoint } = pointRange;
    if (startPoint) {
      const x = startPoint.x > freezeRect.x ? startPoint.x + offsetX : startPoint.x;
      const y = startPoint.y > freezeRect.y ? startPoint.y + offsetY : startPoint.y;
      const {ri, ci} = this.cellSearch(x, y);
      this.selectedRange = {ri,ci, eri: ri, eci: ci}
    }
    if (endPoint) {
      const x = endPoint.x > freezeRect.x ? endPoint.x + offsetX : endPoint.x;
      const y = endPoint.y > endPoint.y ? endPoint.y + offsetY : endPoint.y;
      const {ri, ci} = this.cellSearch(x, y);
      if (this.selectedRange) {
        this.selectedRange.eri = ri;
        this.selectedRange.eci = ci;
      } else {
        this.selectedRange = {ri,ci, eri: ri, eci: ci}
      }
    }
  }
  /** 移除选区 */
  clearSelectorRange() {
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
    const { index } = this.style.updateStyle(mstyle, cell.style);
    cell.style = index;
  }
  // ----- 表格操作 -----------------------------------------------------------------------------------
  /** 设置行高 */
  setRowHeight(ri: number, height: number) {
    const { minHeight } = get().sizes;
    // 更新
    this.beforeChange();
    this.rowInfo[ri].height = Math.max(minHeight, height);
    this.rowInfo = countRowInfo(this.rowInfo, this.rowLen);
    this.resize();
  }
  /** 设置列宽 */
  setColWidth(ci: number, width: number) {
    const { minWidth } = get().sizes;
    // 更新
    this.beforeChange();
    this.colInfo[ci].width = Math.max(minWidth, width);
    this.colInfo = countColInfo(this.colInfo, this.colLen);
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
}