
  
import { clone } from './utils';

interface IPartialData {
  cells?:ICell[],
  rowLen:number,
  rowInfo: IRowInfo,
  colLen:number,
  colInfo:IColInfo,
  freeze:ICellPoint,
}

export default class History {
  undoItems:IPartialData[] = [];
  redoItems:IPartialData[] = [];
  constructor() {
    this.reset();
  }
  reset() {
    this.undoItems = [];
    this.redoItems = [];
  }
  add(data: IPartialData) {
    this.undoItems.push(clone(data));
    this.redoItems = [];
  }
  canUndo() {
    return this.undoItems.length > 0;
  }

  canRedo() {
    return this.redoItems.length > 0;
  }

  undo(current: IPartialData , grid:ICell[][], cb: (data: IPartialData) => void) {
    const { undoItems, redoItems } = this;
    if (this.canUndo()) {
      const redoItem = clone(current);
      const historyItem = undoItems.pop() as IPartialData;
      // 单元格需要特殊处理
      if (historyItem.cells) {
        redoItem.cells = [];
        historyItem.cells.forEach(cell => {
          const {r, c} = cell;
          // 保存当前的部分单元格状态
          redoItem.cells?.push({ ...grid[r][c] });
          // 历史还原
          grid[r][c] = cell;
        });
      }
      redoItems.push(historyItem);
      cb(historyItem);
    }
  }

  redo(current:IPartialData, grid:ICell[][], cb: (data: IPartialData) => void) {
    const { undoItems, redoItems } = this;
    if (this.canRedo()) {
      const redoItem = redoItems.pop() as IPartialData;
      const undoItem = clone(current);
      if (redoItem.cells) {
        undoItem.cells = []
        redoItem.cells.forEach(cell => {
          const {r, c} = cell;
          undoItem.cells?.push({...grid[r][c]});
          grid[r][c] = cell;
        });
      }
      undoItems.push(undoItem);
      cb(redoItem);
    }
  }
}