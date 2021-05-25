import { get } from "../config";

export default class Grid {
  rows: {[index:number]:IRow};
  columns: {[index:number]:IColumn};
  sizes = get().sizes;
  constructor(rows: {[index:number]:IRow}, colunms: {[index:number]:IColumn}) {
    this.rows = rows;
    this.columns = colunms;
  }
  cell(ri: number, ci: number):ICell {
    let row = this.rows[ri];
    if (!this.rows[ri]) {
      const cell = {v: null, r: ri, c: ci}
      this.rows[ri] = {cells: {[ci]: cell}, height: this.sizes.defHeight}
      return cell;
    }
    if (!this.rows[ri].cells[ci]) {
      const cell = {v: null, r: ri, c: ci}
      this.rows[ri].cells[ci] = cell;
      return cell;
    }
    return this.rows[ri].cells[ci];
  }
  setCell(ri: number, ci: number,  mcell: {v?: any, meta?: any, render?: any}) {
    if (!this.rows[ri]) {
      const cell = { ...mcell, r: ri, c: ci }
      this.rows[ri] = {cells: {[ci]: cell}, height: this.sizes.defHeight}
      return cell;
    }
    const cell = this.rows[ri].cells[ci] || {};
    this.rows[ri].cells[ci] = { ...cell, ...mcell, r: ri, c: ci }
  }
  setRowHeight(ri: number, height: number) {
    if (!this.rows[ri]) {
      this.rows[ri] = {cells: {}, height }
    }
    this.rows[ri].height = height;
  }
  getRowHeight(ri: number):number {
    if (!this.rows[ri]) {
      return this.sizes.defHeight;
    }
    return Math.max(this.rows[ri].height || this.sizes.defHeight, this.sizes.minHeight);
  }
  setColWidth(ci: number, width: number) {
    if (!this.columns[ci]) {
      this.columns[ci] = {width: Math.max(width, this.sizes.minWidth)}
    }
    this.columns[ci].width = Math.max(width, this.sizes.minWidth);
  }
  getColWidth(ci: number):number {
    if (!this.columns[ci]) {
      return this.sizes.defWidth;
    }
    return Math.max(this.columns[ci].width || this.sizes.defWidth, this.sizes.minWidth);
  }
}