// test
const sumAfterCi:IFormula = {
  name: 'SUM_AFTER_CI',
  calc: (r, c, grid, pstr) => {
    const line = grid[r];
    let sum = 0;
    for (let ci = c + 1; ci < line.length; ci++) {
      const cell = line[ci];
      const v = +(cell.v as string)
      if (v) {
        sum += v;
      }
    }
    return `${sum.toFixed(2)}`;
  },
  recount: (range: IRange, r, c, pstr) => {
    return range.ri <= r && range.eri >= r && range.eci > c
  }
}

const formulaSet: {[k:string]: IFormula} = {
  SUM_AFTER_CI: sumAfterCi
};
/**
 * 注册公式
 * @param formula 
 * @returns 
 */
export const register = (formula:IFormula) => {
  if (formulaSet[formula.name]) {
    formulaSet[formula.name] = formula;
    return true;
  }
  return false;  
}
export const parse = (fStr:string) => {
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
  fSet: {[k:string]: {r: number, c: number, strParams: string}[]} = {};
  constructor(fs: {r: number, c: number, f:string}[]) {
    fs.forEach(item => this.add(item));
  }
  add(item: {r: number, c: number, f:string}) {
    const res = parse(item.f);
    if (res) {
      const { name, strParams } = res;
      if (!this.fSet[name]) {
        this.fSet[name] = [];
      }
      this.fSet[name].push({ r: item.r, c: item.c, strParams: strParams });
      return true;
    }
    return false;
  }
  exec(updateCM: (cm: {r: number, c: number, m: ICellM}) => void, grid: ICell[][]) {
    // 将现有公式遍历一次
    Object.keys(this.fSet).forEach(fk => {
      const fn = formulaSet[fk];
      const items = this.fSet[fk];
      for (let i = 0; i < items.length; i++) { // 针对不同单元格进行计算
        const {r, c, strParams} = items[i];
        const cm = fn.calc(r, c, grid, strParams); // 执行计算
        updateCM({r, c, m: cm}); // 执行更新
      }
    })
  }
  execRange(range:IRange, updateCM: (cm: {r: number, c: number, m: ICellM}) => void, grid: ICell[][]) {
    Object.keys(this.fSet).forEach(fk => {
      const fn = formulaSet[fk];
      const items = this.fSet[fk];
      for (let i = 0; i < items.length; i++) {
        const {r, c, strParams} = items[i];
        if (fn.recount(range, r, c, strParams)) { // 判断是否需要重新计算更新
          const cm = fn.calc(r, c, grid, strParams);
          updateCM({r, c, m: cm});
        }
      }
    })
  }
}
