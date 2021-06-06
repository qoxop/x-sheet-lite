import Draw from '../canvas/draw';
import { AxisOffset, TableOffsetX, TableOffsetY } from '../constant';
import DataProxy from '../core/data-proxy';
import StyleManager from '../core/style-manager';
import { defV, defVs } from '../core/utils';

export default class Table {
  el:HTMLCanvasElement;
  draw: Draw;
  options: Required<IOptions>;
  constructor(options: Required<IOptions>) {
    this.options = options;
    this.el = document.createElement('canvas');
    this.el.style.position = 'absolute';
    this.el.style.top = `${options.showAxisNum ? AxisOffset.y : 0}px`;
    this.el.style.left = `${options.showAxisNum ? AxisOffset.x : 0}px`;
    this.draw = new Draw(this.el, window.innerWidth, window.innerHeight);
  }
  resize(data:DataProxy):void {
    this.draw.resize(
      data.viewport.width + 20,
      data.viewport.height + 20,
    );
    this.render(data);
  }
  // 执行渲染
  render(data:DataProxy):void {
    const {
      viewRange: { ri, ci },
      tabelSize,
      selectedRange,
      copiedRange,
      freezeRect: { x, y, width, height },
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
    this.renderFreezeLeft(sy, [0, y, viewport.width - width, height], data);
    if (x && offsetX) {
      this.draw.axisXShadow(viewport.width - width, Math.min(height + y, tabelSize.height - TableOffsetY))
    }
    if (y && offsetY) {
      this.draw.axisYShadow(y, Math.min(width + x, tabelSize.width - TableOffsetX));
    }
    if (selectedRange) {
      const selectedbox = data.rangeRects();
      if (selectedbox) {
        const [x, y, width, height ] = selectedbox;
        if (width > 1 && height > 1) {
          this.draw.maskbox([x, y, width, height])
        }
      }
    }
    if (copiedRange) {
      const copyBox = data.rangeRects(copiedRange);
      if (copyBox) {
        const [x, y, width, height ] = copyBox;
        if (width > 1 && height > 1) {
          this.draw.dashedBorderBox([x, y, width, height ])
        }
      }
    }
  }
  renderContent(sx: number, sy: number, rect:IRects, data:DataProxy):void {
    const { draw } = this;
    const {
      viewRange: { ri, ci, eri, eci },
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
        const value = defVs([cell.m, cell.v, cell?.meta?.h]);
        if (!cell.mc) {
          draw.cell(
            [px, py, col.width, row.height],
            value,
            StyleManager.getStyle(cell.style),
          );
        } else if (cell.mc.start || c === ci || r === ri) {
          const [x, y, w, h] = data.cellRects(cell);
          draw.cell(
            [x - offsetX, y - offsetY, w, h],
            value,
            StyleManager.getStyle(cell.style),
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
  renderFreeze(data:DataProxy):void {
    const { draw } = this;
    const { freeze: { r: fri, c: fci }, rowInfo, colInfo, grid } = data;
    draw.ctx.beginPath();
    for (let r = 0; r < fri; r++) {
      const row = rowInfo[r];
      for (let c = 0; c < fci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        const value = defV(cell.m, cell.v) as string;
        if (!cell.mc) {
          draw.cell(
            [col.left, row.top, col.width, row.height],
            value,
            StyleManager.getStyle(cell.style),
          );
        } else if (cell.mc.start) {
          const [x, y, w, h] = data.cellRects(cell);
          const _cell = grid[cell.mc.rs][cell.mc.cs];
          const value = defV(_cell.m, _cell.v) as string;
          draw.cell(
            [x, y, w, h],
            value,
            StyleManager.getStyle(cell.style),
          );
        }
      }
    }
  }
  renderFreezeTop(sx:number, rect:IRects, data:DataProxy):void {
    const { draw } = this;
    const { freeze: { r: fri }, rowInfo, colInfo, offsetX, grid, viewRange: { ci, eci } } = data;
    const restore = this.draw.clipRect( ...rect );
    for (let r = 0; r < fri; r++) {
      const row = rowInfo[r];
      let px = sx;
      for (let c = ci; c <= eci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        const value = defV(cell.m, cell.v) as string;
        if (!cell.mc) {
          draw.cell(
            [px, row.top, col.width, row.height],
            value,
            StyleManager.getStyle(cell.style),
          );
        } else if (cell.mc.start || c === ci ){
          const [x, y, w, h] = data.cellRects(cell);
          const _cell = grid[cell.mc.rs][cell.mc.cs];
          const value = defV(_cell.m, _cell.v) as string;
          draw.cell(
            [x - offsetX, y, w, h],
            value,
            StyleManager.getStyle(cell.style),
          );
        }
        px += col.width;
      }
    }
    restore();
  }
  renderFreezeLeft(sy:number, rect:IRects, data:DataProxy):void {
    const { draw } = this;
    const { freeze: { r: fci }, rowInfo, colInfo, grid, offsetY, viewRange: { ri, eri } } = data;
    const restore = this.draw.clipRect( ...rect );
    let py = sy;
    for (let r = ri; r <= eri; r++) {
      const row = rowInfo[r];
      for (let c = 0; c <= fci; c++) {
        const col = colInfo[c];
        const cell = grid[r][c];
        const value = defV(cell.m, cell.v) as string;
        if (!cell.mc) {
          draw.cell(
            [col.left, py, col.width, row.height],
            value,
            StyleManager.getStyle(cell.style),
          );
        } else if (cell.mc.start || r === ri) {
          const [x, y, w, h] = data.cellRects(cell);
          const _cell = grid[cell.mc.rs][cell.mc.cs];
          const value = defV(_cell.m, _cell.v) as string;
          draw.cell(
            [x, y - offsetY, w, h],
            value,
            StyleManager.getStyle(cell.style),
          );
        }
      }
      py += row.height;
    }
    restore();
  }
}
