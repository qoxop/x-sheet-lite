import { h, Element } from './components/element';
import Scrollbox from './components/scrollbox';
import Table from './components/table';
import Input from './components/inputs';
import DataProxy from './core/data-proxy';
import MyEvent from './core/event';
import { register } from './core/formula';
import StyleManager from './core/style-manager';
import { mergeOptions, throttle } from './core/utils';


type UserEventTypes =
  'beforeCopy'| // { range name }
  'beforePaste'| // { copied: IRange, target: IRange name }
  'beforeDelete'| // { range name }
  'beforeEnter'| // { cell name }
  'beforeUpdate'| // { range name }
  'updated'| // { range name }
  'undo'| // { range name }
  'redo'| // { range name }
  'cellClick'| // { ri, ci, evt name}
  'enter' | // { cell name }
  'input'| // {cell, evt name }
  'scroll'; // { left, top name }

const defaultOptions:IOptions = {
  styleSet: {},
  defaultStyle: {
    color: '#333333',
    bgcolor: '#ffffff',
    italic: false,
    bold: false,
    fontSize: 12,
    fontName: 'Arial',
    lh: 14,
    align: 2,
    valign: 2,
    padding: 2,
    textWrap: true,
  },
  showAxisNum: false,
  lineWidth: 1,
  lineColor: '#f2f2f2',
  bgcolor: '#ededed',
  freezeStyle: { x: '#bbbbbb', y: 'shadow' },
  defaultSize: {
    width: 100,
    height: 30,
    minWidth: 60,
    minHeight: 25,
  },
  getViewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
}
export default class XSheet {
  static formulaRegister(formula: IFormula):boolean {
    return register(formula)
  }
  private $event: MyEvent = new MyEvent();
  private $hooks: {[k:string]: Function[]} = {};
  private options:Required<IOptions>;
  private container: Element;
  private table:Table;
  private scrollBox:Scrollbox;
  private input:Input;
  private dataSet: {[key:string]: DataProxy} = {};
  private curData?: DataProxy;
  throttleRender: () => void;
  constructor(id:string, options: IOptions) {
    // 合并配置
    this.options = mergeOptions(defaultOptions, options);
    // 创建 canvas 表格
    this.table = new Table(this.options);
    // 创建滚动容器
    this.scrollBox = new Scrollbox(this.options, this.$event);
    // 创建容器
    this.container = h('div', 'x-sheet-lite-container');
    // 输入组件
    this.input = new Input(this.scrollBox.componentWrap, this.updateCell, this.onInput);
    // 样式初始化
    StyleManager.init(this.options.defaultStyle as IStyle, this.options.styleSet || {});

    const dom = document.getElementById(id) as HTMLElement;
    dom.style.padding = '0px';
    dom.style.margin = '0px';
    while (dom.firstChild) {
      dom.removeChild(dom.firstChild);
    }

    dom?.appendChild(this.container.el);
    const containViewport = this.options.getViewport();
    this.container.css({ backgroundColor: this.options.bgcolor, height: `${containViewport.height}px`, width: `${containViewport.width}`, position: 'relative', overflow: 'hidden' });
    this.container.children(
      this.table.el,
      this.scrollBox.box,
      this.scrollBox.xBarEl,
      this.scrollBox.yBarEl,
    );
    this.throttleRender = throttle(() => this.curData && this.table.render(this.curData));
    this.keyEventEmiter();
    this.listen();
  }
  private onInput = (cell, evt) => this.execHooksPrevent('input', { cell, evt });
  private listen() {
    this.$event.on('touchMove', this.hanleTouchMove);
    this.$event.on('scroll', this.handleScroll);
    this.$event.on('dblclick', (evt: MouseEvent) => {
      if (this.curData) {
        const { offsetX, offsetY } = evt;
        const { cell, rect } = this.curData.findCellRectsInfo(offsetX, offsetY);
        if (cell.disableEdit) {
          return;
        }
        const canEnter = this.execHooksPrevent('beforeEnter', { cell })
        if (canEnter) {
          this.curData.clearSelectedRange();
          this.curData.onEditing = true;
          this.input.display(cell, rect);
          this.execHooks('enter', { cell });
        }
      }
    })
    // 监听 ctrl c
    this.$event.on('copy', (evt) => {
      const canCopy = this.execHooksPrevent('beforeCopy', evt);
      if (canCopy) {
        this.curData?.copy();
        this.throttleRender();
      }
    });
    // 监听 ctrl v
    this.$event.on('paste', (evt: { copied: IRange, target: IRange }) => {
      const canPaste = this.execHooksPrevent('beforePaste', evt);
      if (canPaste) {
        const range = this.curData?.paste();
        if (range) {
          this.execHooks('updated', { range });
        }
        this.throttleRender();
      }
    });
    this.$event.on('click', ({ point, evt }) => {
      if (this.curData) {
        const { ri, ci } = this.curData.cellOffsetSearch(point[0], point[1]);
        this.execHooks('cellClick', { ri, ci, evt })
      }
    })
    this.$event.on('undo', () => {
      if (this.curData) {
        const range = this.curData.undo();
        if (range) {
          this.execHooks('undo', { range });
          this.execHooks('updated', { range })
        }
        this.throttleRender();
      }
    });
    this.$event.on('redo', () => {
      if (this.curData) {
        const range = this.curData.redo();
        if (range) {
          this.execHooks('redo', { range });
          this.execHooks('updated', { range })
        }
        this.throttleRender();
      }
    });
    this.$event.on('delete', (range) => {
      const canDelete = this.execHooksPrevent('beforeDelete', { range });
      if (canDelete) {
        this.curData.deleteRange();
        this.execHooks('updated', { range });
        this.throttleRender();
      }
    });
  }
  /**
   * 键盘事件触发器
   */
  private keyEventEmiter() {
    window.addEventListener('keydown', (evt) => {
      const keyCode = evt.keyCode || evt.which;
      const { ctrlKey, metaKey, shiftKey } = evt;
      if (this.curData) {
        if (ctrlKey || metaKey) {
          switch (keyCode) {
            case 67: // Ctrl C
              this.$event.emit('copy', { range: { ...this.curData.selectedRange } });
              evt.preventDefault();
              break;
            case 86: // Ctrl V
              if (this.curData.copiedRange) {
                const { ri, ci, eri, eci } = this.curData.copiedRange;
                const { selectedRange } = this.curData;
                const diffRi = selectedRange.ri - ri;
                const diffCi = selectedRange.ci - ci;
                if (diffRi || diffCi) {
                  this.$event.emit('paste', {
                    copied: { ...this.curData.copiedRange },
                    target: {
                      ri: ri + diffRi,
                      ci: ci + diffCi,
                      eri: eri + diffRi,
                      eci: eci + diffCi,
                    },
                  })
                }
              }
              break;
            case 90:
              if (shiftKey) {
                this.$event.emit('redo', null)
              } else {
                this.$event.emit('undo', null)
              }
              break;
            default:
              break;
          }
        } else {
          switch (keyCode) {
            case 13:
              this.input.complete();
              break;
            case 8:
              if (this.curData.selectedRange) {
                this.$event.emit('delete', { ...this.curData.selectedRange })
              }
              break;
            default:
              break;
          }
        }
      }
    })
  }
  /**
   * 处理鼠标滑动事件（选区计算和渲染）
   * @param evt
   */
  private hanleTouchMove = (evt: {from: number[], to: number[], offset: IPxPoint}) => {
    const { from, to, offset = { x: 0, y: 0 } } = evt;
    if (this.curData && from && to) {
      // 选择选区时移除编辑状态
      this.curData.onEditing = false;
      this.input.complete();
      // 查找并设置选区
      const range = this.curData.rangeSearch(from[0], from[1], to[0], to[1], offset);
      this.curData.setSelectedRange(range);
      this.throttleRender();
    }
  }
  /**
   * 滚动事件处理
   * @param evt
   */
  private handleScroll = (evt: { left:number, top:number }) => {
    if (this.curData) {
      const { left, top } = evt;
      this.curData.setOffset({ x: left, y: top });
      this.throttleRender();
      // this.input.rePosition(left, top);
      this.execHooks('scroll', { left, top });
    }
  }
  /**
   * 执行更新动作
   * @param datas
   */
  private updateCell = (data: {value:any, cell:ICell}) => {
    const { value, cell } = data;
    if (this.curData) {
      const canUpdate = this.execHooksPrevent('beforeUpdate', { value, cell });
      if (canUpdate) {
        const range = this.curData.updateCell(cell.r, cell.c, { v: value });
        if (range) {
          this.execHooks('updated', { range });
        }
        this.throttleRender();
      }
    }
  }
  private execHooks = (eventName: UserEventTypes, data:any):unknown[] =>
    (this.$hooks[eventName] || []).map((fn) => fn({ name: this.curData.name, ...data }));
  private execHooksPrevent = (eventName: UserEventTypes, data:any):boolean =>
    !(this.$hooks[eventName] || []).some((fn) => fn({ name: this.curData.name, ...data }) === false);
  /**
   * 数据加载
   * @param datas
   */
  public load(datas: ISheetData[]):void {
    this.input.hide();
    const [first, ...other] = datas;
    if (first) {
      this.curData = new DataProxy(first, this.options, this.$event);
      this.dataSet[first.name] = this.curData;
      // 数据加载完需要重新调整大小
      this.scrollBox.resize(this.curData);
      this.table.resize(this.curData);
    }
    if (other && other.length) {
      other.forEach((item) => {
        this.dataSet[item.name] = new DataProxy(item, this.options, this.$event);
      });
    }
    this.throttleRender();
  }
  public changeTable(name:string):boolean {
    this.input.hide();
    if (this.curData?.name !== name && !!this.dataSet[name]) {
      this.curData = this.dataSet[name];
      this.scrollBox.resize(this.curData);
      this.table.resize(this.curData);
      return true;
    }
    return false;
  }
  /**
   * 重新调整大小
   */
  public resize = (sizeInfo: {
    rowLen?:number,
    colLen?: number,
    rowInfo?: FieldOf<ISheetData, 'rowInfo'>,
    colInfo?: FieldOf<ISheetData, 'colInfo'>,
    defWidth: number,
    defHeight: number,
  }):void => {
    this.input.hide();
    if (this.curData) {
      this.curData.resize(sizeInfo);
      const containViewport = this.options.getViewport();
      this.container.css({ backgroundColor: this.options.bgcolor, height: `${containViewport.height}px`, width: `${containViewport.width}`, position: 'relative', overflow: 'hidden' });
      this.scrollBox.resize(this.curData);
      this.table.resize(this.curData);
    }
  }
  public on(eventName: UserEventTypes, callback: Function):void {
    if (!this.$hooks[eventName]) {
      this.$hooks[eventName] = []
    }
    this.$hooks[eventName].push(callback);
  }
  public setCell = (ri: number, ci: number, mcell: { v?: any, meta?: any, m?: any}, name?:string):void => {
    const data = this.dataSet[name] || this.curData;
    if (data) {
      data.updateCell(ri, ci, mcell);
      this.throttleRender();
    }
  }
  public setCellStyle = (ri: number, ci: number, mstyle: Partial<IStyle>):void => {
    if (this.curData) {
      this.curData.updateCellStyle(ri, ci, mstyle);
      this.throttleRender();
    }
  }
  public setRowHeight = (ri: number, height: number):void => {
    if (this.curData) {
      this.curData.setRowHeight(ri, height);
      this.throttleRender();
    }
  }
  public setColWidth = (ci: number, width: number): void => {
    if (this.curData) {
      this.curData.setColWidth(ci, width);
      this.throttleRender();
    }
  }
  public getData = (name?:string): (ICell&{rinfo, cinfo})[][] => {
    if (this.curData) {
      const data = this.dataSet[name] || this.curData;
      return data.grid.map((line) => line.map((item) => ({
        ...item, rinfo: this.getRowInfo(item.r, name), cinfo: this.getColInfo(item.c, name),
      })));
    }
    return [];
  }
  public getRangeData(range:IRange, name?:string): {[k: string]: ICell} {
    if (this.curData) {
      const { grid } = (this.dataSet[name] || this.curData);
      const { ri, eri, ci, eci } = range;
      const res = {};
      for (let r = ri; r <= eri; r++) {
        for (let c = ci; c <= eci; c++) {
          const { v } = grid[r][c];
          res[`${r}_${c}`] = { r, c, v };
        }
      }
      return res;
    }
    return {}
  }
  public forceExec(tableName:string, range?:IRange):void {
    if (this.curData) {
      const data = this.dataSet[tableName] || this.curData;
      data.forceExec(range);
      this.throttleRender();
    }
  }
  public iterate = (range:IRange, callback: (cell:ICell) => void ):void => {
    if (this.curData) {
      const { grid } = this.curData;
      const { ri, ci, eci, eri } = range;
      for (let r = ri; r <= eri; r++) {
        for (let c = ci; c <= eci; c++) {
          callback(grid[r][c]);
        }
      }
    }
  }
  public getRowInfo(r: number, name?:string):any {
    const data = this.dataSet[name] || this.curData;
    if (data) {
      return data.rowInfo[r].info
    }
  }
  public getColInfo(c: number, name?:string):any {
    const data = this.dataSet[name] || this.curData;
    if (data) {
      return data.colInfo[c].info;
    }
  }
  public getCellInfo(r: number, c: number, name?: string):(ICell&{ rinfo, cinfo, name })|null {
    const data = this.dataSet[name] || this.curData;
    if (data) {
      return data.getCellInfo(r, c);
    }
    return null;
  }
}
