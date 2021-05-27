export interface IFormula {
  name:string,
  calc: (fStr:string, cell:ICell, grid:ICell[][]) => string|number|{s:string, t:string}[],
  listener?: (updateRange:IRange, grid:ICell[][], update: (cell:ICell) => boolean) => boolean
}

const formulaSet: {[k:string]: IFormula} = {};

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
    const paramsStr = matched[2]
    if (formulaSet[name]) {
      return {
        formula: formulaSet[name],
        paramsStr,
      }
    }
  }
  return false
}