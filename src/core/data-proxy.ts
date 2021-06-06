
import StyleManager from './style-manager';
import History from './history'
import { AxisOffset, ScrollBarWidth, TableOffsetX, TableOffsetY } from '../constant';
import MyEvent from './event';
import Formula from './formula';
import { assign } from './utils';

const defV = (v:any, def: any) => v === undefined ? def : v;

type ICellConfig = {
  height: number,
  width: number,
  minWidth: number,
  minHeight: number,
}
const countRowInfo = (oldRowInfo: IRowInfo, newRowInfo:FieldOf<ISheetData, 'rowInfo'>, rowLen: number, sizes: FieldOf<IOptions, 'defaultSize'>):IRowInfo => {
  const { minHeight } = sizes;
  const defHeight = Math.max(sizes.height, minHeight);
  let hr = 0;
  for (let r = 0; r < rowLen; r++) {
    let originRow = oldRowInfo[r] || { top: 0, bottom: 0, height: 0 };
    const row = newRowInfo[r];
    if (!row) {
      originRow = {
        top: hr,
        bottom: hr + defHeight,
        height: defHeight,
        info: originRow.info,
      }
    } else {
      const height = Math.max(row.height || defHeight, minHeight);
      originRow = {
        info: row.info || originRow.info,
        height,
        top: hr,
        bottom: hr + height,
      }
    }
    oldRowInfo[r] = originRow;
    hr += originRow.height
  }
  return oldRowInfo;
}

const countColInfo = (oldColInfo: IColInfo, newColInfo: FieldOf<ISheetData, 'colInfo'>, colLen: number, sizes: FieldOf<IOptions, 'defaultSize'>):IColInfo => {
  const { minWidth } = sizes
  const defWidth = Math.max(minWidth, sizes.width);
  let wr = 0;
  for (let c = 0; c < colLen; c++) {
    let originCol = oldColInfo[c] || { left: 0, right: 0, width: 0 }
    const col = newColInfo[c];
    if (!col) {
      originCol = {
        left: wr,
        right: wr + defWidth,
        width: defWidth,
        info: originCol.info,
      }
    } else {
      const width = Math.max(col.width || defWidth, minWidth);
      const left = wr;
      const right = wr + width;
      originCol = {
        info: col.info || originCol.info,
        width,
        left,
        right,
      };
    }
    oldColInfo[c] = originCol;
    wr += originCol.width;
  }
  return oldColInfo;
}

