import { Element } from '../element';


export type InputUpdate = (data: {value: any, cell:ICell}) => void;

export type Inputing = (cell: ICell, evt: InputEvent) => boolean;

export abstract class MyInput {
  update:InputUpdate;
  onEdit:Inputing;
  el:Element;
  curCell?:ICell;
  constructor(update:InputUpdate, onEdit:Inputing) {
    this.onEdit = onEdit;
    this.update = update;
  }
  abstract display(cell:ICell, rect:IRect):void;
  abstract rePosition(rect:IRect):void;
  abstract complete(): {value:any, cell:ICell};
  abstract hide():void;
}
