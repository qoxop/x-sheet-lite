

const formulaSet: {[k:string]: IFormula} = {};
/**
 * 注册公式
 * @param formula
 * @returns
 */
export const register = (formula:IFormula):boolean => {
  if (!formulaSet[formula.name]) {
    formulaSet[formula.name] = formula;
    return true;
  }
  return false;
}
export const parse = (fStr:string): {name:string, strParams:string}|false => {
  const matched = fStr.match(/^\=([A-Z,_]+)\((.*)\)/);
  if (matched) {
    const name = matched[1];
    const strParams = matched[2]
    if (formulaSet[name]) {
      return {
        name,
        strParams,
      }
    }
  }
  return false
}

export default class Formula {
  fSet: {[k:string]: {r: number, c: number, strParams: string, name:string}} = {};
  constructor(fs: {r: number, c: number, f:string}[]) {
    fs.forEach((item) => this.add(item));
  }
  add(item: {r: number, c: number, f:string}):boolean {
    const res = parse(item.f);
    const index = `${item.r}_${item.c}`;
    if (res && formulaSet[res.name]) {
      this.fSet[index] = { r: item.r, c: item.c, ...res }
      return true;
    }
    return false;
  }
  /** 前置刷新 */
  forceExec(grid: ICell[][], range?:IRange): void {
    if (!range) {
      this.exec(grid)
    } else {
      const countedMemoRef = {}
      const getCell = (r: number, c: number) => {
        const cell = grid[r][c];
        const res = parse(`${cell.f}`)
        if (countedMemoRef[`${r}_${c}`] || !res) { // 已经计算过 或 非公式
          return cell;
        } else { // 是公式，还未计算
          const { name, strParams } = res;
          const pCell = formulaSet[name].calc(r, c, { grid, getCell }, strParams);
          countedMemoRef[`${r}_${c}`] = true; // 执行记录
          grid[r][c] = Object.assign(cell, pCell); // 更新单元格
          return cell;
        }
      }
      Object.keys(this.fSet).forEach((fk) => {
        const { r, c, name, strParams } = this.fSet[fk];
        if (r >= range.ri && c >= range.ci && r <= range.eri && c <= range.eci) {
          const index = `${r}_${c}`;
          if (!countedMemoRef[index]) { // 未计算过
            const cell = grid[r][c];
            const fn = formulaSet[name];
            const pCell = fn.calc(r, c, { grid, getCell }, strParams); // 执行计算
            countedMemoRef[index] = true; // 执行记录
            grid[r][c] = Object.assign(cell, pCell); // 更新单元格
          }
        }
      });
    }
  }
  exec(grid: ICell[][]):void {
    const countedMemoRef = {}
    const getCell = (r: number, c: number) => {
      const cell = grid[r][c];
      const res = parse(`${cell.f}`)
      if (countedMemoRef[`${r}_${c}`] || !res) { // 已经计算过 或 非公式
        return cell;
      } else { // 是公式，还未计算
        const { name, strParams } = res;
        const pCell = formulaSet[name].calc(r, c, { grid, getCell }, strParams);
        countedMemoRef[`${r}_${c}`] = true; // 执行记录
        grid[r][c] = Object.assign(cell, pCell); // 更新单元格
        return cell;
      }
    }
    Object.keys(this.fSet).forEach((fk) => {
      const { r, c, name, strParams } = this.fSet[fk];
      const index = `${r}_${c}`;
      if (!countedMemoRef[index]) { // 未计算过
        const cell = grid[r][c];
        const fn = formulaSet[name];
        const pCell = fn.calc(r, c, { grid, getCell }, strParams); // 执行计算
        countedMemoRef[index] = true; // 执行记录
        grid[r][c] = Object.assign(cell, pCell); // 更新单元格
      }
    })
  }
  execRange(range:IRange, grid: ICell[][]):void {
    const countedMemoRef = {}
    const getCell = (r: number, c: number) => {
      const cell = grid[r][c];
      const res = parse(`${cell.f}`)
      if (countedMemoRef[`${r}_${c}`] || !res) { // 已经计算过 或 非公式
        return cell;
      } else { // 是公式，还未计算
        const { name, strParams } = res;
        const fn = formulaSet[name];
        if (fn.recount(range, cell, strParams)) { // 是否需要重新计算
          const pCell = fn.calc(r, c, { grid, getCell }, strParams);
          countedMemoRef[`${r}_${c}`] = true; // 执行记录
          grid[r][c] = Object.assign(cell, pCell); // 更新单元格
        }
        return cell;
      }
    }
    Object.keys(this.fSet).forEach((fk) => {
      const { r, c, name, strParams } = this.fSet[fk];
      const fn = formulaSet[name];
      if (fn.recount(range, grid[r][c], strParams)) {
        const cell = grid[r][c];
        const pCell = fn.calc(r, c, { grid, getCell }, strParams);
        countedMemoRef[`${r}_${c}`] = true; // 执行记录
        grid[r][c] = Object.assign(cell, pCell); // 更新单元格
      }
    })
  }
}