export default class DataProxy {
  options: Required<IOptions>;
  cellConfig: ICellConfig;
  event: MyEvent;
  formula: Formula;
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
  viewport: ISize = { width: 0, height: 0 };
  /** 可视表格范围(实际上是freeze后的可滚动范围) */
  viewRange: IRange = { ri: 0, ci: 0, eci: 0, eri: 0 };
  /** 冻结的位置(相对于画布) */
  freezeRect: IRect = { x: 0, y: 0, width: 0, height: 0 };
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
  freeze: ICellPoint = { r: 0, c: 0 };
  constructor(data: ISheetData, options: Required<IOptions>, event:MyEvent) {
    this.options = options;
    this.cellConfig = assign({ ...options.defaultSize }, { height: data.defHeight, width: data.defWidth }) as ICellConfig;
    this.event = event;
    this.name = data.name;
    this.grid = data.grid;
    this.rowLen = data.rowLen;
    this.colLen = data.colLen;
    this.freeze = data.freeze;
    this.formula = new Formula(data.formulaChains || []);
    this.formula.exec(this.grid);
    this.resize(data);
  }
  forceExec(range?:IRange):void {
    this.formula.forceExec(this.grid, range);
  }
  /** 更换数据源 */
  reload(data: ISheetData, options: Required<IOptions>):void {
    this.options = options;
    this.cellConfig = assign({ ...options.defaultSize }, { height: data.defHeight, width: data.defWidth }) as ICellConfig;
    this.name = data.name;
    this.grid = data.grid;
    this.rowLen = data.rowLen;
    this.colLen = data.colLen;
    this.freeze = data.freeze;
    this.offsetX = 0;
    this.offsetY = 0;
    this.resize(data);
    this.formula = new Formula(data.formulaChains || []);
    this.formula.exec(this.grid);
  }
  /**
   * 计算并更新渲染时需要用到的位置信息
   */
  resize(data?:Partial<ISheetData>):void {
    if (data) {
      this.cellConfig = assign(this.cellConfig, { width: data.defWidth, height: data.defHeight })
      this.rowInfo = countRowInfo(this.rowInfo, data.rowInfo || this.rowInfo, data.rowLen || this.rowLen, this.cellConfig);
      this.colInfo = countColInfo(this.colInfo, data.colInfo || this.colInfo, data.colLen || this.colLen, this.cellConfig);
      this.viewport = this.options.getViewport();
    }
    // 表格大小
    this.tabelSize = {
      width: this.colInfo[this.colLen - 1].right + TableOffsetX,
      height: this.rowInfo[this.rowLen - 1].bottom + TableOffsetY,
    };
    // 冻结的位置信息
    const x = this.colInfo[this.freeze.c - 1].right;
    const y = this.rowInfo[this.freeze.r - 1].bottom;
    this.freezeRect = {
      x, y,
      width: this.viewport.width - x,
      height: this.viewport.height - y,
    }
    // 重置offset
    if (this.tabelSize.width <= this.viewport.width) {
      this.offsetX = 0;
    } else {
      this.offsetX = Math.min(this.tabelSize.width - this.viewport.width, this.offsetX);
    }
    if (this.tabelSize.height <= this.viewport.height) {
      this.offsetY = 0;
    } else {
      this.offsetY = Math.min(this.tabelSize.height - this.viewport.height, this.offsetY);
    }
    // 更新可视范围
    this.updateViewRange();
  }
  /** 更新可视范围 */
  updateViewRange():void {
    const { offsetX, offsetY, freezeRect, colLen, rowLen, viewport: { width, height } } = this;
    const x = offsetX + freezeRect.x;
    const y = offsetY + freezeRect.y;
    const { ri, ci } = this.cellSearch(x, y);
    const { ri: eri, ci: eci } = this.cellSearch(offsetX + width, offsetY + height);
    this.viewRange = { ri: Math.max(ri, 0), ci: Math.max(ci, 0), eri: Math.min(eri + 1, rowLen - 1), eci: Math.min(eci + 1, colLen - 1) };
  }
  /** 设置偏移量，用于滚动场景 */
  setOffset(offset: {x?: number, y?: number}):void {
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

  /** 设置选区，选区不分割合并的单元格 */
  setSelectedRange(range:IRange):void {
    const { grid } = this;
    let { ri, ci, eri, eci } = range;
    const cell_lt = grid[ri][ci];
    if (cell_lt.mc) {
      ri = cell_lt.mc.rs;
      ci = cell_lt.mc.cs;
    }
    const cell_rb = grid[eri][eci];
    if (cell_rb.mc) {
      eri = cell_rb.mc.re;
      eci = cell_rb.mc.ce;
    }
    const cell_rt = grid[ri][eci];
    const cell_lb = grid[eri][ci];
    ri = Math.min(defV(cell_lt.mc?.rs, ri), defV(cell_rt.mc?.rs, ri));
    ci = Math.min(defV(cell_lt.mc?.cs, ci), defV(cell_lb.mc?.cs, ci));
    eri = Math.max(defV(cell_lb.mc?.re, eri), defV(cell_rb.mc?.re, eri));
    eci = Math.max(defV(cell_rt.mc?.ce, eci), defV(cell_rb.mc?.ce, eci));
    this.selectedRange = { ri, ci, eri, eci }
  }
  /** 移除选区 */
  clearSelectedRange():void {
    this.selectedRange = null;
  }
  /** 清空复制区 */
  clearCopiedRange():void {
    this.copiedRange = null;
  }
  /** 复制选区 */
  copy():void {
    if (this.selectedRange && this.onEditing === false) {
      this.copiedRange = { ...this.selectedRange };
    }
  }
  /**
   * 粘贴并清空复制选区
   */
  paste():IRange|void {
    const { selectedRange, copiedRange, onEditing, grid } = this;
    if (
      selectedRange &&
      copiedRange &&
      onEditing === false &&
      (selectedRange.ri !== copiedRange.ri || selectedRange.ci !== copiedRange.ci)
    ) {
      // TODO 结构不相等不给粘贴
      const { ri, ci, eri, eci } = copiedRange;
      const diffRi = selectedRange.ri - ri;
      const diffCi = selectedRange.ci - ci;
      let canPaste = true;
      // check
      for (let r = ri; r <= eri; r++) {
        if (canPaste === false) {
          break;
        }
        for (let c = ci; c <= eci; c++) {
          const targetCell = grid[r + diffRi][c + diffCi];
          const originCell = this.grid[r][c];
          if (targetCell.disableEdit) {
            canPaste = false;
            break;
          } else if (!!(targetCell.mc) !== !!(originCell.mc)) {
            canPaste = false;
            break;
          } else if (targetCell.mc && originCell.mc) {
            canPaste = (
              targetCell.mc.rs - diffRi === originCell.mc.rs &&
              targetCell.mc.re - diffRi === originCell.mc.re &&
              targetCell.mc.cs - diffCi === originCell.mc.cs &&
              targetCell.mc.ce - diffCi === originCell.mc.ce
            )
            if (canPaste === false) {
              break;
            }
          }
        }
      }
      if (canPaste) {
        // 更新
        this.beforeChange();
        for (let r = ri; r <= eri; r++) {
          for (let c = ci; c <= eci; c++) {
            const cell = grid[r + diffRi][c + diffCi];
            const { v, m } = this.grid[r][c];
            if (!cell.disableEdit) {
              if (!cell.f) { // 无公式
                cell.v = v;
                cell.m = m;
              }
              // else { // 有公式
              //   cell.v = JSON.stringify(m);
              //   cell.m = m;
              // }
            }
          }
        }
        this.selectedRange = {
          ri: ri + diffRi,
          ci: ci + diffCi,
          eri: eri + diffRi,
          eci: eci + diffCi,
        }
        this.formula.execRange(this.selectedRange, this.grid);
        this.clearCopiedRange();
        this.afterChange({ ...this.selectedRange })
        return { ...this.selectedRange }
      }
    }
  }
  /** 删除选区 */
  deleteRange(range?: IRange):IRange|null {
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
            cell.m = '';
          }
        }
      }
      this.formula.execRange(range, this.grid);
      this.afterChange({ ...range });
      return { ...range }
    }
  }

  /** 更新单元格 */
  updateCell(ri: number, ci: number, mcell: {v?: any, meta?: any, m?: any}):IRange|null {
    // 更新
    const cell = this.grid[ri][ci];
    if (!cell.disableEdit) {
      this.beforeChange();
      if (mcell.v !== undefined) {
        cell.v = mcell.v;
        cell.m = mcell.v;
      }
      if (mcell.m !== undefined) {
        cell.m = mcell.m;
      }
      if (mcell.meta !== undefined) {
        cell.meta = mcell.meta;
      }
      this.formula.execRange(
        { ri, ci, eri: ri, eci: ci },
        this.grid,
      );
      this.afterChange({ ri, ci, eri: ri, eci: ci });
      return { ri, ci, eri: ri, eci: ci };
    }
  }
  /** 更新单元格样式 */
  updateCellStyle(ri: number, ci: number, mstyle: Partial<IStyle>):void {
    const cell = this.grid[ri][ci];
    const { key } = StyleManager.updateStyle(mstyle, cell.style);
    cell.style = key;
  }
  /** 设置行高 */
  setRowHeight(ri: number, height: number):void {
    const { minHeight } = this.cellConfig
    const newRowInfo = { [ri]: { height: Math.max(minHeight as number, height) } }
    this.rowInfo = countRowInfo(this.rowInfo, newRowInfo, this.rowLen, this.cellConfig);
    this.resize();
  }
  /** 设置列宽 */
  setColWidth(ci: number, width: number):void {
    const { minWidth } = this.cellConfig;
    const newColInfo = { [ci]: { width: Math.max(minWidth as number, width) } }
    this.colInfo = countColInfo(this.colInfo, newColInfo, this.colLen, this.cellConfig);
    this.resize();
  }

  undo():any {
    const data = this.history.undo({ grid: this.grid, selectedRange: this.selectedRange });
    if (data) {
      const { grid, selectedRange, action } = data;
      this.grid = grid;
      this.selectedRange = selectedRange;
      return action
    }
  }
  redo():any {
    const data = this.history.redo({ grid: this.grid, selectedRange: this.selectedRange });
    if (data) {
      const { grid, selectedRange, action } = data;
      this.grid = grid;
      this.selectedRange = selectedRange;
      return action
    }
  }
  /** 修改前保留记录 */
  beforeChange():void {
    this.history.add({ grid: this.grid, selectedRange: this.selectedRange });
  }
  afterChange(action:any = null):void {
    this.history.addRecored(action);
  }
  /**
   * 获取单元的先对像素位置
   * @param cell
   * @returns
   */
  cellRects(cell:ICell):IRects {
    const { r, c } = cell;
    if (!cell.mc) {
      const x = this.colInfo[c].left;
      const y = this.rowInfo[r].top;
      const width = this.colInfo[c].width;
      const height = this.rowInfo[c].height
      return [x, y, width, height]
    } else {
      const { re, rs, ce, cs } = cell.mc;
      const x = this.colInfo[cs].left;
      const y = this.rowInfo[rs].top;
      const width = this.colInfo[ce].right - x;
      const height = this.rowInfo[re].bottom - y;
      return [x, y, width, height]
    }
  }
  /**
   * 一个点所在的单元格，这个点相对于 tableSize
   * @param x
   * @param y
   * @returns
   */
  cellSearch(x: number, y: number): {ri: number, ci: number} {
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
        if (colInfo[start].right < x) {
          ci = end;
        } else {
          ci = start;
        }
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
        if (rowInfo[start].bottom < y) {
          ri = end;
        } else {
          ri = start;
        }
        break;
      }
    }
    return { ri, ci }
  }
  findCellRectsInfo(fx: number, fy: number): {cell: ICell, rect: any} {
    const { freezeRect, offsetX, offsetY } = this;
    let fzx = false;
    let fzy = false;
    if (fx - offsetX < freezeRect.x) {
      fzx = true;
      fx = fx - offsetX;
    }
    if (fy - offsetY < freezeRect.y) {
      fzy = true;
      fy = fy - offsetY;
    }
    const { ri, ci } = this.cellSearch(fx, fy);
    let cell = this.grid[ri][ci];
    if (cell.mc) {
      cell = this.grid[cell.mc.rs][cell.mc.cs];
    }
    const [x, y, width, height] = this.cellRects(cell);
    return {
      cell,
      rect: {
        x: fzx ? x + offsetX : x,
        y: fzy ? y + offsetY : y,
        width,
        height,
        fzx,
        fzy,
        offsetX,
        offsetY,
      },
    }
  }
  /**
   * 一个点所在的单元格，这个点相对于 tableSize 但是要移除冻结部分
   * @param x
   * @param y
   * @returns
   */
  cellOffsetSearch(x: number, y: number): { ri: number, ci: number } {
    const { freezeRect, offsetX, offsetY } = this;
    if (x - offsetX < freezeRect.x) {
      x -= offsetX;
    }
    if (y - offsetY < freezeRect.y) {
      y -= offsetY;
    }
    return this.cellSearch(x, y);
  }
  /**
   * 一条直线所穿过的选区范围，直线位置相对于 tableSize
   * @param x
   * @param y
   * @param xe
   * @param ye
   * @returns
   */
  rangeSearch(x:number, y: number, xe: number, ye: number, offset: IPxPoint):IRange {
    const { freezeRect, offsetX, offsetY } = this;
    // 起点，需要与一开始的 offset 比较
    const { ri: r1, ci: c1 } = this.cellSearch(
      x - offset.x < freezeRect.x ? x - offset.x : x,
      y - offset.y < freezeRect.y ? y - offset.y : y,
    );
    // 终点，需要与动态的 offset 比较
    const { ri: r2, ci: c2 } = this.cellSearch(
      xe - offsetX < freezeRect.x ? xe - offsetX : xe,
      ye - offsetY < freezeRect.y ? ye - offsetY : ye,
    );
    // 确保 ri、ci 在左上方。  eri、eci在右下方
    return {
      ri: r1 < r2 ? r1 : r2,
      ci: c1 < c2 ? c1 : c2,
      eri: r1 > r2 ? r1 : r2,
      eci: c1 > c2 ? c1 : c2,
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
  public getCellInfo(ri: number, ci: number): ICell&{rinfo: any, cinfo: any, name:string} {
    const cell = this.grid[ri][ci];
    const rinfo = this.rowInfo[cell.r].info;
    const cinfo = this.colInfo[cell.c].info;
    return { ...cell, rinfo, cinfo, name: this.name };
  }
}
