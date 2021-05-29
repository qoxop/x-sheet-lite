import { h, Element } from "../element";
import { MyInput } from "./types";

/**
 * 数字输入
 */
export default class InputNumber extends MyInput {
  static $name = 'number';
  el: Element;
  curCell?:ICell;
  constructor(update:any, onEdit:any) {
    super(update, onEdit)
    this.el = h('input', 'x-sheet-lite-input-number');
    this.el.attr({ type: 'number' });
    this.el.css({ position: 'absolute', zIndex: '3' });
    this.el.on('click', (evt:MouseEvent) => {
      console.log(evt)
      evt.stopPropagation();
      evt.preventDefault();
    })
  }
  display(cell:ICell, rect:IRect) {
    this.curCell = cell;
    this.el.show();
    this.el.val(cell.v || (typeof cell.m === 'string' ? cell.m : ''));
    this.el.css({
      top: `${rect.y}px`,
      left: `${rect.x}px`,
      height: `${rect.height}px`,
      width: `${rect.width}px`
    });
    this.el.focus();
    this.el.on('input', this.onEdit);
  }
  hide() {
    this.el.el?.blur();
    this.el.unListen('input', this.onEdit);
    this.el.hide();
  }
  rePosition(rect:IRect) {
    this.el.css({
      top: `${rect.x}px`,
      left: `${rect.x}px`,
      height: `${rect.height}`,
      width: `${rect.width}`
    });
  }
  complete() {
    return {
      value: this.el.val() as string,
      cell: this.curCell as ICell
    }
  }
}