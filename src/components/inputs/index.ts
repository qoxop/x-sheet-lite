import InputNumber from './input-number';
// import TextArea from './textarea';
import { MyInput } from './types';
import { Element } from "../element";


const ComponentSet: {[type:string]: typeof InputNumber} = {
  'number': InputNumber,
  // 'text': TextArea 
}

export default class InputFactory {
  editingEl?:MyInput|null;
  cell?:ICell|null;
  elSet:{[type:string]:MyInput} = {};
  container:Element;
  update:any;
  onEdit:any;
  constructor(container:Element, update:any, onEdit:any) {
    this.container = container;
    this.onEdit = onEdit;
    this.update = update;
  }

  public display(cell:ICell, rect: IRect) {
    const type = (cell.type && ComponentSet[cell.type]) ? cell.type : 'number';
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
  public complete() {
    if (this.editingEl) {
      this.update(this.editingEl.complete());
      this.hide();
    }
  }
  public rePosition(rect:IRect) {
    if (this.editingEl) {
      this.editingEl.rePosition(rect);
    }
  }
  private hide = () => {
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