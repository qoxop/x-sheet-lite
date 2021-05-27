export function demoData(rowLen: number, colLen: number): ISheetData {
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
    rowInfo: {},
    colInfo: {},
    grid,
  }
}