
export default class History {
  undoItems:string[] = [];
  redoItems:string[] = [];
  constructor() {
    this.undoItems = [];
    this.redoItems = [];
  }

  add(data:ISheetData) {
    this.undoItems.push(JSON.stringify(data));
    this.redoItems = [];
  }
  
  canUndo() {
    return this.undoItems.length > 0;
  }

  canRedo() {
    return this.redoItems.length > 0;
  }

  undo(currentd:ISheetData, cb: (data: ISheetData) => void) {
    const { undoItems, redoItems } = this;
    if (this.canUndo()) {
      redoItems.push(JSON.stringify(currentd));
      cb(JSON.parse(undoItems.pop() as string));
    }
  }

  redo(currentd:ISheetData, cb: (data: ISheetData) => void) {
    const { undoItems, redoItems } = this;
    if (this.canRedo()) {
      undoItems.push(JSON.stringify(currentd));
      cb(JSON.parse(redoItems.pop() as string));
    }
  }
}