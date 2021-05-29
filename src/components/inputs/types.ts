import { h, Element } from "../element";

export abstract class MyInput {
  update:any;
  onEdit:any;
  // @ts-ignore
  el:Element;
  constructor(update:any, onEdit:any) {
    this.onEdit = onEdit;
    this.update = update;
  }
  abstract display(cell:ICell, rect:IRect):void;
  abstract rePosition(rect:IRect):void;
  abstract complete(): {value:any, cell:ICell};
  abstract hide():void;
}