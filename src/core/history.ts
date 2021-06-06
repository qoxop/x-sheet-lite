


interface IData {
  grid: ICell[][];
  selectedRange: IRange|null;
  action?: any
}
// 先支持单元格的撤销和重做，其他的以后再考虑
export default class History {
  undoItems:string[] = [];
  redoItems:string[] = [];
  undoActions: any[] = [];
  redoActions: any[] = [];
  constructor() {
    this.reset();
  }
  reset():void {
    this.undoItems = [];
    this.redoItems = [];
  }
  addRecored(action = null): void { // 修改之后调用
    this.undoActions.push(action);
    this.redoActions = [];
  }
  add(data: IData):void { // 修改之前调用
    this.undoItems.push(JSON.stringify(data));
    this.redoItems = [];
  }
  canUndo():boolean {
    return this.undoItems.length > 0;
  }

  canRedo():boolean {
    return this.redoItems.length > 0;
  }

  undo(current: IData):IData|null {
    const { undoItems, redoItems, undoActions, redoActions } = this;
    if (this.canUndo()) {
      redoItems.push(JSON.stringify(current));
      const action = undoActions.pop();
      redoActions.push(action); // 将当前的动作存起来
      return { ... JSON.parse(undoItems.pop()), action: action }; // 取出旧数据
    }
    return null;
  }

  redo(current:IData):IData|null {
    const { undoItems, redoItems, undoActions, redoActions } = this;
    if (this.canRedo()) {
      undoItems.push(JSON.stringify(current));
      const action = redoActions.pop();
      undoActions.push(action);
      return { ...JSON.parse(redoItems.pop()), action }
    }
    return null
  }
}
