import Draw from "../canvas/draw";
import DataProxy from "../core/data-proxy";

export default class Table {
  el:HTMLCanvasElement;
  data:DataProxy;
  draw: Draw;
  constructor(el: HTMLCanvasElement, data:DataProxy) {
    this.el = el;
    this.data = data;
    this.draw = new Draw(el, data.viewPort.width, data.viewPort.height);
  }
  // 界面宽度的调整
  resize() {
    const { offsetX, offsetY, tabelSize } = this.data;
    const oldViewPort = { ...this.data.viewPort };
    this.data.resize();
    const viewPort = this.data.viewPort;
    let dx = 0;
    let dy = 0;
    if (viewPort.width > oldViewPort.width) {
      dx = (viewPort.width - oldViewPort.width) - (tabelSize.width - oldViewPort.width - offsetX);
    }
    if (viewPort.height > oldViewPort.height) {
      dy = (viewPort.height - oldViewPort.height) - (tabelSize.height - oldViewPort.height - offsetX);
    }
    dx = Math.max(dx, 0);
    dy = Math.max(dy, 0);
    if (dy || dx) {
      this.data.setOffset({ x: Math.max(offsetX - dx, 0), y: Math.max(offsetY - dy, 0) })
    } else {
      this.data.updateViewRange();
    }
    // 重置 draw 对象
    this.draw = new Draw(this.el, this.data.viewPort.width, this.data.viewPort.width);
    this.render();
  }

  // 执行渲染
  render() {
    const {
      viewRange: {ri, ci},
      freezeRect: {x, y, width, height},
      viewPort,
      offsetX,
      offsetY,
      rowInfo,
      colInfo,
    } = this.data;
    const sy = rowInfo[ri].top - offsetY;
    const sx = colInfo[ci].left - offsetX;
    this.draw.clear();
    this.renderContent(sx, sy, [x, y, width, height]);
    this.renderFreeze();
    this.renderFreezeTop(sx, [x, 0, width, viewPort.height - height]);
    this.renderFreezeLeft(sy, [0, y, viewPort.width- width, height]);
    if (x && offsetX) {
      this.draw.axisXShadow(viewPort.width- width + 1, height + y)
    }
    if (y && offsetY) {
      this.draw.axisYShadow(y, width + x);
    }
  }
  renderContent(sx: number, sy: number, rect:IRects) {
    const { draw } = this;
    const {
      viewRange: {ri, ci, eri, eci},
      offsetX,
      offsetY,
      rowInfo,
      colInfo,
      grid,
      style
    } = this.data;
    const restore = this.draw.clipRect(...rect);
    this.draw.ctx.beginPath();
    let py = sy;
    for (let r = ri; r < eri; r++) {
      const row = rowInfo[r];
      let px = sx;
      for (let c = ci; c < eci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell?.mc?.rs !== undefined && r !== ri && c !== ci) { // 被合并的单元格不用渲染
          // 处理完一个格子，横坐标起点需要加上列宽
          px += col.width;
          continue;
        }
        if (cell.mc) { // 处理合并单元格的格子
          const [x, y , w, h] = this.data.cellRects(cell);
          draw.cell(
            [x - offsetX, y - offsetY, w, h],
            (cell.v as string) || '',
            style.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [px, py, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            style.getStyle(cell.style)
          );
        }
        // 处理完一个格子，横坐标起点需要加上列宽
        px += col.width;
      }
      // 每处理完一行，纵坐标的起点加上行高
      py += row.height;
    }
    restore();
  }
  renderFreeze() {
    const { draw } = this;
    const { freeze: { r: fri, c: fci }, rowInfo, colInfo, grid, style } = this.data;
    draw.ctx.beginPath();
    for (let r = 0; r < fri; r++) {
      const row = rowInfo[r];
      for (let c = 0; c < fci; c++) {
        
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell.mc) {
          const [x, y , w, h] = this.data.cellRects(cell);
          draw.cell(
            [x, y, w, h],
            (cell.v as string) || '',
            style.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [col.left, row.top, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            style.getStyle(cell.style)
          );
        }
      }
    }
  }
  renderFreezeTop(sx:number, rect:IRects) {
    const { draw } = this;
    const { freeze: { r: fri }, rowInfo, colInfo, grid, style, viewRange: { ci, eci } } = this.data;
    const restore = this.draw.clipRect( ...rect );
    this.draw.ctx.beginPath();
    for (let r = 0; r < fri; r++) {
      const row = rowInfo[r];
      let px = sx;
      for (let c = ci; c < eci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell.mc) {
          const [x, y , w, h] = this.data.cellRects(cell);
          draw.cell(
            [x, y, w, h],
            (cell.v as string) || '',
            style.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [px, row.top, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            style.getStyle(cell.style)
          );
        }
        px += col.width;
      }
    }
    restore();
  }
  renderFreezeLeft(sy:number, rect:IRects) {
    const { draw } = this;
    const { freeze: { r: fci }, rowInfo, colInfo, grid, style, viewRange: { ri, eri } } = this.data;
    const restore = this.draw.clipRect( ...rect );
    this.draw.ctx.beginPath();
    
    let py = sy;
    for (let r = ri; r < eri; r++) {
      const row = rowInfo[r];
      for (let c = 0; c < fci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell.mc) {
          const [x, y , w, h] = this.data.cellRects(cell);
          draw.cell(
            [x, y, w, h],
            (cell.v as string) || '',
            style.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [col.left, py, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            style.getStyle(cell.style)
          );
        }
      }
      py += row.height;
    }
    restore();
  }
}