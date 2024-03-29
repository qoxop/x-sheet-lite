import InputNumber from './input-number';
import TextArea from './textarea';
import { Inputing, InputUpdate, MyInput } from './types';
import { Element } from '../element';


const ComponentSet: {[type:string]: typeof InputNumber} = {
  'number': InputNumber,
  'text': TextArea,
}

export default class InputFactory {
  editingEl?:MyInput|null;
  cell?:ICell|null;
  elSet:{[type:string]:MyInput} = {};
  container:Element;
  update: InputUpdate;
  onEdit: Inputing;
  rectInfo:any;
  constructor(container:Element, update:InputUpdate, onEdit:Inputing) {
    this.container = container;
    this.onEdit = onEdit;
    this.update = update;
  }

  public display(cell:ICell, rect: IRect):void {
    this.rectInfo = rect;
    const type = (cell.type && ComponentSet[cell.type]) ? cell.type : 'text';
    if (this.editingEl && this.cell && cell.c !== this.cell.c && cell.r !== this.cell.r) {
      this.update(this.editingEl.complete());
      this.editingEl.hide();
    }
    if (!this.elSet[type]) {
      const Component = ComponentSet[type];
      // 新建一个 component
      this.elSet[type] = new Component(this.$update, this.onEdit);
      // 挂载到容器上
      this.container.child(this.elSet[type].el);
    }
    this.editingEl = this.elSet[type];
    this.cell = cell;
    this.editingEl.display(cell, rect);
  }
  public complete():void {
    if (this.editingEl) {
      this.update(this.editingEl.complete());
      this.hide();
    }
  }
  public rePosition(offsetX: number, offsetY: number):void {
    if (this.editingEl && this.rectInfo) {
      // eslint-disable-next-line prefer-const
      let { x, y, width, height } = this.rectInfo;
      if (this.rectInfo.fzx) {
        x += (offsetX - this.rectInfo.offsetX)
      }
      if (this.rectInfo.fzy) {
        y += (offsetY - this.rectInfo.offsetY)
      }
      this.editingEl.rePosition({ x, y, width, height });
    }
  }
  public hide = ():void => {
    if (this.editingEl) {
      this.editingEl.hide();
      this.editingEl = null;
      this.cell = null;
    }
  }
  private $update = (data: {value: any, cell:ICell}) => {
    this.update(data);
    this.hide()
  }
}
