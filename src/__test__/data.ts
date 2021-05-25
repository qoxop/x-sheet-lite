

// name: string,
// rowLen: number,
// colLen: number,
// styles?: Partial<IStyle>[],
// freeze: {r: number, c: number},
// grid: ICell[][];
// rowInfo: IRowInfo;
// colInfo: IColInfo;
export function demoData(rowLen: number, colLen: number): ISheetOptions {
  const grid: ICell[][] = [];
  for (let r = 0; r < rowLen; r++) {
    const row: ICell[]= [];
    for (let c = 0; c < colLen; c++) {
      row.push({
        v: null,
        r,
        c,
      });
    }
    grid.push(row);
  }
  return {
    name: '888',
    freeze: { r: 4, c: 3 },
    rowLen,
    colLen,
    styles: [],
    rowInfo: {},
    colInfo: {},
    grid,
    getViewPort: () => ({width: window.innerWidth, height: window.innerHeight})
  }
}