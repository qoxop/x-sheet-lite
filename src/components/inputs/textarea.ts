import { h, Element } from '../element';
import { Inputing, InputUpdate, MyInput } from './types';

/**
 * 数字输入
 */
export default class TextArea extends MyInput {
  static $name = 'number';
  el: Element;
  curCell?:ICell;
  constructor(update:InputUpdate, onEdit:Inputing) {
    super(update, onEdit)
    this.el = h('textarea', 'x-sheet-lite-textarea');
    this.el.attr({ type: 'number' });
    this.el.css({ position: 'absolute', zIndex: '3' });
    this.el.on('click', (evt:MouseEvent) => {
      evt.stopPropagation();
      evt.preventDefault();
    })
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
    this.el.on('input', (evt: InputEvent) => this.onEdit(this.curCell, evt));
  }
  hide():void {
    this.el.el?.blur();
    this.el.unListen('input', this.onEdit);
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
  complete(): {value: string, cell:ICell} {
    return {
      value: this.el.val() as string,
      cell: this.curCell as ICell,
    }
  }
}
