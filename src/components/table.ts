import Draw from "../canvas/draw";
import { AxisOffset } from "../constant";
import DataProxy from "../core/data-proxy";
import StyleManager from '../core/style-manager';

export default class Table {
  el:HTMLCanvasElement;
  draw: Draw;
  options: Required<IOptions>;
  constructor(options: Required<IOptions>) {
    this.options =options;
    this.el = document.createElement('canvas');
    this.el.style.position = 'absolute';
    this.el.style.top = `${options.showAxisNum ? AxisOffset.y : 0}px`;
    this.el.style.left = `${options.showAxisNum ? AxisOffset.x : 0}px`;
    this.draw = new Draw(this.el, window.innerWidth, window.innerHeight);
  }
  resize(data:DataProxy) {
    this.draw.resize(data.viewport.width, data.viewport.height);
    this.render(data);
  }
  // 执行渲染
  render(data:DataProxy) {
    const {
      viewRange: {ri, ci},
      freezeRect: {x, y, width, height},
      viewport,
      offsetX,
      offsetY,
      rowInfo,
      colInfo,
    } = data;
    const sy = rowInfo[ri].top - offsetY;
    const sx = colInfo[ci].left - offsetX;
    this.draw.clear();
    this.renderContent(sx, sy, [x, y, width, height], data);
    this.renderFreeze(data);
    this.renderFreezeTop(sx, [x, 0, width, viewport.height - height], data);
    this.renderFreezeLeft(sy, [0, y, viewport.width- width, height], data);
    if (x && offsetX) {
      this.draw.axisXShadow(viewport.width - width, height + y)
    }
    if (y && offsetY) {
      this.draw.axisYShadow(y, width + x);
    }
  }
  renderContent(sx: number, sy: number, rect:IRects, data:DataProxy) {
    const { draw } = this;
    const {
      viewRange: {ri, ci, eri, eci},
      offsetX,
      offsetY,
      rowInfo,
      colInfo,
      grid,
    } = data;
    const restore = this.draw.clipRect(...rect);
    let py = sy;
    for (let r = ri; r <= eri; r++) {
      const row = rowInfo[r];
      let px = sx;
      for (let c = ci; c <= eci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell?.mc?.rs !== undefined && r !== ri && c !== ci) { // 被合并的单元格不用渲染
          // 处理完一个格子，横坐标起点需要加上列宽
          px += col.width;
          continue;
        }
        if (cell.mc) { // 处理合并单元格的格子
          const [x, y , w, h] = data.cellRects(cell);
          draw.cell(
            [x - offsetX, y - offsetY, w, h],
            (cell.v as string) || '',
            StyleManager.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [px, py, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            StyleManager.getStyle(cell.style)
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
  renderFreeze(data:DataProxy) {
    const { draw } = this;
    const { freeze: { r: fri, c: fci }, rowInfo, colInfo, grid } = data;
    draw.ctx.beginPath();
    for (let r = 0; r < fri; r++) {
      const row = rowInfo[r];
      for (let c = 0; c < fci; c++) {
        
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell.mc) {
          const [x, y , w, h] = data.cellRects(cell);
          draw.cell(
            [x, y, w, h],
            (cell.v as string) || '',
            StyleManager.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [col.left, row.top, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            StyleManager.getStyle(cell.style)
          );
        }
      }
    }
  }
  renderFreezeTop(sx:number, rect:IRects, data:DataProxy) {
    const { draw } = this;
    const { freeze: { r: fri }, rowInfo, colInfo, grid, viewRange: { ci, eci } } = data;
    const restore = this.draw.clipRect( ...rect );
    for (let r = 0; r < fri; r++) {
      const row = rowInfo[r];
      let px = sx;
      for (let c = ci; c <= eci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell.mc) {
          const [x, y , w, h] = data.cellRects(cell);
          draw.cell(
            [x, y, w, h],
            (cell.v as string) || '',
            StyleManager.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [px, row.top, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            StyleManager.getStyle(cell.style)
          );
        }
        px += col.width;
      }
    }
    restore();
  }
  renderFreezeLeft(sy:number, rect:IRects, data:DataProxy) {
    const { draw } = this;
    const { freeze: { r: fci }, rowInfo, colInfo, grid, viewRange: { ri, eri } } = data;
    const restore = this.draw.clipRect( ...rect );
    let py = sy;
    for (let r = ri; r <= eri; r++) {
      const row = rowInfo[r];
      for (let c = 0; c < fci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        if (cell.mc) {
          const [x, y , w, h] = data.cellRects(cell);
          draw.cell(
            [x, y, w, h],
            (cell.v as string) || '',
            StyleManager.getStyle(cell.style)
          );
        } else {
          draw.cell(
            [col.left, py, col.width, row.height],
            (cell.v as string) || `${r}-${c}`,
            StyleManager.getStyle(cell.style)
          );
        }
      }
      py += row.height;
    }
    restore();
  }
}