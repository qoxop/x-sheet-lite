import { h, Element } from '../element';
import { Inputing, InputUpdate, MyInput } from './types';

/**
 * 数字输入
 */
export default class InputNumber extends MyInput {
  static $name = 'number';
  el: Element;
  curCell?:ICell;
  constructor(update:InputUpdate, onEdit:Inputing) {
    super(update, onEdit)
    this.el = h('input', 'x-sheet-lite-input-number');
    this.el.attr({ type: 'number' });
    this.el.css({ position: 'absolute', zIndex: '3' });
    this.el.on('click', (evt:MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();
    })
    this.el.on('input', (evt) => this.onEdit(this.curCell, evt));
  }
  display(cell:ICell, rect:IRect):void {
    this.curCell = cell;
    this.el.show();
    this.el.val(cell.v || (typeof cell.m === 'string' ? cell.m : ''));
    this.el.css({
      top: `${rect.y}px`,
      left: `${rect.x}px`,
      height: `${rect.height}px`,
      width: `${rect.width}px`,
    });
    this.el.focus();
  }
  hide():void {
    this.el.el?.blur();
    this.el.hide();
  }
  rePosition(rect:IRect):void {
    this.el.css({
      top: `${rect.y}px`,
      left: `${rect.x}px`,
      height: `${rect.height}`,
      width: `${rect.width}`,
    });
  }
  complete(): {value: string, cell: ICell} {
    return {
      value: this.el.val() as string,
      cell: this.curCell as ICell,
    }
  }
}
